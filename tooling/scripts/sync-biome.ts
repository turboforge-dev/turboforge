import { readFile } from "node:fs/promises";
import { atomicWrite, readJson } from "./utils.ts";

/**
 * Sync biome schema version with package.json dependency.
 */
export const updateBiomeSchema = async () => {
  const biomeFilePath = "biome.json";

  const pkg = (await readJson("package.json")) as {
    devDependencies: Record<string, string>;
  };

  const biomeVersion = pkg.devDependencies["@biomejs/biome"];

  const biomeConfig = await readFile(biomeFilePath, "utf8");

  const updated = biomeConfig.replace(
    /schemas\/.*\/schema\.json/,
    `schemas/${biomeVersion}/schema.json`,
  );

  await atomicWrite(biomeFilePath, updated);
  console.log("✅ Biome schema synced");
};

updateBiomeSchema().catch((error) => {
  console.error("❌ Failed to sync biome schema:", error);
});
