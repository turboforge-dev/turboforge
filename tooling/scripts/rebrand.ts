import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

import {
  atomicWrite,
  createLimiter,
  execAsync,
  getWorkspacePackages,
  prompt,
  readJson,
} from "./utils.ts";

const limiter = createLimiter(10);

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
            if (deps[name].startsWith("workspace:")) {
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

  throw new Error(`Unsupported git remote URL: ${url}`);
};

/**
 * Rebrands repository references in SECURITY.md.
 *
 * - Detects current git remote
 * - Prompts user for override
 * - Replaces hardcoded slug
 */
const rebrand = async (): Promise<void> => {
  const { stdout } = await execAsync("git remote get-url --push origin");
  const detected = parseRepoSlug(stdout.toString());

  const repoSlug = await prompt("Enter repo slug (user/repo)", detected);

  const securityPath = resolve("SECURITY.md");
  const content = await readFile(securityPath, "utf-8");

  const next = content.replace(/turboforge-dev\/turboforge/g, repoSlug);

  await atomicWrite(securityPath, next);
};

/**
 * Cleans template artifacts + normalizes workspace state.
 */
const cleanUp = async (): Promise<void> => {
  await Promise.all([
    rm("apps/web/content/docs", { recursive: true, force: true }),
    rm("packages", { recursive: true, force: true }),
    rm("examples", { recursive: true, force: true }),
    updateHusky(),
    handleWorkspaceDeps(),
  ]);
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
    (await prompt("Run cleanup? (y/n)", "y")).toLowerCase() === "y";

  if (shouldClean) {
    console.log("→ Running cleanup...");
    await cleanUp();
  } else {
    console.log("→ Skipping cleanup");
  }

  console.log("→ Running rebrand...");
  await rebrand();

  console.log("✔ Done");
};

run().catch((err) => {
  console.error("✖ Failed:", err);
  process.exitCode = 1;
});
