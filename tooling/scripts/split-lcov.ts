import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "coverage/lcov.info");
const OUT_DIR = path.join(ROOT, "coverage/packages");
const PACKAGE_PREFIX = "packages/";

if (!fs.existsSync(INPUT)) {
  console.error(`LCOV file not found: ${INPUT}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const content = fs.readFileSync(INPUT, "utf8").replaceAll("\\", "/");

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

  const filePath = lines[sfIndex].slice(3); // remove SF:
  const idx = filePath.indexOf(PACKAGE_PREFIX);
  if (idx === -1) continue;

  const rest = filePath.slice(idx + PACKAGE_PREFIX.length);
  const [pkg, ...relativeParts] = rest.split("/");
  if (!pkg || relativeParts.length === 0) continue;

  // Rewrite SF to be package-local (as if cwd = packages/<pkg>)
  lines[sfIndex] = `SF:${relativeParts.join("/")}`;

  record = `${lines.join("\n")}\n`;

  if (!byPackage.has(pkg)) byPackage.set(pkg, []);
  byPackage.get(pkg)!.push(record);
}

for (const [pkg, recs] of byPackage.entries()) {
  const out = path.join(OUT_DIR, `${pkg}.lcov`);
  fs.writeFileSync(out, recs.join(""), "utf8");
  console.log(`✓ ${pkg}: ${recs.length} records`);
}

if (byPackage.size === 0) {
  console.warn("No package coverage found. Check paths in lcov.info");
}
