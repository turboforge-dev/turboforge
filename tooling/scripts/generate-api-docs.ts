/** biome-ignore-all lint/suspicious/noExplicitAny: script file */
import { execFileSync } from "node:child_process";
import {
  access,
  copyFile,
  cp,
  mkdir,
  readdir,
  readFile,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { atomicWrite, createLimiter, readJson, safeRename } from "./utils.ts";

const limit = createLimiter(4);

const PACKAGES_DIR = "packages";
const DOCS_ROOT = "apps/web/content/docs";

await mkdir(DOCS_ROOT, { recursive: true });

const PKG_DOC_DIRS = (await readdir(PACKAGES_DIR, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

console.log("dirs------------", PKG_DOC_DIRS);

// Generate new docs
for (const pkgDir of PKG_DOC_DIRS) {
  const pkgPath = path.join(PACKAGES_DIR, pkgDir);
  const pkgJsonPath = path.join(pkgPath, "package.json");
  const entry = path.join(pkgPath, "src/index.ts").replaceAll("\\", "/");
  try {
    await access(pkgJsonPath);
    await access(entry);
  } catch {
    continue;
  }
  const pkgJson = (await readJson(pkgJsonPath)) as any;
  const major = pkgJson.version.split(".")[0];
  const outDir = path.join(DOCS_ROOT, pkgDir, `v${major}`, "api");

  console.log(
    `Generating docs for ${pkgJson.name}@${pkgJson.version} in ${outDir}`,
  );

  execFileSync(
    process.execPath,
    [
      "node_modules/typedoc/bin/typedoc",
      "--options",
      "typedoc.base.config.ts",
      "--tsconfig",
      "tsconfig.docs.json",
      "--entryPoints",
      entry,
      "--out",
      outDir,
    ],
    { stdio: "inherit" },
  );

  await copyFile(
    path.join(pkgPath, "README.md"),
    path.join(outDir, "..", "overview.mdx"),
  );

  // Copy reference docs
  try {
    const cutomDocsDir = path.join(pkgPath, "docs");
    if ((await stat(cutomDocsDir)).isDirectory()) {
      await cp(path.join(pkgPath, "docs"), path.resolve(outDir, ".."), {
        recursive: true,
      });
    }
  } catch {
    // Ignore
  }

  const rootMetaFilePath = path.join(DOCS_ROOT, pkgDir, "meta.json");
  const description = pkgJson.forge?.description || pkgJson.description;
  const tagLine = pkgJson.forge?.tagLine || pkgJson.description;
  const icon = pkgJson.forge?.icon || (pkgJson.bin ? "Terminal" : "FileCode");
  const pages = await readdir(path.join(DOCS_ROOT, pkgDir)).then((dirs) =>
    dirs
      .filter((dir) => /^v\d+$/.test(dir))
      .toSorted((a, b) => parseInt(b.slice(1), 10) - parseInt(a.slice(1), 10)),
  );

  await Promise.all([
    atomicWrite(
      rootMetaFilePath,
      JSON.stringify(
        {
          title: pkgJson.name,
          description,
          tagLine,
          lastModified: new Date().toISOString(),
          version: pkgJson.version,
          root: true,
          icon,
          pages,
        },
        null,
        2,
      ),
    ),
    atomicWrite(
      path.join(outDir, "..", "meta.json"),
      JSON.stringify(
        {
          title: `Version ${pkgJson.version}`,
          description: tagLine,
        },
        null,
        2,
      ),
    ),
  ]);
}

// copy banner image
try {
  await copyFile(
    path.join(process.cwd(), "banner.jpg"),
    path.join(DOCS_ROOT, "banner.jpg"),
  );
} catch {
  // ignore
}

/* ---------------------------------- */
/* 2. Rename .md to .mdx (ASYNC)       */
/* ---------------------------------- */

const walk = async (
  dir: string,
  action: (file: string) => Promise<void>,
): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true });
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
    await safeRename(file, file.replace(/.md$/, ".mdx"));
  }
});

/* ---------------------------------- */
/* 3. Inject frontmatter (ASYNC)       */
/* ---------------------------------- */

const commitHash = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();

execFileSync("git", ["add", DOCS_ROOT]);
const changedDocs = execFileSync(
  "git",
  ["status", "--porcelain", "--", DOCS_ROOT],
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
  if (!file.endsWith(".mdx")) {
    return;
  }
  const src = await readFile(file, "utf8");

  // Extract title safely
  const title = file.endsWith("api/index.mdx")
    ? "API Docs"
    : file.endsWith("overview.mdx")
      ? "Overview"
      : (src
          .match(/^#\s+(.+)$/m)?.[1]
          ?.replace(/^(Function|Interface|Type alias|Variable):\s*/i, "")
          .replace(/\\+/, "")
          .split("<img")[0]
          .trim() ?? path.basename(file, ".mdx"));

  const editURL = src.match(DEFINED_IN_REGEXP)?.[1];
  const metaPath = file.replace("/api/", "/.meta/").replace(/\.mdx$/, ".json");

  await mkdir(path.dirname(metaPath), { recursive: true });

  await atomicWrite(
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
