import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const aliasNotice = (canonical: string) => `
> [!TIP]
> **This package (::alias::) is an official alias of [${canonical}](https://npmjs.com/package/${canonical}).**

<details>
<summary>Why does this exist?</summary>

We provide this package to offer shorter import paths and improved discoverability. While both packages provide identical functionality, **${canonical}** is the primary source of truth.
</details>

<details>
<summary>Which one should I use?</summary>

* **Use ::alias::** if you prefer the shorter name or specific branding or ESM Only.
* **Use ${canonical}** for the most stable long-term reference and standard alignment.

| Feature | ${canonical} | ::alias:: |
| --- | --- | --- |
| **Source Code** | ✅ Primary | 🔗 Proxy |
| **Updates** | Immediate | Synchronized (Immediately) |
| **Bundle Size** | 100% | 100% (Zero overhead) |
| **Format** | ESM + CJS | ESM Only |
| **Maintenance** | ✅ Primary | 🔗 Proxy (inherits) |
| **Security** | ✅ Primary | 🔗 Proxy (inherits) |

</details>

<details>
<summary>Maintenance & Support</summary>

> **Security:** Security audits are performed on the canonical package; this alias inherits all security patches automatically.
</details>

---

`;

const getPackageDirs = async (root = process.cwd()) => {
  const packagesDir = path.resolve(root, "packages");
  try {
    await fs.access(packagesDir);
  } catch {
    return [];
  }
  const dirents = await fs.readdir(packagesDir, { withFileTypes: true });
  return dirents
    .filter((d) => d.isDirectory())
    .map((d) => path.join(packagesDir, d.name));
};

