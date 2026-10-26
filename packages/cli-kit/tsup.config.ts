import { defineConfig, type Options } from "tsup";

export default defineConfig(
  (options: Options) =>
    ({
      format: ["cjs", "esm"],
      target: "es2022",
      tsconfig: "../../tsconfig.build.json",
      dts: !process.env.VERCEL && !process.env.NO_DTS,
      entry: ["./src/index.ts"],
      sourcemap: false,
      clean: !options.watch,
      bundle: true,
      minify: !options.watch,
      ...options,
    }) as Options,
);
