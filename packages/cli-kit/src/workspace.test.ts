import { describe, expect, test } from "vitest";
import { findProjectRoot, getWorkspacePackages, isMonorepo } from "./cli-kit";

describe("getWorkspacePackages", () => {
  test("should detect packages in this monorepo", () => {
    const root = findProjectRoot(); // Should be the actual repo root
    const packages = getWorkspacePackages(root);

    // We expect packages/forge-kit to be in the list
    const hasForgeKit = packages.some(
      (p) => p.endsWith("cli-kit") || p.endsWith("cli-kit/"),
    );
    expect(hasForgeKit).toBe(true);
  });

  test("should return empty array if no workspaces found", () => {
    const packages = getWorkspacePackages("/tmp");
    expect(packages).toEqual([]);
  });

  test("Should detect if it is monorepo", () => {
    expect(isMonorepo()).toBe(true);
    expect(isMonorepo("/tmp")).toBe(false);
  });
});
