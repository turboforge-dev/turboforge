import fs from "node:fs";
import path from "node:path";
import { findProjectRoot } from "./root";
import { deepMerge, readJson, tryImport } from "./utils";

export interface ResolveConfigOptions<T> {
  name: string;
  cwd?: string;
  defaults?: T;
  envVars?: Partial<T>;
  cliArgs?: Partial<T>;
  configFile?: string;
}

/**
 * Resolves configuration by walking up the tree and merging files.
 */
export const resolveConfig = async <T>({
  name,
  cwd = process.cwd(),
  defaults = {} as T,
  envVars = {},
  cliArgs = {},
  configFile,
}: ResolveConfigOptions<T>): Promise<T> => {
  const root = findProjectRoot(cwd);
  const configFiles: string[] = [];

  if (configFile) {
    // Explicit config file provided
    configFiles.push(path.resolve(cwd, configFile));
  } else {
    // 1. Walk up from CWD to Root to find config files using readdir + regex
    let currentDir = path.resolve(cwd);
    const configRegex = new RegExp(`^${name}\\.config\\.(ts|mts|js|mjs|json)$`);

    while (true) {
      try {
        const files = fs.readdirSync(currentDir);
        const match = files.find((f) => configRegex.test(f));
        if (match) {
          configFiles.push(path.join(currentDir, match));
        }
      } catch {}

      if (currentDir === root) break;
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  }

  // 2. Load configs (Child first, so we reverse to have [Parent, ..., Child])
  const loadedConfigs: Partial<T>[] = [];

  for (const filePath of configFiles.reverse()) {
    if (filePath.endsWith(".json")) {
      const content = readJson<T>(filePath);
      if (content) loadedConfigs.push(content);
    } else {
      const content = await tryImport<T>(filePath);
      if (content) loadedConfigs.push(content);
    }
  }

  // 3. Prepare Merge Function (Try defu, fallback to deepMerge)
  let merger = deepMerge;
  try {
    const defuMod = await import("defu");
    // defu(object, defaults) -> we want to merge multiple.
    // defu(left, right) -> left is priority?
    // defu(source, defaults). Source overrides defaults.
    // So defu(child, parent).
    if (defuMod?.defu) {
      // Wrap usage to match (target, source) -> source overrides target
      // defu(source, target) -> returns merged.
      // biome-ignore lint/suspicious/noExplicitAny: Required here
      merger = (target: any, source: any) => defuMod.defu(source, target);
    }
  } catch {
    // ignore, use deepMerge
  }

  // 4. Merge Phase
  // Priority: CLI > Env > Local (Child) > Parent (Root) > Defaults
  // Merger(lowPriority, highPriority) -> highPriority overrides lowPriority?
  // Our deepMerge: deepMerge(target, source) -> source overrides target.
  // So: merged = deepMerge(merged, nextHigherPriority)

  // Start with defaults
  let mergedConfig = defaults;

  // Merge loaded configs (Parent -> Child)
  for (const config of loadedConfigs) {
    mergedConfig = merger(mergedConfig, config);
  }

  // Merge Env Vars
  mergedConfig = merger(mergedConfig, envVars);

  // Merge CLI Args
  mergedConfig = merger(mergedConfig, cliArgs);

  return mergedConfig;
};

/**
 * Type helper for defining config.
 */
export const defineConfig = <T>(config: T): T => {
  return config;
};
