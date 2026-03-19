import { exec, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  access,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { promisify } from "node:util";

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

/**
 * Reads and parses a JSON file safely.
 *
 * Returns `null` if the file does not exist
 *
 * @param p - JSON file path.
 */
export const readJson = async <T = unknown>(p: string): Promise<T | null> => {
  try {
    const content = await readFile(p, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return null;
    throw err;
  }
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
 * @param path Absolute target path.
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
 * @param from Source path.
 * @param to Target path.
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
 * Strip comments from JSONC (VSCode settings format).
 */
export const stripJsonComments = (content: string) =>
  content.replace(/\/\/.*$/gm, "");

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

/**
 * Detects workspace packages in a monorepo.
 * Supports `package.json` workspaces and `pnpm-workspace.yaml`.
 */
export const getWorkspacePackages = async (
  root = process.cwd(),
): Promise<{ name: string; dir: string }[]> => {
  const patterns: string[] = [];

  // 1. Try package.json workspaces
  const pkgPath = join(root, "package.json");
  const pkg = await readJson<{
    workspaces?: string[] | { packages: string[] };
  }>(pkgPath);

  if (pkg?.workspaces) {
    if (Array.isArray(pkg.workspaces)) {
      patterns.push(...pkg.workspaces);
    } else if (Array.isArray(pkg.workspaces.packages)) {
      patterns.push(...pkg.workspaces.packages);
    }
  }

  // 2. Try pnpm-workspace.yaml
  // Robust YAML parsing for simple `packages:` lists using regex
  const pnpmPath = join(root, "pnpm-workspace.yaml");
  if (await existsAsync(pnpmPath)) {
    try {
      const content = await readFile(pnpmPath, "utf-8");
      // Remove comments and find the packages section
      const cleanContent = content.replace(/#.*$/gm, "");
      const packagesMatch = cleanContent.match(
        /packages:\s*\n((?:\s*-\s*.*\n?)*)/,
      );

      if (packagesMatch?.[1]) {
        const itemRegex = /^\s*-\s*["']?([^"'\s]+)["']?/gm;
        let match: RegExpExecArray | null;
        // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration
        while ((match = itemRegex.exec(packagesMatch[1])) !== null) {
          patterns.push(match[1]);
        }
      }
    } catch {}
  }

  // 3. Resolve patterns to directories in parallel with a limiter
  const limiter = createLimiter(10); // Standard concurrency for I/O
  const pkgDirs: string[] = [];
  const uniquePatterns = [...new Set(patterns)];

  await Promise.all(
    uniquePatterns.map((pattern) =>
      limiter(async () => {
        if (pattern.endsWith("/*")) {
          // Parent dir wildcard
          const parentDir = join(root, pattern.slice(0, -2));
          if (await existsAsync(parentDir)) {
            try {
              const subs = await readdir(parentDir, { withFileTypes: true });
              for (const sub of subs) {
                if (sub.isDirectory()) {
                  pkgDirs.push(join(parentDir, sub.name));
                }
              }
            } catch {}
          }
        } else {
          // Direct path
          const directPath = join(root, pattern);
          if (
            (await existsAsync(directPath)) &&
            (await stat(directPath)).isDirectory()
          ) {
            pkgDirs.push(directPath);
          }
        }
      }),
    ),
  );

  return (
    await Promise.all(
      [...new Set(pkgDirs)].map(async (dir) =>
        limiter(async () => {
          const pkgPath = join(dir, "package.json");
          const pkg = (await readJson(pkgPath)) as { name: string };
          return {
            name: pkg?.name,
            dir: relative(root, dir).replace(/\\/g, "/"),
          };
        }),
      ),
    )
  ).filter((p) => p.name);
};

/**
 * ANSI color helpers (tiny + dependency-free)
 */
const color = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/**
 * Interactive prompt with visual hierarchy.
 *
 * - Question → cyan
 * - Default (ghost text) → dim gray
 * - Input cursor → bold
 *
 * Example:
 *   Enter repo slug (user/repo) (my-org/my-repo):
 */
export const prompt = async (question: string, defaultValue?: string) => {
  const rl = readline.createInterface({ input, output });

  const q = `${color.cyan}${question}${color.reset}`;
  const ghost = defaultValue
    ? ` ${color.gray}${color.dim}(${defaultValue})${color.reset}`
    : "";

  const prompt = `${q}${ghost}: ${color.bold}`;

  const answer = (await rl.question(prompt)).trim();

  rl.close();

  return answer || defaultValue || "";
};
