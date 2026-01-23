import fs from "node:fs";
import path from "node:path";
import type { ActionType, PlopGeneratorConfig } from "plop";
import { plopUtilsRef } from ".";
import { cwd, getPackageDirs, TEMPLATE_DIR } from "./utils";

const packagesDir = path.resolve(cwd, "packages");

/**
 * @typedef {Object} InquirerDataType
 * @property {string} pkg - Target package path (e.g., "lib" or "packages/shared").
 * @property {string} name - Component name, possibly nested under subdirectories.
 * @property {boolean} isClient - Whether this is a client component (adds "use client" directive).
 * @property {boolean} createScss - Whether to create an accompanying `.module.scss` file.
 * @property {boolean} createTestStub - Whether to generate a test stub file.
 * @property {string} description - Description of the component to be added as a JSDoc comment.
 */
interface InquirerDataType {
  pkg: string;
  name: string;
  isClient: boolean;
  createScss: boolean;
  createTestStub: boolean;
  description: string;
}

/**
 * Ensures nested directories have `index.ts` files and proper exports.
 * @param nestedRouteActions - Action array to be populated.
 * @param rootSegments - Base path segments (e.g., `["lib", "src", "client"]`).
 * @param currentDirSegments - Current nested path segments.
 * @param data - CLI prompt data.
 * @param pkgJSON - Parsed package.json content.
 */
const updateIndexFilesIfNeeded = (
  nestedRouteActions: ActionType[],
  rootSegments: string[],
  currentDirSegments: string[],
  data: InquirerDataType,
) => {
  const indexFilePath = path.resolve(
    packagesDir,
    ...rootSegments,
    ...currentDirSegments,
    "index.ts",
  );
  const root = rootSegments.join("/");

  if (!fs.existsSync(indexFilePath)) {
    const content = `${data.isClient ? '"use client";\n' : ""}// ${currentDirSegments.join(
      "/",
    )} component exports\n`;
    const dirPath = `${root + currentDirSegments.join("/")}`;

    nestedRouteActions.push({
      type: "add",
      path: path.resolve(packagesDir, `${dirPath}/index.ts`),
      template: content,
    });

    const length = currentDirSegments.length;
    nestedRouteActions.push({
      type: "append",
      pattern: /(?<insertion> component exports)/,
      path: path.resolve(
        packagesDir,
        `${
          root +
          (length === 1
            ? ""
            : `${currentDirSegments.slice(0, length - 1).join("/")}/`)
        }index.ts`,
      ),
      template: `export * from "./${currentDirSegments[length - 1]}"`,
    });
  }
};

/**
 * Initializes root-level files and exports for the target package.
 * @param data - CLI input values.
 * @param pkgJSON - Parsed package.json.
 * @returns
 */
const createRootIndexAndDeclarations = (
  data: InquirerDataType,
): {
  nestedRouteActions: ActionType[];
  root: string;
} => {
  const nestedRouteActions: ActionType[] = [];
  const { isClient } = data;
  const srcDir = path.resolve(packagesDir, `${data.pkg}/src`);
  const [banner, target] = isClient
    ? ['"use client";\n\n', "client"]
    : ["", "server"];
  const root = `${data.pkg}/src/${target}/`;

  // Create src/index.ts
  if (!fs.existsSync(path.resolve(srcDir, "index.ts"))) {
    nestedRouteActions.push({
      type: "add",
      path: path.resolve(packagesDir, `${data.pkg}/src/index.ts`),
      template: `${banner}export * from "./${target}";\n`,
    });
  }

  // Create src/declaration.d.ts
  if (!fs.existsSync(path.resolve(srcDir, "declaration.d.ts"))) {
    nestedRouteActions.push({
      type: "add",
      path: path.resolve(packagesDir, `${data.pkg}/src/declaration.d.ts`),
      template:
        'declare module "*.module.css";\ndeclare module "*.module.scss";\n',
    });
  }

  // Create src/client|server/index.ts
  if (!fs.existsSync(path.resolve(packagesDir, root, "index.ts"))) {
    nestedRouteActions.push({
      type: "add",
      path: path.resolve(packagesDir, `${root}index.ts`),
      template: `${banner}/**\n * Server and client components must be exported from separate files.\n * This ensures correct behavior of the "use client" directive.\n */\n\n// ${target} component exports\n`,
    });
  }

  return { nestedRouteActions, root };
};

/**
 * Generates directory structure and nested index files.
 * @param data
 * @param pkgJSON
 * @returns
 */
