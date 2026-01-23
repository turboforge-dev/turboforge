import { execSync } from "node:child_process";

// Simple logic to find recent tags and create releases if missing
const createReleases = () => {
  const tags = execSync("git tag --points-at HEAD")
    .toString()
    .split("\n")
    .filter(Boolean);

  for (const tag of tags) {
    try {
      console.log(`Creating release for ${tag}...`);
      // Uses GitHub CLI to create a release from the tag
      // --generate-notes automatically pulls the relevant section from CHANGELOG.md
      execSync(`gh release create ${tag} --generate-notes`);
      // biome-ignore lint/suspicious/noExplicitAny: Ok for errors
    } catch (e: any) {
      console.error(`Failed to create release for ${tag}:`, e.message);
    }
  }
};

createReleases();
