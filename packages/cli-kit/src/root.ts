import path from "node:path";
import { findUp, readJson } from "./utils";

/**
 * Finds the project root directory based on common markers.
 * Priority: .git > .changeset > pnpm-workspace.yaml > package.json (with workspaces)
 */
export const findProjectRoot = (cwd: string = process.cwd()): string => {
  // 1. Check for .git (Highest priority for monorepo root)
  const gitRoot = findUp(cwd, [".git"]);
  if (gitRoot) return gitRoot;

  // 2. Check for .changeset
  const changesetRoot = findUp(cwd, [".changeset"]);
  if (changesetRoot) return changesetRoot;

  // 3. Check for workspace definitions
  const workspaceRoot = findUp(cwd, ["pnpm-workspace.yaml"]);
  if (workspaceRoot) return workspaceRoot;

  // 4. Check for package.json with workspaces
  // This requires a custom check because we need to read the file content
  let currentDir = path.resolve(cwd);
  const { root } = path.parse(currentDir);

  while (true) {
    const pkgPath = path.join(currentDir, "package.json");
    const pkg = readJson<{ workspaces?: string[] }>(pkgPath);

    if (pkg?.workspaces && Array.isArray(pkg.workspaces)) {
      return currentDir;
    }

    if (currentDir === root) break;
    currentDir = path.dirname(currentDir);
  }

  // Fallback to cwd if nothing found
  return cwd;
};
