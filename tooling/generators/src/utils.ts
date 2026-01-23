import fs from "node:fs";
import path from "node:path";

/**
 * Dynamically finds packages to avoid hardcoding choices in prompts.
 */
export const getPackageDirs = (root = process.cwd()) => {
  const packagesDir = path.resolve(root, "packages");
  if (!fs.existsSync(packagesDir)) {
    fs.mkdirSync(packagesDir);
  }
  return fs
    .readdirSync(packagesDir)
    .filter((f) => fs.statSync(path.join(packagesDir, f)).isDirectory());
};

export const getInternalPackages = (root = process.cwd()) => {
  const dirs = getPackageDirs(root);
  return dirs.map((dir) => {
    const pkgJsonPath = path.resolve(root, "packages", dir, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      return { name: pkg.name, value: pkg.name, checked: false };
    }
    return { name: dir, value: dir, checked: false };
  });
};

/**
 * Utility to ensure 'use client' is preserved or added correctly.
 */
export const getBanner = (isClient: boolean) =>
  isClient ? '"use client";\n\n' : "";

export const TEMPLATE_DIR = "../templates/";

export const cwd = process.cwd();
