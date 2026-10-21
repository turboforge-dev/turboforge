import path from "node:path";
import type { ActionType, PlopGeneratorConfig } from "plop";
import { cwd, getPackageDirs, TEMPLATE_DIR } from "./utils.ts";

interface InquirerDataType {
  pkg: string;
  createGuide: boolean;
}

const getActions = (data: InquirerDataType) => {
  const actions: ActionType[] = [
    {
      type: "add",
      path: path.resolve(cwd, "packages/{{pkg}}/docs/meta.json"),
      templateFile: `${TEMPLATE_DIR}docs/meta.json.hbs`,
      abortOnFail: true,
    },
  ];

  if (data.createGuide) {
    actions.push({
      type: "add",
      path: path.resolve(cwd, "packages/{{pkg}}/docs/getting-started.mdx"),
      templateFile: `${TEMPLATE_DIR}docs/getting-started.mdx.hbs`,
      abortOnFail: true,
    });
  }

  return actions;
};

export const docsGenerator: PlopGeneratorConfig = {
  description: "Scaffold docs directory, meta.json, and guides for a package",
  prompts: [
    {
      type: "list",
      name: "pkg",
      message: "Select package to generate documentation for:",
      choices: () => getPackageDirs(),
    },
    {
      type: "confirm",
      name: "createGuide",
      message: "Scaffold a starter guide page (getting-started.mdx)?",
      default: true,
    },
  ],
  actions: (data) => (data ? getActions(data as InquirerDataType) : []),
};
