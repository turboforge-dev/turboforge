import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pkgJson from "../../package.json";

const getEntries = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => ({
          dir: d.name,
          name: JSON.parse(
            readFileSync(path.join(dir, d.name, "package.json"), "utf-8"),
          ).name,
        }))
    : [];

const packages = getEntries("./packages");

packages.sort((a, b) => a.name.localeCompare(b.name));

// 1. Collect all scopes
const scopes = [
  "root",
  "tooling",
  "docs",
  "deps",
  "changeset",
  ...packages.map(({ name }) => name),
  ...getEntries("./apps").map(({ name }) => name),
  ...getEntries("./examples").map(({ name }) => name),
];

// 2. Path to VS Code settings
const settingsPath = path.join(process.cwd(), ".vscode/settings.json");

try {
  const settings = JSON.parse(
    readFileSync(settingsPath, "utf-8")
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n"),
  );

  // 3. Update the specific extension key
  settings["conventionalCommits.scopes"] = scopes;

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log("✅ VS Code scopes synced with workspace packages!");

  // Update biome schema
  const biomeFilePath = path.join(process.cwd(), "biome.json");
  const biomeConfig = readFileSync(biomeFilePath, "utf-8").replace(
    /schemas\/.*\/schema\.json/,
    `schemas/${pkgJson.devDependencies["@biomejs/biome"]}/schema.json`,
  );
  writeFileSync(biomeFilePath, biomeConfig);

  console.log("✅ Biome schema version synced with package.json!");

  const tsconfig = readFileSync("./tsconfig.json", "utf-8");
  const paths = packages.reduce(
    (acc: Record<string, string[]>, { name, dir }) => {
      acc[name] = [`./packages/${dir}/src`];
      return acc;
    },
    {},
  );
  writeFileSync(
    "./tsconfig.json",
    tsconfig.replace(
      /"paths":\s*\{([\s\S]*?)\}/,
      () => `"paths": ${JSON.stringify(paths)}`,
    ),
  );

  const tsconfigBuild = readFileSync("./tsconfig.build.json", "utf-8");
  writeFileSync(
    "./tsconfig.build.json",
    tsconfigBuild.replace(
      /"paths":\s*\{([\s\S]*?)\}/,
      () => `"paths": ${JSON.stringify(paths)}`,
    ),
  );

  console.log("✅ TS Config paths synced with workspace packages!");

  execSync("pnpm format");
} catch (e) {
  console.error(e);
}
