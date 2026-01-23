import { existsSync, readdirSync } from "node:fs";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Default Environment for the whole workspace, can override per file using // @vitest-environment node as first line in any test file
    environment: "happy-dom",
    globals: true,
    // setupFiles: ["vitest.setup.ts"], // Uncomment and create `vitest.setup.ts` for setting up mocks etc.

    projects: readdirSync("./packages", { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map(({ name }) => {
        const pkgDir = `./packages/${name}`;
        const hasLocalConfig =
          existsSync(`${pkgDir}/vitest.config.ts`) ||
          existsSync(`${pkgDir}/vitest.config.mts`);

        if (hasLocalConfig) {
          return `packages/${name}`;
        }

        return {
          extends: true,
          test: {
            name,
            include: [`packages/${name}/**/*.test.*`],
            environment: "happy-dom",
          },
        };
      }),

    coverage: {
      include: ["packages/**/src/**"],
      exclude: [
        "packages/**/index.ts", // comment this line if your project does not use barrel files
        "packages/**/types.ts",
        "packages/**/*.test.*",
        "packages/**/declaration.d.ts",
      ],
      reporter: ["lcov", "text", "html"], // text/html for local DX
    },
  },
});
