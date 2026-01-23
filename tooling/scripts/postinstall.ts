import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pkgJson from "../../package.json";

const getDirs = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];

// 1. Collect all scopes
const scopes = [
  "root",
  "tooling",
  "deps",
  "changeset",
  ...getDirs("./packages"),
  ...getDirs("./apps").map((app) => `@app/${app}`),
  ...getDirs("./examples").map((example) => `@example/${example}`),
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
} catch (e) {
  console.error(
    "❌ Failed to sync VS Code settings. Ensure .vscode/settings.json exists.",
    e,
  );
}
