import fs from "node:fs";
import path from "node:path";
import { CACHE_DIR } from "./forge.const.ts";
import { readJson } from "./utils.ts";

type Pkg = {
  name: string;
  dir: string;
};

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "coverage/lcov.info");
const OUT_DIR = path.join(ROOT, "coverage");
const PKG_CONFIG = path.join(ROOT, `${CACHE_DIR}/packages.json`);

const normalize = (p: string) => p.replaceAll("\\", "/");

if (!fs.existsSync(INPUT)) {
  throw new Error(`LCOV file not found: ${INPUT}`);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const packages = await readJson<Pkg[]>(PKG_CONFIG);

const content = normalize(fs.readFileSync(INPUT, "utf8"));

const records = content
  .split("end_of_record")
  .map((r) => r.trim())
  .filter(Boolean)
  .map((r) => `${r}\nend_of_record\n`);

const byPackage = new Map<string, string[]>();

for (let record of records) {
  const lines = record.split("\n");
  const sfIndex = lines.findIndex((l) => l.startsWith("SF:"));
  if (sfIndex === -1) continue;

  const filePath = lines[sfIndex].slice(3);

  // Find matching package by prefix
  const pkg = packages?.find((p) => filePath.includes(`${p.dir}/`));
  if (!pkg) continue;

  const idx = filePath.indexOf(pkg.dir);
  const relative = filePath.slice(idx + pkg.dir.length);
  if (!relative) continue;

  // Rewrite SF path to package-local
  lines[sfIndex] = `SF:${relative}`;

  record = `${lines.join("\n")}\n`;

  if (!byPackage.has(pkg.dir)) byPackage.set(pkg.dir, []);
  byPackage.get(pkg.dir)?.push(record);
}

for (const [pkgDir, recs] of byPackage.entries()) {
  const out = path.join(OUT_DIR, `${pkgDir}.lcov`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, recs.join(""), "utf8");
  console.log(`✓ ${pkgDir}: ${recs.length} records`);
}

if (byPackage.size === 0) {
  console.warn("No package coverage found. Check paths in lcov.info");
}