const publishAliases = async () => {
  const args = parseArgs({
    options: {
      "published-packages": {
        type: "string",
      },
    },
  });

  const publishedPackagesRaw = args.values["published-packages"];
  let publishedPackages: { name: string; version: string }[] | null = null;

  if (publishedPackagesRaw) {
    try {
      publishedPackages = JSON.parse(publishedPackagesRaw);
      console.log(
        `Filtering for published packages: ${publishedPackages
          ?.map((p) => p.name)
          .join(", ")}`,
      );
    } catch (e) {
      console.error("Failed to parse published-packages argument", e);
      // If parsing fails, assuming no publishing should happen to be safe
      return;
    }
  }

  const packageDirs = await getPackageDirs();

  await Promise.all(
    packageDirs.map(async (dir) => {
      const pkgJsonPath = path.join(dir, "package.json");
      const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));

      const canonical = pkgJson.name;

      // Filter if argument is provided
      if (publishedPackages) {
        const isPublished = publishedPackages.some(
          (p) => p.name === canonical && p.version === pkgJson.version,
        );
        if (!isPublished) {
          return;
        }
      }

      const aliases = pkgJson.forge?.aliases;

      if (!aliases?.length || !Array.isArray(aliases)) return;

      console.log(`Processing aliases for ${canonical}: ${aliases.join(", ")}`);

      const distAliasesDir = path.join(dir, "dist-aliases");
      await fs.rm(distAliasesDir, { recursive: true, force: true });
      await fs.mkdir(distAliasesDir, { recursive: true });

      // README
      let readmeContent = "";
      try {
        const originalReadme = await fs.readFile(
          path.join(dir, "README.md"),
          "utf-8",
        );
        const sections = originalReadme.split(/^|\n#.*Installation/i);
        // Default split behavior might act differently if regex doesn't match perfectly,
        // but assuming standard structure:
        if (sections.length >= 2) {
          readmeContent =
            sections[0] +
            "\n## 📦 Installation\n\n" +
            aliasNotice(canonical) +
            sections.slice(1).join("");
        } else {
          const readMeLines = originalReadme.split("\n");
          readmeContent =
            readMeLines[0] +
            "\n\n" +
            aliasNotice(canonical) +
            "\n\n" +
            readMeLines.slice(1).join("\n");
        }
      } catch {
        readmeContent = aliasNotice(canonical);
      }

      // Prepare Package JSON
      const aliasPkgJson = {
        ...pkgJson,
        // Reset scripts, mostly irrelevant for alias
        scripts: {},
        // Reset devDependencies, irrelevant
        devDependencies: {},
        // Set dependency on canonical
        dependencies: {
          [canonical]: pkgJson.version,
        },
        // Force ESM
        type: "module",
        // We'll rebuild exports/main/types below
        exports: {},
        main: undefined,
        module: undefined,
        types: undefined,
        // Cleanup forge config from alias
        forge: undefined,
      };

      // 4. Generate Barrel Files & Maps
      // If original has exports, use them. Otherwise default to "." -> main
      const originalExports =
        pkgJson.exports ||
        (pkgJson.main ? { ".": pkgJson.main } : { ".": "./index.js" });

      // Helper to normalize export keys
      for (const key in originalExports) {
        // We only care about the key structure to mirror it.
        // value is irrelevant as we just re-export from canonical.

        // strip leading ./ from key if present
        const subpath = key.replace(/^\.\/?/, "");

        // Target file in alias dir
        // e.g. key="." -> aliasDir/index.mjs
        // e.g. key="./utils" -> aliasDir/utils/index.mjs

        const fileDir = path.join(distAliasesDir, subpath);
        await fs.mkdir(fileDir, { recursive: true });

        // Construct import path from canonical
        // e.g. canonical/utils or just canonical
        const canonicalImport = subpath ? `${canonical}/${subpath}` : canonical;

        const fileContent = [
          `export * from "${canonicalImport}";`,
          `export { default } from "${canonicalImport}";`,
        ].join("\n");

        const fileName = "index.mjs";
        const dtsFileName = "index.d.mts";

        await Promise.all([
          fs.writeFile(path.join(fileDir, fileName), fileContent, "utf-8"),
          fs.writeFile(path.join(fileDir, dtsFileName), fileContent, "utf-8"),
        ]);

        // Update Alias Package JSON exports
        if (!aliasPkgJson.exports) aliasPkgJson.exports = {};
        aliasPkgJson.exports[key] = {
          import: `./${[subpath, fileName].join("/")}`.replace(/\/+/, "/"),
          types: `./${[subpath, dtsFileName].join("/")}`.replace(/\/+/, "/"),
          default: `./${[subpath, fileName].join("/")}`.replace(/\/+/, "/"),
        };
      }

      if (aliasPkgJson.exports?.["."]) {
        // Set main/module/types for compatibility if "." exists
        aliasPkgJson.main = aliasPkgJson.exports["."].default;
        aliasPkgJson.module = aliasPkgJson.exports["."].import;
        aliasPkgJson.types = aliasPkgJson.exports["."].types;
      }

      for (const alias of aliases) {
        await Promise.all([
          fs.writeFile(
            path.join(distAliasesDir, "README.md"),
            readmeContent.replaceAll("::alias::", alias),
            "utf-8",
          ),
          fs.writeFile(
            path.join(distAliasesDir, "package.json"),
            JSON.stringify({ ...aliasPkgJson, name: alias }, null, 2),
            "utf-8",
          ),
        ]);
        console.log(`Publishing alias ${alias}...`);
        try {
          execSync(`npm publish --provenance --access public`, {
            cwd: distAliasesDir,
            stdio: "inherit",
          });
          console.log(`Successfully published ${alias}`);
        } catch (err) {
          console.error(`Failed to publish ${alias}:`, err);
        }
      }
    }),
  );
};

if (process.env["NPM_TOKEN"]) {
  execSync(
    `npm config set //registry.npmjs.org/:_authToken ${process.env["NPM_TOKEN"]}`,
  );
}

publishAliases()
  .then(() => console.log("Aliases published successfully"))
  .catch((e) => {
    console.error("Failed to publish aliases", e);
    process.exit(1);
  });
