import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { atomicWrite, execAsync, readJson } from "./utilts";

// Update husky - should not update .forge-meta.json in target repo - it acts as a reference for last synced commit
const preCommitPath = resolve(".husky/pre-commit");
const preCommitContent = await readFile(preCommitPath, "utf-8");
atomicWrite(
  preCommitPath,
  preCommitContent.split("# Update .forge-meta.json")[0],
);

// Updated workspace:* dep for packages to latest
const pkgPath = resolve("apps/web/package.json");
const webAppPkgJson = await readJson<{ dependencies: Record<string, string> }>(
  pkgPath,
);
if (!webAppPkgJson) {
  throw new Error(`Failed to read package.json at ${pkgPath}`);
}
webAppPkgJson.dependencies["remark-typedoc-mdx"] = "latest";
atomicWrite(pkgPath, JSON.stringify(webAppPkgJson, null, 2));

const gitOwnerAndRepo = (
  await execAsync(
    'git remote get-url --push origin | sed "s/https:\\/\\/github\\.com\\///" | sed "s/https:\\/\\/[^@]*@github\\.com\\///" | sed "s/\\.git//"',
  )
)
  .toString()
  .trim();
// Update SECURITY.md
const securityPath = resolve("SECURITY.md");
const securityContent = await readFile(securityPath, "utf-8");
atomicWrite(
  securityPath,
  securityContent.replace(/turboforge-dev\/turboforge/g, gitOwnerAndRepo),
);
