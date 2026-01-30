import { execSync } from "node:child_process";
import path from "node:path";
import type { ActionType, PlopGeneratorConfig } from "plop";
import { cwd, TEMPLATE_DIR } from "./utils";

interface InquirerDataType {
  type: "ui" | "lib" | "cli";
  name: string;
  description: string;
  license: "MIT" | "MPL-2.0";
  fileName: string;
  owner: string;
  repo: string;
}

const getActions = (data: InquirerDataType) => {
  data.fileName = data.name.split("/")[1]?.trim() || data.name;
  const [owner, repo] = data.repo.split("/");
  data.owner = owner;
  data.repo = repo;
  let pkgTemplateDir = "";
  switch (data.type) {
    case "cli":
      pkgTemplateDir = "cli-lib";
      break;
    case "lib":
      pkgTemplateDir = "utils-lib";
      break;
    case "ui":
      pkgTemplateDir = "ui-lib";
      break;
  }

  const actions: ActionType[] = [
    {
      type: "addMany",
      destination: path.resolve(cwd, "packages/{{kebabCase fileName}}"),
      base: `${TEMPLATE_DIR}${pkgTemplateDir}`,
      templateFiles: [`${TEMPLATE_DIR}${pkgTemplateDir}/**`],
    },
  ];

  return actions;
};

export const packageGenerator: PlopGeneratorConfig = {
  description: "Scaffold a new package in the monorepo",
  prompts: [
    {
      type: "list",
      name: "type",
      message: "What type of package is this?",
      choices: [
        { name: "Pure utilities Library (Logic, Node-env)", value: "lib" },
        { name: "UI Library (React, Happy-dom)", value: "ui" },
        { name: "CLI Tool", value: "cli" },
      ],
      default: "lib",
    },
    {
      type: "input",
      name: "name",
      message: "What is the package name? (e.g., 'utils' or 'ui-core')",
      validate: (input: string) => input.length > 0 || "Name is required",
    },
    {
      type: "input",
      name: "description",
      message: "Enter a brief description for the package:",
    },
    {
      type: "list",
      name: "license",
      message: "What license does the package use?",
      choices: [
        { name: "MIT", value: "MIT" },
        { name: "MPL-2.0", value: "MPL-2.0" },
      ],
      default: "MIT",
    },
    {
      type: "input",
      name: "repo",
      message:
        "Enter the owner/repository for the package (e.g., 'react18-tools/turbo-forge'):",
      default: execSync(
        'git remote get-url --push origin | sed "s/https:\\/\\/github\\.com\\///" | sed "s/https:\\/\\/[^@]*@github\\.com\\///" | sed "s/\\.git//"',
      )
        .toString()
        .trim(),
    },
  ],
  actions: (data) => (data ? getActions(data as InquirerDataType) : []),
};
