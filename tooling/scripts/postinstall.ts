import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { CACHE_DIR } from "./forge.const.ts";
import {
  atomicWrite,
  existsAsync,
  getWorkspacePackages,
  readJson,
  stripJsonComments,
} from "./utils.ts";

type WorkspaceEntry = {
  dir: string;
  name: string;
};

const PACKAGES_FILE = join(CACHE_DIR, "packages.json");

/**
 * Shallow compare of package lists.
 * Assumes stable sorting.
 */
const isSamePackages = (
  a: WorkspaceEntry[] | null,
  b: WorkspaceEntry[],
): boolean => {
  if (!a || a.length !== b.length) return false;
  return a.every((pkg, i) => pkg.name === b[i].name && pkg.dir === b[i].dir);
};

/**
 * Updates VSCode conventional commit scopes.
 * Skips if .vscode/settings.json is missing.
 */
const updateVSCodeScopes = async (scopes: string[]) => {
  const file = ".vscode/settings.json";
  if (!(await existsAsync(file))) return;

  const raw = await readFile(file, "utf8");
  const json = JSON.parse(stripJsonComments(raw));

  json["conventionalCommits.scopes"] = scopes;

  await atomicWrite(file, JSON.stringify(json, null, 2));
};

/**
 * Updates commitlint scope enum rule.
 * Uses read/write instead of import mutation to avoid cache issues.
 */
const updateCommitlint = async (scopes: string[]) => {
  const file = ".commitlintrc.json";
  if (!(await existsAsync(file))) return;

  const config = await readJson<any>(file);

  if (!config?.rules?.["scope-enum"]) return;

  config.rules["scope-enum"][2] = scopes;

  await atomicWrite(file, JSON.stringify(config, null, 2));
};

/**
 * Generates TS path mappings for workspace packages.
 * Skips missing tsconfig files.
 *
 * NOTE: Uses simple replace — safe enough given controlled format.
 * Can be upgraded to jsonc-parser later.
 */
const updateTsPaths = async (packages: WorkspaceEntry[]) => {
  const paths = Object.fromEntries(
    packages.map(({ name, dir }) => [name, [`./${dir}/src`, `./${dir}/dist`]]),
  );

  const updateFile = async (file: string) => {
    if (!(await existsAsync(file))) return;

    const raw = await readFile(file, "utf8");

    const updated = raw.replace(
      /"paths":\s*\{([\s\S]*?)\}/,
      () => `"paths": ${JSON.stringify(paths, null, 2)}`,
    );

    await atomicWrite(file, updated);
  };

  await Promise.all([
    updateFile("tsconfig.json"),
    updateFile("tsconfig.build.json"),
  ]);
};

/**
 * Main entrypoint.
 *
 * Responsibilities:
 * - Always ensure `.turboforge/packages.json` exists
 * - Detect workspace drift (new/removed packages)
 * - Sync dependent tooling ONLY when drift is detected
 *
 * Design principles:
 * - Idempotent
 * - Fast on no-op
 * - Safe in CI environments
 */
const main = async () => {
  try {
    await mkdir(CACHE_DIR, { recursive: true });

    const packages = await getWorkspacePackages();
    packages.sort((a, b) => a.name.localeCompare(b.name));

    const libPackages = packages.filter(
      ({ dir }) => !/\b(apps|examples|tooling)\b/i.test(dir),
    );

    const prev = await readJson<WorkspaceEntry[]>(PACKAGES_FILE);

    if (isSamePackages(prev, libPackages)) {
      console.info("No workspace changes detected");
      return;
    }

    await atomicWrite(PACKAGES_FILE, JSON.stringify(libPackages, null, 2));

    console.info("🔄 Workspace change detected → syncing configs");

    const scopes = packages.map((p) => p.name);

    await updateVSCodeScopes(scopes);
    await updateCommitlint(scopes);
    await updateTsPaths(libPackages);

    console.info("✅ Workspace sync complete");
  } catch (error) {
    console.error("❌ Workspace sync failed:", error);
  }
};

await main();
