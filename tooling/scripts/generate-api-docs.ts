import { execSync } from "node:child_process";
import { access, promises as fs } from "node:fs";
import path from "node:path";
import pLimit from "p-limit";

const limit = pLimit(4);

const PACKAGES_DIR = "packages";
const DOCS_ROOT = "apps/web/content/docs";

/* ---------------------------------- */
/* 1. Generate docs (SEQUENTIAL)      */
/* ---------------------------------- */

const packageDirs = (await fs.readdir(PACKAGES_DIR, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const pkgName of packageDirs) {
  const pkgPath = path.join(PACKAGES_DIR, pkgName);
  const pkgJsonPath = path.join(pkgPath, "package.json");
  const entry = path.join(pkgPath, "src/index.ts").replaceAll("\\", "/");

  try {
    await fs.access(pkgJsonPath);
    await fs.access(entry);
  } catch {
    continue;
  }

  const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf8"));
  const major = pkgJson.version.split(".")[0];
  const outDir = path.join(DOCS_ROOT, pkgName, `v${major}`, "api");

  // Create package redirect/index if not exists
  // const pkgIndex = path.join(DOCS_ROOT, pkgName, "index.mdx");

  // Default to redirecting to the version we are building
  // In a real scenario, we might want 'latest' or 'v0' hardcoded
  //   await fs.mkdir(path.dirname(pkgIndex), { recursive: true });
  //   await fs.writeFile(
  //     pkgIndex,
  //     `import { redirect } from 'next/navigation';

  // # ${pkgJson.name} (${pkgJson.version})

  // export default function Page() {
  //     redirect('/docs/${pkgName}/v${major}/api');
  // }
  // `,
  //   );

  execSync(
    [
      "pnpm typedoc",
      "--options typedoc.base.config.ts",
      "--tsconfig tsconfig.docs.json",
      `--entryPoints ${entry}`,
      `--out ${outDir}`,
    ].join(" "),
    { stdio: "inherit" },
  );

  fs.copyFile(
    path.join(pkgPath, "README.md"),
    path.join(outDir, "..", "index.mdx"),
  );

  const metaFilePath = path.join(DOCS_ROOT, pkgName, "meta.json");
  try {
    await fs.access(metaFilePath);
  } catch {
    fs.writeFile(
      metaFilePath,
      JSON.stringify(
        {
          title: pkgJson.name,
          description: pkgJson.description,
          lastModified: new Date().toISOString(),
          root: true,
          icon: pkgJson.bin ? "Terminal" : "FileCode",
        },
        null,
        2,
      ),
    );
  }
}

/* ---------------------------------- */
/* 2. Rename .md to .mdx (ASYNC)       */
/* ---------------------------------- */

const walk = async (
  dir: string,
  action: (file: string) => Promise<void>,
): Promise<void> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, action);
      } else {
        await action(fullPath);
      }
    }),
  );
};

await walk(DOCS_ROOT, async (file) => {
  if (file.endsWith(".md")) {
    await fs.rename(file, file.replace(/.md$/, ".mdx"));
  }
});

/* ---------------------------------- */
/* 3. Inject frontmatter (ASYNC)       */
/* ---------------------------------- */

const commitHash = execSync("git rev-parse HEAD", {
  encoding: "utf8",
}).trim();

const changedDocs = execSync(
  "git add . && git status --porcelain -- apps/web/content/docs",
  { encoding: "utf8" },
)
  .split("\n")
  .filter((f) => {
    console.log(f, f.trim().split(/:|\s+/));
    return f.endsWith(".mdx");
  })
  .map((f) => f.trim().split(/:|\s+/)[1].trim());

console.log(changedDocs);

const DEFINED_IN_REGEXP = /Defined in.*?\((https:\/\/github\.com\/[^)]+)\)/;

const createMeta = async (file: string) => {
  const src = await fs.readFile(file, "utf8");

  // Extract title safely
  const title = file.endsWith("api/index.mdx")
    ? "API Docs"
    : (src
        .match(/^#\s+(.+)$/m)?.[1]
        ?.replace(/^(Function|Interface|Type alias|Variable):\s*/i, "")
        .replace(/\\+/, "")
        .split("<img")[0]
        .trim() ?? path.basename(file, ".mdx"));

  const editURL = src.match(DEFINED_IN_REGEXP)?.[1];
  const metaPath = file
    .replace("/api/", "/api/.meta/")
    .replace(/\.mdx$/, ".json");

  await fs.mkdir(path.dirname(metaPath), { recursive: true });

  await fs.writeFile(
    metaPath,
    `${JSON.stringify(
      {
        title,
        editURL,
        commitHash,
        lastModified: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
};

await Promise.all(
  changedDocs.map((f) => limit(() => createMeta(f).catch(() => {}))),
);
