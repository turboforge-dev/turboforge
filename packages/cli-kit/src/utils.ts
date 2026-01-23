import { exec, execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

export const execAsync = promisify(exec);
export const execFileAsync = promisify(execFile);

/**
 * Recursively walks up the directory tree from `startDir` to find a directory
 * containing one of the `markers`.
 */
export const findUp = (startDir: string, markers: string[]): string | null => {
  let currentDir = path.resolve(startDir);
  const { root } = path.parse(currentDir);

  while (true) {
    for (const marker of markers) {
      if (fs.existsSync(path.join(currentDir, marker))) {
        return currentDir;
      }
    }

    if (currentDir === root) {
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
};

/**
 * Safely reads and parses a JSON file.
 */
export const readJson = <T = unknown>(p: string): T | null => {
  try {
    if (!fs.existsSync(p)) return null;
    const content = fs.readFileSync(p, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
};

/**
 * Tries to import a module. supports both Jiti (if available) and native import.
 */
export const tryImport = async <T = unknown>(p: string): Promise<T | null> => {
  if (!fs.existsSync(p)) return null;

  try {
    const jiti = await import("jiti");
    const load = jiti.createJiti
      ? jiti.createJiti(process.cwd())
      : jiti.default(process.cwd());
    const res = load(p);
    return res.default ?? res;
  } catch {
    try {
      const mod = await import(p);
      return mod.default || mod;
    } catch (nativeError) {
      if (/\.(ts|mts)$/.test(p)) {
        throw new Error(
          `Failed to load TypeScript config at ${p}. Please install 'jiti' as a dev dependency to load .ts files.`,
        );
      }
      throw nativeError;
    }
  }
};

/**
 * Deep merges two objects.
 * Falls back to this implementation if 'defu' is not available.
 */

// biome-ignore lint/suspicious/noExplicitAny: Required here
export const deepMerge = (target: any, source: any): any => {
  if (
    typeof target !== "object" ||
    target === null ||
    typeof source !== "object" ||
    source === null
  ) {
    return source;
  }

  if (Array.isArray(target) && Array.isArray(source)) {
    return source; // Overwrite arrays
  }

  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (Object.hasOwn(source, key)) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
};
