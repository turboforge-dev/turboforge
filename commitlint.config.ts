import { existsSync, readdirSync } from "node:fs";

const getDirectories = (path: string) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
    : [];

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "root",
        "tooling",
        "deps",
        "changeset",
        ...getDirectories("./packages"),
        ...getDirectories("./apps").map((app) => `@app/${app}`),
        ...getDirectories("./examples").map((example) => `@example/${example}`),
      ],
    ],
  },
};
