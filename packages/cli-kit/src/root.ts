import path from "node:path";
import { findUp, readJson } from "./utils";

const rootCache = new Map<string, string>();

/**
 * Finds the project root directory based on common markers.
 * Priority: .git > .changeset > pnpm-workspace.yaml > package.json (with workspaces)
 */
export const findProjectRoot = async (
  cwd: string = process.cwd(),
): Promise<string> => {
  const resolvedCwd = path.resolve(cwd);
  if (rootCache.has(resolvedCwd)) return rootCache.get(resolvedCwd) as string;

  // High-priority markers: Check for .git, .changeset, or pnpm-workspace.yaml
  const rootDir = await findUp(resolvedCwd, [
    ".git",
    ".changeset",
    "pnpm-workspace.yaml",
  ]);
  if (rootDir) {
    rootCache.set(resolvedCwd, rootDir);
    return rootDir;
  }

  // 4. Check for package.json with workspaces
  // This requires a custom check because we need to read the file content
  let currentDir = path.resolve(cwd);
  const { root } = path.parse(currentDir);

  while (true) {
    const pkgPath = path.join(currentDir, "package.json");
    const pkg = await readJson<{ workspaces?: string[] }>(pkgPath);

    if (pkg?.workspaces && Array.isArray(pkg.workspaces)) {
      rootCache.set(resolvedCwd, currentDir);
      return currentDir;
    }

    if (currentDir === root) break;
    currentDir = path.dirname(currentDir);
  }

  // Fallback to cwd if nothing found
  rootCache.set(resolvedCwd, resolvedCwd);
  return resolvedCwd;
};
