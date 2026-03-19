import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import commitlintConfig from "../../.commitlintrc.json";
import { CACHE_DIR } from "./forge.const";
import {
  atomicWrite,
  execAsync,
  getWorkspacePackages,
  readJson,
  stripJsonComments,
} from "./utilts";

type WorkspaceEntry = {
  dir: string;
  name: string;
};

/**
 * Update VSCode conventional commit scopes.
 */
const updateVSCodeScopes = async (scopes: string[]) => {
  const settingsPath = ".vscode/settings.json";

  const raw = await readFile(settingsPath, "utf8");
  const settings = JSON.parse(stripJsonComments(raw));

  settings["conventionalCommits.scopes"] = scopes;

  await atomicWrite(settingsPath, JSON.stringify(settings, null, 2));
};

/**
 * Update commitlint scope enum rule.
 */
const updateCommitlint = async (scopes: string[]) => {
  commitlintConfig.rules["scope-enum"][2] = scopes;

  await atomicWrite(
    ".commitlintrc.json",
    JSON.stringify(commitlintConfig, null, 2),
  );
};

/**
 * Sync biome schema version with package.json dependency.
 */
const updateBiomeSchema = async () => {
  const biomeFilePath = "biome.json";

  const pkg = (await readJson("package.json")) as {
    devDependencies: Record<string, string>;
  };

  const biomeVersion = pkg.devDependencies["@biomejs/biome"];

  const biomeConfig = await readFile(biomeFilePath, "utf8");

  const updated = biomeConfig.replace(
    /schemas\/.*\/schema\.json/,
    `schemas/${biomeVersion}/schema.json`,
  );

  await atomicWrite(biomeFilePath, updated);
};

/**
 * Generate TS path mappings for workspace packages.
 */
const updateTsPaths = async (packages: WorkspaceEntry[]) => {
  const paths = packages.reduce<Record<string, string[]>>(
    (acc, { name, dir }) => {
      acc[name] = [`${dir}/src`, `${dir}/dist`];
      return acc;
    },
    {},
  );

  const updateFile = async (file: string) => {
    const raw = await readFile(file, "utf8");

    const updated = raw.replace(
      /"paths":\s*\{([\s\S]*?)\}/,
      () => `"paths": ${JSON.stringify(paths, null, 2)}`,
    );

    await atomicWrite(file, updated);
  };

  await Promise.all([
    updateFile("./tsconfig.json"),
    updateFile("./tsconfig.build.json"),
  ]);
};

/**
 * Execute repository formatter.
 */
const runFormatter = () => execAsync("pnpm format");

/**
 * Main workspace synchronization routine.
 *
 * Ensures all tooling configs remain aligned with
 * the current monorepo package structure.
 */
const main = async () => {
  try {
    await mkdir(CACHE_DIR, { recursive: true });

    const packages = await getWorkspacePackages();
    packages.sort((a, b) => a.name.localeCompare(b.name));

    const libPackages = packages.filter(
      ({ dir }) => !/\b(apps|examples|tooling)\b/i.test(dir),
    );

    atomicWrite(
      join(CACHE_DIR, "packages.json"),
      JSON.stringify(libPackages, null, 2),
    );

    const scopes = packages.map((p) => p.name);

    await updateVSCodeScopes(scopes);
    console.log("✅ VS Code scopes synced");

    await updateCommitlint(scopes);
    console.log("✅ Commitlint scopes synced");

    await updateBiomeSchema();
    console.log("✅ Biome schema synced");

    await updateTsPaths(libPackages);
    console.log("✅ TSConfig paths synced");

    await runFormatter();
  } catch (error) {
    console.error("❌ Workspace sync failed:", error);
  }
};

await main();
