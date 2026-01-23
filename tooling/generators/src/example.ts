import fs from "node:fs";
import path from "node:path";
import type { PlopGeneratorConfig } from "plop";
import { cwd, getInternalPackages, TEMPLATE_DIR } from "./utils";

export const exampleGenerator: PlopGeneratorConfig = {
  description: "Scaffold a new example app",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "What is the example name? (e.g., 'basic-demo')",
      validate: (input: string) => input.length > 0 || "Name is required",
    },
    {
      type: "input",
      name: "description",
      message: "Enter a brief description for the example:",
    },
    {
      type: "list",
      name: "framework",
      message: "Which framework would you like to use?",
      choices: [
        { name: "Vite (React)", value: "vite" },
        { name: "Next.js", value: "next" },
      ],
      default: "vite",
    },
    {
      type: "checkbox",
      name: "dependencies",
      message: "Select internal packages to include:",
      choices: getInternalPackages(),
    },
  ],
  actions: (data) => {
    if (!data) return [];

    // Add logic to update .changeset/config.json
    const changesetConfigPath = path.resolve(cwd, ".changeset/config.json");
    if (fs.existsSync(changesetConfigPath)) {
      const config = JSON.parse(fs.readFileSync(changesetConfigPath, "utf-8"));
      const examplePattern = `@example/*`;
      if (!config.ignore.includes(examplePattern)) {
        config.ignore.push(examplePattern);
        config.ignore.sort();
        fs.writeFileSync(
          changesetConfigPath,
          `${JSON.stringify(config, null, 2)}\n`,
        );
      }
    }

    return [
      {
        type: "addMany",
        destination: path.resolve(cwd, "examples/{{dashCase name}}"),
        base: `${TEMPLATE_DIR}example-{{framework}}`,
        templateFiles: `${TEMPLATE_DIR}example-{{framework}}/**`,
        data: {
          internalDependencies: data["dependencies"],
        },
      },
    ];
  },
};
