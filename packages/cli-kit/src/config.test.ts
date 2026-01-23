import path from "node:path";
import { describe, expect, test } from "vitest";
import { defineConfig, resolveConfig } from "./config";

describe("Config Helpers", () => {
  test("should merge defaults, env, and cli args correcty", async () => {
    const defaults = { foo: "default", bar: 1, baz: "default" };
    const envVars = { baz: "env" };
    const cliArgs = { bar: 2 };

    const config = await resolveConfig({
      name: "test",
      defaults,
      envVars,
      cliArgs,
      // mock cwd to somewhere empty so no files load
      cwd: path.resolve(process.cwd(), "packages/cli-kit/__tests__/nested"),
    });

    expect(config).toEqual({
      foo: "nested", // Env overrides default
      bar: 2, // CLI overrides default
      baz: "env", // Env overrides default
    });
  });

  test("cli args should override env vars", async () => {
    const envVars = { foo: "env" };
    const cliArgs = { foo: "cli" };

    const config = await resolveConfig({
      name: "test-config",
      envVars,
      cliArgs,
      cwd: path.resolve("/tmp"),
    });

    expect(config.foo).toBe("cli");
  });

  test("defineConfig", () => {
    const config = defineConfig({
      foo: "default",
      bar: 1,
      baz: "default",
    });

    expect(config).toEqual({
      foo: "default",
      bar: 1,
      baz: "default",
    });
  });
  test("should load explicit configFile if provided", async () => {
    const configPath = path.resolve(__dirname, "../__tests__/test.config.json");

    // We expect it to load ONLY this file and not try to find "test.config.*" in parent dirs
    const config = await resolveConfig({
      name: "non-existent-search", // Should be ignored
      configFile: configPath,
      defaults: { bar: 0 },
    });

    // test.config.json has { "foo": "json" }
    expect(config).toEqual({
      foo: "test",
      bar: 0,
    });
  });
});
