import { readdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

import {
  atomicWrite,
  createLimiter,
  execAsync,
  existsAsync,
  getWorkspacePackages,
  prompt,
  readJson,
} from "./utils.ts";

const limiter = createLimiter(10);

interface RebrandConfig {
  owner: string;
  repo: string;
  title: string;
  author?: string;
}

/**
 * Safely trims Husky pre-commit hook.
 *
 * Removes any content after the marker:
 * "# Update .forge-meta.json"
 *
 * This ensures the target repo maintains its own metadata state.
 */
const updateHusky = async (): Promise<void> => {
  const preCommitPath = resolve(".husky/pre-commit");
  if (!(await existsAsync(preCommitPath))) return;
  const content = await readFile(preCommitPath, "utf-8");

  const marker = "# Update .forge-meta.json";
  if (!content.includes(marker)) return;

  const next = content.split(marker)[0];
  await atomicWrite(preCommitPath, next);
};

/**
 * Rewrites `workspace:*` dependencies → `latest`
 *
 * Note:
 * - This is destructive to version intent
 * - Intended for template → publish scenarios
 */
const handleWorkspaceDeps = async (): Promise<void> => {
  const pkgs = await getWorkspacePackages();

  await Promise.all(
    pkgs.map((pkg) =>
      limiter(async () => {
        const pkgJsonPath = resolve(pkg.dir, "package.json");

        const pkgJson = await readJson<{
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        }>(pkgJsonPath);

        if (!pkgJson) {
          throw new Error(`Failed to read package.json at ${pkgJsonPath}`);
        }

        for (const depType of ["dependencies", "devDependencies"] as const) {
          const deps = pkgJson[depType];
          if (!deps) continue;

          for (const name of Object.keys(deps)) {
            if (
              deps[name].startsWith("workspace:") &&
              !name.startsWith("@tool/")
            ) {
              deps[name] = "latest";
            }
          }
        }

        await atomicWrite(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
      }),
    ),
  );
};

/**
 * Extracts GitHub repo slug from remote URL.
 *
 * Supports:
 * - https://github.com/user/repo
 * - git@github.com:user/repo
 */
const parseRepoSlug = (url: string): string => {
  const cleaned = url.replace(/\.git$/, "").trim();

  // HTTPS
  const httpsMatch = cleaned.match(/github\.com\/(.+)$/);
  if (httpsMatch) return httpsMatch[1];

  // SSH
  const sshMatch = cleaned.match(/github\.com:(.+)$/);
  if (sshMatch) return sshMatch[1];

  return "";
};

/**
 * Rebrands repository references, configurations, and metadata from rebrand config.
 */
const rebrand = async (): Promise<void> => {
  const rebrandConfigPath = resolve("tooling/scripts/rebrand.config.json");
  const existingConfig = (await readJson<RebrandConfig>(rebrandConfigPath)) || {
    owner: "turboforge-dev",
    repo: "turboforge",
    title: "Turboforge",
  };

  let detectedSlug = "";
  try {
    const { stdout } = await execAsync("git remote get-url --push origin");
    detectedSlug = parseRepoSlug(stdout.toString());
  } catch {
    // remote origin might not exist yet
  }

  const defaultSlug =
    detectedSlug || `${existingConfig.owner}/${existingConfig.repo}`;
  const repoSlug = await prompt("Enter repo slug (user/repo)", defaultSlug);

  const parts = repoSlug.split("/");
  const owner = parts[0] || existingConfig.owner;
  const repoName = parts[1] || existingConfig.repo;

  const defaultTitle =
    existingConfig.title !== "Turboforge"
      ? existingConfig.title
      : repoName
          .split(/[-_]/)
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ") || "My Project";

  const projectName = await prompt("Enter project display name", defaultTitle);

  let detectedAuthor = "";
  try {
    const { stdout } = await execAsync("git config user.name");
    detectedAuthor = stdout.toString().trim();
  } catch {}

  const author = await prompt(
    "Enter author name",
    detectedAuthor || existingConfig.author || owner,
  );

  // 1. Update tooling/scripts/rebrand.config.json
  const updatedConfig: RebrandConfig = {
    owner,
    repo: repoName,
    title: projectName,
    author,
  };
  await atomicWrite(
    rebrandConfigPath,
    `${JSON.stringify(updatedConfig, null, 2)}\n`,
  );
  console.log("Updated tooling/scripts/rebrand.config.json");

  // 2. Update SECURITY.md
  const securityPath = resolve("SECURITY.md");
  if (await existsAsync(securityPath)) {
    const content = await readFile(securityPath, "utf-8");
    const next = content.replace(/turboforge-dev\/turboforge/g, repoSlug);
    await atomicWrite(securityPath, next);
    console.log("Updated SECURITY.md");
  }

  // 3. Update .changeset/config.json
  const changesetPath = resolve(".changeset/config.json");
  const changesetConfig = await readJson<{
    changelog?: [string, { repo?: string }];
    [key: string]: unknown;
  }>(changesetPath);

  if (
    changesetConfig &&
    Array.isArray(changesetConfig.changelog) &&
    changesetConfig.changelog[1]
  ) {
    changesetConfig.changelog[1].repo = repoSlug;
    await atomicWrite(
      changesetPath,
      `${JSON.stringify(changesetConfig, null, 2)}\n`,
    );
    console.log("Updated .changeset/config.json repo slug");
  }

  // 4. Update apps/web/src/meta.json
  // layout.tsx and layout.shared.tsx consume meta.json for title, branding, and alt text
  const webMetaPath = resolve("apps/web/src/meta.json");
  const webMeta = await readJson<{
    name: string;
    githubUrl: string;
    author: string;
    license?: string;
    year?: number;
    defaultPkgDir?: string;
    [key: string]: unknown;
  }>(webMetaPath);

  if (webMeta) {
    webMeta.name = projectName;
    webMeta.githubUrl = `https://github.com/${repoSlug}`;
    webMeta.author = author;
    webMeta.year = new Date().getFullYear();
    await atomicWrite(webMetaPath, `${JSON.stringify(webMeta, null, 2)}\n`);
    console.log("Synchronized apps/web/src/meta.json");
  }
};

/**
 * Cleans template artifacts + normalizes workspace state with safety checks.
 */
const cleanUp = async (): Promise<void> => {
  // Safety check for packages/ directory
  let deletePackages = false;
  if (await existsAsync("packages")) {
    const pkgEntries = (await readdir("packages", { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    if (pkgEntries.length > 0) {
      console.log(
        `Found ${pkgEntries.length} package(s) in packages/: ${pkgEntries.join(", ")}`,
      );
      const confirm = await prompt(
        "Existing packages detected in packages/. Delete them? (y/n)",
        "n",
      );
      deletePackages = confirm.toLowerCase() === "y";
      if (!deletePackages) {
        console.log("Preserving existing packages/ directory");
      }
    } else {
      deletePackages = true;
    }
  }

  const tasks: Promise<unknown>[] = [
    rm("apps/web/content/docs", { recursive: true, force: true }),
    rm("examples", { recursive: true, force: true }),
    updateHusky(),
    handleWorkspaceDeps(),
  ];

  if (deletePackages) {
    tasks.push(rm("packages", { recursive: true, force: true }));
  }

  await Promise.all(tasks);
};

/**
 * Entry point.
 *
 * Flow:
 * 1. Ask if cleanup should run
 * 2. Always run rebrand
 */
const run = async () => {
  const shouldClean =
    (await prompt("Run cleanup? (y/n)", "n")).toLowerCase() === "y";

  if (shouldClean) {
    console.log("Running cleanup...");
    await cleanUp();
  } else {
    console.log("Skipping cleanup");
  }

  console.log("Running rebrand...");
  await rebrand();

  console.log("Done");
};

run().catch((err) => {
  console.error("Failed:", err);
  process.exitCode = 1;
});
