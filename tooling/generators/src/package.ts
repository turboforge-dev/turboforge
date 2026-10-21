import { execSync } from "node:child_process";
import path from "node:path";
import type { ActionType, PlopGeneratorConfig } from "plop";
import { cwd, TEMPLATE_DIR } from "./utils.ts";

interface InquirerDataType {
  type: "ui" | "lib" | "cli";
  name: string;
  description: string;
  license: "MIT" | "MPL-2.0";
  fileName: string;
  pkgDir: string;
  scope: string;
  hasCustomFileName: boolean;
  configName: string;
  owner: string;
  repo: string;
}

const getActions = (data: InquirerDataType) => {
  const parts = data.name.split("/");
  const scope = parts.length > 1 ? parts[0]?.replace(/^@/, "").trim() : "";
  const rawName =
    parts.length > 1 ? parts[1]?.trim() || data.name : data.name.trim();

  data.scope = scope;
  data.pkgDir = rawName;
  data.fileName = data.type === "cli" && rawName === "cli" ? "shared" : rawName;
  data.hasCustomFileName =
    data.fileName !== "cli" &&
    data.fileName !== "shared" &&
    data.fileName !== scope;

  if (data.type === "cli") {
    if (!data.configName) {
      data.configName =
        rawName === "cli" && scope
          ? scope
          : rawName !== "cli"
            ? rawName
            : scope || "app";
    }
  } else {
    data.configName = rawName;
  }

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
      destination: path.resolve(cwd, "packages/{{kebabCase pkgDir}}"),
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
      name: "configName",
      message:
        "What is the configuration base name? (e.g., 'm2d' for m2d.config.json):",
      when: (answers: Partial<InquirerDataType>) => answers.type === "cli",
      default: (answers: Partial<InquirerDataType>) => {
        const parts = answers.name?.split("/") || [];
        const scope =
          parts.length > 1 ? parts[0]?.replace(/^@/, "").trim() : "";
        const raw = parts.length > 1 ? parts[1]?.trim() : answers.name?.trim();
        if (raw === "cli" && scope) return scope;
        if (raw && raw !== "cli") return raw;
        return scope || "app";
      },
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
        "Enter the owner/repository for the package (e.g., 'turboforge-dev/turboforge'):",
      default: () => {
        try {
          const url = execSync("git remote get-url --push origin", {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "ignore"],
          }).trim();
          return url
            .replace(/^https?:\/\/([^@]+@)?github\.com\//, "")
            .replace(/^git@github\.com:/, "")
            .replace(/\.git$/, "");
        } catch {
          return "turboforge-dev/turboforge";
        }
      },
    },
  ],
  actions: (data) => (data ? getActions(data as InquirerDataType) : []),
};
