import fs from "node:fs";
import path from "node:path";
import type { ActionType, PlopGeneratorConfig } from "plop";
import { cwd, getPackageDirs, TEMPLATE_DIR } from "./utils";

const packagesDir = path.resolve(cwd, "packages");

interface InquirerDataType {
  pkg: string;
  name: string;
  description: string;
}

/**
 * Gets actions based on the provided data.
 * @param data - Input data.
 * @returns Actions.
 */
const getActions = (data: InquirerDataType): ActionType[] => {
  if (!/use/i.test(data.name)) {
    data.name = `use-${data.name}`;
  }
  const actions: ActionType[] = [];
  const indexPath = `${data.pkg}/src/hooks/index.ts`;
  if (!fs.existsSync(path.resolve(packagesDir, indexPath))) {
    actions.push({
      type: "add",
      path: path.resolve(packagesDir, indexPath),
      template: '// hooks exports\nexport * from "./{{kebabCase name}}";',
    });
  } else {
    actions.push({
      type: "append",
      pattern: /(?<insertion> hooks exports)/,
      path: path.resolve(packagesDir, indexPath),
      template: 'export * from "./{{kebabCase name}}";',
    });
  }

  ["", ".test"].forEach((suffix) => {
    actions.push({
      type: "add",
      path: path.resolve(
        packagesDir,
        `${data.pkg}/src/hooks/{{kebabCase name}}${suffix}.ts`,
      ),
      templateFile: `${TEMPLATE_DIR}hook${suffix}.hbs`,
    });
  });

  return actions;
};

export const hookGenerator: PlopGeneratorConfig = {
  description: "Add a new React hook.",
  prompts: [
    {
      type: "list",
      name: "pkg",
      choices: getPackageDirs(),
      default: "lib",
      message: "Select the package",
    },
    {
      type: "input",
      name: "name",
      message: "What is the name of the hook?",
    },
    {
      type: "input",
      name: "description",
      message:
        "Describe your custom hook. (This will be added as js-doc comment.)",
    },
  ],
  actions: (data) => (data ? getActions(data as InquirerDataType) : []),
};
