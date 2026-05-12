import { exec, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { access, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

export { parseYaml } from "./yaml";

/**
 * Promisified version of `child_process.exec`.
 * Executes a command in a shell and buffers the output.
 *
 * @param command - The shell command to execute.
 * @returns Promise resolving with `{ stdout, stderr }`.
 */
export const execAsync = promisify(exec);

/**
 * Promisified version of `child_process.execFile`.
 * Executes an executable directly without spawning a shell.
 *
 * @param file - Path to executable.
 * @param args - CLI arguments.
 * @returns Promise resolving with `{ stdout, stderr }`.
 */
export const execFileAsync = promisify(execFile);

/**
 * Checks if a file or directory exists.
 *
 * Uses `fs.promises.access` for non-blocking I/O.
 *
 * Only `ENOENT` is interpreted as "does not exist".
 * Other filesystem errors are rethrown.
 *
 * @param p - File system path to check.
 */
export const existsAsync = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return false;
    throw err;
  }
};

const findUpCache = new Map<string, string | null>();
const FIND_UP_CACHE_MAX = 200;

/**
 * Recursively walks up the directory tree from `startDir`
 * searching for a directory containing any of the `markers`.
 *
 * Results are cached to avoid redundant filesystem traversal.
 *
 * @param startDir - Directory to begin searching from.
 * @param markers - File or directory names to detect.
 *
 * @returns Directory containing the marker, or `null`.
 */
export const findUp = async (
  startDir: string,
  markers: string[],
): Promise<string | null> => {
  const resolvedStartDir = resolve(startDir);
  const cacheKey = `${resolvedStartDir}:${[...markers].sort().join(",")}`;

  if (findUpCache.has(cacheKey)) {
    return findUpCache.get(cacheKey) as string;
  }

  let currentDir = resolvedStartDir;
  const { root } = parse(currentDir);

  while (true) {
    for (const marker of markers) {
      if (await existsAsync(join(currentDir, marker))) {
        findUpCache.set(cacheKey, currentDir);
        if (findUpCache.size > FIND_UP_CACHE_MAX) findUpCache.clear();
        return currentDir;
      }
    }

    if (currentDir === root) {
      break;
    }
    currentDir = dirname(currentDir);
  }

  findUpCache.set(cacheKey, null);
  if (findUpCache.size > FIND_UP_CACHE_MAX) findUpCache.clear();
  return null;
};

/**
 * Options for parsing operations.
 */
export interface ParsingOptions {
  /**
   * Throw on syntax/import errors.
   *
   * @default false
   */
  strict?: boolean;
}

/**
 * Reads and parses a JSON file safely.
 *
 * Returns `null` if the file does not exist or parsing fails
 * (unless `strict` mode is enabled).
 *
 * @param p - JSON file path.
 */
export const readJson = async <T = unknown>(
  p: string,
  options: ParsingOptions = {},
): Promise<T | null> => {
  try {
    const content = await readFile(p, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return null;
    if (options.strict) throw err;
    return null;
  }
};

/**
 * Attempts to import a module.
 *
 * Supports:
 * - Native dynamic `import()`
 * - TypeScript configs via `jiti` (if available)
 *
 * @param p - Module
 */
export const tryImport = async <T = unknown>(
  p: string,
  options: ParsingOptions = {},
): Promise<T | null> => {
  if (!(await existsAsync(p))) return null;

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
      return mod.default ?? mod;
    } catch (nativeError) {
      if (options.strict) {
        if (/\.(ts|mts)$/.test(p)) {
          throw new Error(
            `Failed to load TypeScript config at ${p}. Install 'jiti' to load TS configs. Original error: ${nativeError}`,
          );
        }
        throw nativeError;
      }
      return null;
    }
  }
};

/**
 * Deep merges two objects.
 *
 * Arrays are overwritten rather than concatenated.
 * Guards against prototype pollution.
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
    return source;
  }

  const output = { ...target };

  for (const key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    if (Object.hasOwn(source, key)) {
      output[key] =
        key in target ? deepMerge(target[key], source[key]) : source[key];
    }
  }

  return output;
};

/**
 * Atomically writes a file using a temp-file + rename strategy.
 *
 * Guarantees readers never observe partially written files.
 *
 * Strategy:
 * 1. Write data to a temporary file in the same directory.
 * 2. Rename temp file to target (atomic on same filesystem).
 *
 * Why this matters:
 * - Prevents partially written files.
 * - Ensures readers never observe truncated JSON.
 * - Safe under concurrent writers (last-writer-wins).
 *
 * Concurrency Model:
 * - Each invocation uses a `randomUUID()` temp filename
 *   to avoid cross-process collisions.
 * - Rename is atomic on the same filesystem.
 * - No locking is performed here.
 *
 * Limitations:
 * - Does not prevent logical race conditions.
 * - If two processes write simultaneously, the last rename wins.
 * - Both temp and target must reside on the same filesystem
 *   for atomic guarantees.
 *
 * @param path Target file path.
 * @param data UTF-8 string content.
 */
export const atomicWrite = async (
  path: string,
  data: string,
): Promise<void> => {
  const tmp = join(dirname(path), `${randomUUID()}.tmp`);

  try {
    await writeFile(tmp, data, "utf-8");
    await safeRename(tmp, path);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
};

/**
 * Safely renames a file or directory.
 *
 * Handles common Windows rename issues where the target
 * already exists.
 *
 * @param from Source
 * @param to Target
 */
export const safeRename = async (from: string, to: string) => {
  if (!(await existsAsync(from))) return;

  try {
    await rename(from, to);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;

    if (e.code === "EEXIST" || e.code === "EPERM") {
      await rm(to, { recursive: true, force: true });
      await rename(from, to);
      return;
    }

    throw err;
  }
};

/**
 * Creates a minimal promise concurrency limiter.
 *
 * Ensures no more than `concurrency` async tasks run simultaneously.
 * Additional tasks are queued FIFO.
 *
 * @param concurrency - Maximum concurrent tasks (must be ≥1).
 */
export const createLimiter = (concurrency: number) => {
  if (concurrency < 1) {
    throw new Error("createLimiter: concurrency must be >= 1");
  }

  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    active--;
    queue.shift()?.();
  };

  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }

    active++;

    try {
      return await task();
    } finally {
      next();
    }
  };
};

export const isCLI = () =>
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
