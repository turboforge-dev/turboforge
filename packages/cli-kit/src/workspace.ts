import fs from "node:fs";
import path from "node:path";
import { readJson } from "./utils";

/**
 * Detects workspace packages in a monorepo.
 * Supports `package.json` workspaces and `pnpm-workspace.yaml`.
 */
export const getWorkspacePackages = (root: string): string[] => {
  const patterns: string[] = [];

  // 1. Try package.json workspaces
  const pkgPath = path.join(root, "package.json");
  const pkg = readJson<{ workspaces?: string[] | { packages: string[] } }>(
    pkgPath,
  );

  if (pkg?.workspaces) {
    if (Array.isArray(pkg.workspaces)) {
      patterns.push(...pkg.workspaces);
    } else if (Array.isArray(pkg.workspaces.packages)) {
      patterns.push(...pkg.workspaces.packages);
    }
  }

  // 2. Try pnpm-workspace.yaml
  // Zero-dep YAML parsing for simple `packages:` lists
  const pnpmPath = path.join(root, "pnpm-workspace.yaml");
  if (fs.existsSync(pnpmPath)) {
    try {
      const content = fs.readFileSync(pnpmPath, "utf-8");
      // Simple line-based parser looking for list itmes under 'packages:'
      // This is brittle but adheres to zero-dependency constraint for core.
      let inPackages = false;
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("packages:")) {
          inPackages = true;
          continue;
        }
        if (inPackages) {
          if (trimmed.startsWith("-")) {
            // Extract value: "- 'packages/*'" -> "packages/*"
            const val = trimmed.replace(/^-\s*/, "").replace(/['"]/g, "");
            patterns.push(val);
          } else if (trimmed.endsWith(":") && trimmed !== "packages:") {
            // New section start
            inPackages = false;
          }
        }
      }
    } catch {}
  }

  // 3. Resolve patterns to directories
  // We need to implement simple globbing for directory matching
  // supported patterns usually: "apps/*", "packages/*", or specific dirs
  const results: string[] = [];

  // Deduplicate patterns
  const uniquePatterns = [...new Set(patterns)];

  for (const pattern of uniquePatterns) {
    if (pattern.endsWith("/*")) {
      // Parent dir wildcard
      const parentDir = path.join(root, pattern.slice(0, -2)); // remove /*
      if (fs.existsSync(parentDir)) {
        try {
          const subs = fs.readdirSync(parentDir, { withFileTypes: true });
          for (const sub of subs) {
            if (sub.isDirectory()) {
              results.push(path.join(parentDir, sub.name));
            }
          }
        } catch {}
      }
    } else {
      // Direct path or recursive?
      // For now, support exact paths
      const directPath = path.join(root, pattern);
      if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
        results.push(directPath);
      }
    }
  }

  // Return unique absolute paths
  return [...new Set(results)];
};

/**
 * Check if the current directory is inside a monorepo
 */
export const isMonorepo = (cwd: string = process.cwd()): boolean => {
  // A simple check is if we find a root with workspace definitions
  // Reuse logic structure but purely boolean check?
  // Or actually check if we are *inside* one of the workspace roots.

  // For now, based on prompt: "isMonorepo -- to check if in a monorepo"
  // Usually implies presence of workspace config in root.

  // Check package.json
  const pkgPath = path.join(cwd, "package.json");
  const pkg = readJson<{ workspaces?: unknown }>(pkgPath);
  if (pkg?.workspaces) return true;

  // Check pnpm-workspace.yaml
  if (fs.existsSync(path.join(cwd, "pnpm-workspace.yaml"))) return true;

  return false;
};
