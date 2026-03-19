import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createLimiter, existsAsync, parseYaml, readJson } from "./utils";

/**
 * Detects workspace packages in a monorepo.
 * Supports `package.json` workspaces and `pnpm-workspace.yaml`.
 */
export const getWorkspacePackages = async (root: string): Promise<string[]> => {
  const patterns: string[] = [];

  // 1. Try package.json workspaces
  const pkgPath = path.join(root, "package.json");
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
  const pnpmPath = path.join(root, "pnpm-workspace.yaml");
  if (await existsAsync(pnpmPath)) {
    try {
      const content = await readFile(pnpmPath, "utf-8");
      const pnpm = await parseYaml<{ packages?: string[] }>(content);
      if (pnpm?.packages) {
        patterns.push(...pnpm.packages);
      }
    } catch {}
  }

  // 3. Resolve patterns to directories in parallel with a limiter
  const limiter = createLimiter(10); // Standard concurrency for I/O
  const results: string[] = [];
  const uniquePatterns = [...new Set(patterns)];

  await Promise.all(
    uniquePatterns.map((pattern) =>
      limiter(async () => {
        if (pattern.endsWith("/*")) {
          // Parent dir wildcard
          const parentDir = path.join(root, pattern.slice(0, -2));
          if (await existsAsync(parentDir)) {
            try {
              const subs = await readdir(parentDir, { withFileTypes: true });
              for (const sub of subs) {
                if (
                  sub.isDirectory() &&
                  (await existsAsync(
                    path.join(parentDir, sub.name, "package.json"),
                  ))
                ) {
                  results.push(path.join(parentDir, sub.name));
                }
              }
            } catch {}
          }
        } else {
          // Direct path
          const directPath = path.join(root, pattern);
          if (await existsAsync(path.join(directPath, "package.json"))) {
            results.push(directPath);
          }
        }
      }),
    ),
  );

  // Return unique absolute paths
  return [...new Set(results)];
};

/**
 * Check if the current directory is inside a monorepo
 */
export const isMonorepo = async (
  cwd: string = process.cwd(),
): Promise<boolean> => {
  // A simple check is if we find a root with workspace definitions
  // Reuse logic structure but purely boolean check?
  // Or actually check if we are *inside* one of the workspace roots.

  // For now, based on prompt: "isMonorepo -- to check if in a monorepo"
  // Usually implies presence of workspace config in root.

  // Check package.json
  const pkgPath = path.join(cwd, "package.json");
  const pkg = await readJson<{ workspaces?: unknown }>(pkgPath);
  if (pkg?.workspaces) return true;

  // Check pnpm-workspace.yaml
  if (await existsAsync(path.join(cwd, "pnpm-workspace.yaml"))) return true;

  return false;
};
