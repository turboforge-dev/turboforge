import { execFile, execSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { CACHE_DIR } from "./forge.const.ts";
import { readJson } from "./utils.ts";

const execFileAsync = promisify(execFile);

type Pkg = {
  name: string;
  dir: string;
};

const ROOT = process.cwd();
const PKG_CONFIG = path.join(ROOT, `${CACHE_DIR}/packages.json`);
const token = process.env["CODECOV_TOKEN"]?.trim();
const CODECOV_VERSION = "v11.3.1"; // Pinned version for reproducible, reliable CI
const MAX_CONCURRENCY = 4; // Prevent rate-limiting / overwhelming upload endpoint
const failCiIfError = process.env["CODECOV_FAIL_CI_IF_ERROR"] === "true";

if (!token) {
  console.log(
    "No CODECOV_TOKEN found in environment. Skipping Codecov upload.",
  );
  process.exit(0);
}

// Lightweight concurrency limiter
const createLimiter = (concurrency: number) => {
  let active = 0;
  const queue: (() => void)[] = [];
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    while (active >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
};

const limit = createLimiter(MAX_CONCURRENCY);

const getCodecovBinary = async () => {
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";
  const binaryName = isWindows ? "codecov.exe" : "codecov";
  const binDir = path.join(ROOT, "node_modules/.bin");
  const binPath = path.join(binDir, binaryName);

  if (existsSync(binPath)) return binPath;

  const platform = isWindows
    ? "windows/codecov.exe"
    : isMac
      ? "macos/codecov"
      : "linux/codecov";
  const url = `https://cli.codecov.io/${CODECOV_VERSION}/${platform}`;
  console.log(`Downloading Codecov CLI (${CODECOV_VERSION}) from ${url}...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to download Codecov binary from ${url}: ${res.status} ${res.statusText}`,
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());

  mkdirSync(binDir, { recursive: true });
  writeFileSync(binPath, buf);
  if (!isWindows) {
    chmodSync(binPath, 0o755);
  }
  return binPath;
};

const binary = await getCodecovBinary();
const packages = await readJson<Pkg[]>(PKG_CONFIG);

const isCI = process.env["GITHUB_ACTIONS"] === "true";
const slug = process.env["GITHUB_REPOSITORY"] || "turboforge-dev/turboforge";

// Determine commit SHA and PR number without shell execution
let commitSha = "";
let prNumber = "";

if (isCI) {
  const eventPath = process.env["GITHUB_EVENT_PATH"];
  if (eventPath && existsSync(eventPath)) {
    try {
      const eventData = JSON.parse(readFileSync(eventPath, "utf8"));
      if (eventData.pull_request) {
        commitSha = eventData.pull_request.head?.sha || "";
        prNumber = String(eventData.pull_request.number || "");
      }
    } catch {
      // fallback
    }
  }
  if (!commitSha) {
    commitSha = process.env["GITHUB_SHA"] || "";
  }
} else {
  try {
    commitSha = execSync("git rev-parse HEAD").toString().trim();
  } catch {
    // fallback
  }
}

const activePackages = (packages ?? []).filter((pkg) => {
  const pkgBasename = path.basename(pkg.dir);
  const lcovFile = path.join(ROOT, "coverage", `${pkgBasename}.lcov`);
  return existsSync(lcovFile);
});

console.log(
  `Found ${activePackages.length} package coverage files to upload in parallel (concurrency limit: ${MAX_CONCURRENCY}).`,
);

// 1. Initialize commit metadata in Codecov
const commitArgs = ["create-commit", "-t", token, "-r", slug];
if (failCiIfError) commitArgs.push("-Z");
if (commitSha) commitArgs.push("-C", commitSha);
if (prNumber) commitArgs.push("-P", prNumber);
const refName = process.env["GITHUB_REF_NAME"];
if (refName) {
  commitArgs.push("-B", refName);
}

try {
  console.log("Registering commit with Codecov...");
  await execFileAsync(binary, commitArgs);
  console.log("Codecov commit registered.");
} catch (err: unknown) {
  const error = err as { message?: string; stdout?: string; stderr?: string };
  console.warn(
    `Warning: create-commit notification failed: ${error.message || ""}`,
  );
}

// 2. Initialize report in Codecov
const reportArgs = ["create-report", "-t", token, "-r", slug];
if (failCiIfError) reportArgs.push("-Z");
if (commitSha) reportArgs.push("-C", commitSha);
if (prNumber) reportArgs.push("-P", prNumber);

try {
  console.log("Initializing coverage report on Codecov...");
  await execFileAsync(binary, reportArgs);
  console.log("Codecov report initialized.");
} catch (err: unknown) {
  const error = err as { message?: string; stdout?: string; stderr?: string };
  console.warn(
    `Warning: create-report notification failed: ${error.message || ""}`,
  );
}

const uploadTasks = activePackages.map((pkg) =>
  limit(async () => {
    const pkgBasename = path.basename(pkg.dir);
    const lcovFile = path.join(ROOT, "coverage", `${pkgBasename}.lcov`);

    console.log(`Uploading: ${pkg.name} (${pkgBasename}.lcov)...`);

    // Use argument array with execFile to avoid any shell interpolation/injection
    const args = [
      "do-upload",
      "--token",
      token,
      "--file",
      lcovFile,
      "--flag",
      pkg.name,
      "--name",
      pkg.name,
      "--disable-search",
      "-r",
      slug,
    ];

    if (failCiIfError) {
      args.push("-Z");
    }

    if (commitSha) {
      args.push("-C", commitSha);
    }
    if (prNumber) {
      args.push("-P", prNumber);
    }

    try {
      const { stdout, stderr } = await execFileAsync(binary, args);
      const output = `${stdout || ""}\n${stderr || ""}`.trim();
      const urlMatch = output.match(/https:\/\/app\.codecov\.io\/[^\s)]+/);
      const reportUrl = urlMatch ? urlMatch[0] : "";

      if (reportUrl) {
        console.log(`[${pkg.name}] Done -> ${reportUrl}`);
      } else {
        console.log(`[${pkg.name}] Upload completed.`);
      }
      return { pkg: pkg.name, success: true };
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        stdout?: string;
        stderr?: string;
      };
      console.error(
        `[${pkg.name}] Upload failed: ${error.message || ""}\n${error.stderr || error.stdout || ""}`,
      );
      throw new Error(`Upload failed for ${pkg.name}`);
    }
  }),
);

const results = await Promise.allSettled(uploadTasks);

const failures = results.filter((r) => r.status === "rejected");

if (failures.length > 0) {
  const msg = `${failures.length} of ${results.length} package coverage uploads failed.`;
  if (failCiIfError) {
    console.error(`\n${msg}`);
    process.exit(1); // Propagate failure to CI
  } else {
    console.warn(
      `\nWarning: ${msg}\nEnsure CODECOV_TOKEN in GitHub repository secrets is valid for ${slug} on https://app.codecov.io/gh/${slug}/settings. Continuing without failing CI.`,
    );
  }
}

console.log(
  `\nAll ${results.length} package coverage uploads completed successfully.`,
);