const getNestedRouteActions = (
  data: InquirerDataType,
): {
  nestedRouteActions: ActionType[];
  parentDir: string;
} => {
  const name = data.name.replace(/\/+/g, "/").replace(/\/$/, "").trim();
  const { nestedRouteActions, root } = createRootIndexAndDeclarations(data);

  if (!name.includes("/")) return { nestedRouteActions, parentDir: root };

  const lastSlashInd = name.lastIndexOf("/") || name.lastIndexOf("\\");
  data.name = name.slice(lastSlashInd + 1);

  const directories = plopUtilsRef
    .toKebabPath(name.slice(0, lastSlashInd))
    .split(/\/|\\/);
  const rootSegments = [...root.split(/\/|\\/)];

  for (let i = 1; i <= directories.length; i++) {
    updateIndexFilesIfNeeded(
      nestedRouteActions,
      rootSegments,
      directories.slice(0, i),
      data,
    );
  }

  return { nestedRouteActions, parentDir: `${root + directories.join("/")}/` };
};

/**
 * Adds or updates the component-level index file.
 * @param data
 * @param parentDir
 * @param pkgJSON
 * @returns
 */
const getIndexAction = (
  data: InquirerDataType,
  parentDir: string,
): ActionType => {
  const dirPath = path.resolve(
    packagesDir,
    parentDir,
    plopUtilsRef.toKebabPath(data.name),
  );
  const indFilePath = path.resolve(dirPath, "index.ts");

  if (fs.existsSync(indFilePath)) {
    return {
      type: "append",
      pattern: /(?<insertion> component exports)/,
      path: path.resolve(
        packagesDir,
        `${parentDir}{{kebabCase name}}/index.ts`,
      ),
      template: 'export * from "./{{kebabCase name}}";',
    };
  }

  return {
    type: "add",
    path: path.resolve(packagesDir, `${parentDir}{{kebabCase name}}/index.ts`),
    template: `${
      data.isClient ? '"use client";\n\n' : ""
    }// component exports\nexport * from "./{{kebabCase name}}";\n`,
  };
};

/**
 * Main generator logic – builds all actions for Plop.
 * @param data
 * @returns
 */
const getActions = (data: InquirerDataType): ActionType[] => {
  const { nestedRouteActions, parentDir } = getNestedRouteActions(data);
  const indexAction = getIndexAction(data, parentDir);

  const filesActions: ActionType[] = [];

  if (data.createScss) {
    filesActions.push({
      type: "add",
      path: path.resolve(
        packagesDir,
        `${parentDir}{{kebabCase name}}/{{kebabCase name}}.tsx`,
      ),
      templateFile: `${TEMPLATE_DIR}component.hbs`,
    });
    filesActions.push({
      type: "add",
      path: path.resolve(
        packagesDir,
        `${parentDir}{{kebabCase name}}/{{kebabCase name}}.module.scss`,
      ),
      templateFile: `${TEMPLATE_DIR}component.module.hbs`,
    });
  } else {
    filesActions.push({
      type: "add",
      path: path.resolve(
        packagesDir,
        `${parentDir}{{kebabCase name}}/{{kebabCase name}}.tsx`,
      ),
      templateFile: `${TEMPLATE_DIR}component-noscss.hbs`,
    });
  }

  if (data.createTestStub) {
    filesActions.push({
      type: "add",
      path: path.resolve(
        packagesDir,
        `${parentDir}{{kebabCase name}}/{{kebabCase name}}.test.tsx`,
      ),
      templateFile: `${TEMPLATE_DIR}component.test.hbs`,
    });
  }

  return nestedRouteActions.concat([
    indexAction,
    ...filesActions,
    {
      type: "append",
      // @ts-expect-error -- improper type
      pattern: /(?<insertion> component exports)/,
      path: path.resolve(packagesDir, `${parentDir}index.ts`),
      template: 'export * from "./{{kebabCase name}}";',
    },
  ]);
};

/**
 * Plop generator configuration for adding React components.
 */
export const componentGenerator: PlopGeneratorConfig = {
  description: "Scaffold a new React component inside the selected package.",
  prompts: [
    {
      type: "list",
      name: "pkg",
      choices: getPackageDirs(),
      message: "Choose the target package:",
    },
    {
      type: "input",
      name: "name",
      message: "Enter component name (with optional nested path):",
    },
    {
      type: "confirm",
      name: "isClient",
      message: 'Is this a client component? (Adds `"use client"` directive)',
    },
    {
      type: "confirm",
      name: "createScss",
      message: "Do you want to create a .module.scss file?",
      default: true,
    },
    {
      type: "confirm",
      name: "createTestStub",
      message: "Should we include a unit test file?",
      default: true,
    },
    {
      type: "input",
      name: "description",
      message: "Provide a brief description (used in JSDoc comment):",
    },
  ],
  actions: (data) => (data ? getActions(data as InquirerDataType) : []),
};
