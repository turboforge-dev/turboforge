import { readFile } from "node:fs/promises";
import { describe, expect, test, vi } from "vitest";
import { getWorkspacePackages, isMonorepo } from "./workspace";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  access: vi.fn(),
}));

// workspace.ts uses readJson/existsAsync from ./utils which use node:fs/promises
// We mock node:fs/promises to control behavior

describe("workspace (unit)", () => {
  test("should handle workspaces as object with packages array", async () => {
    const { access } = await import("node:fs/promises");
    // package.json exists, pnpm-workspace.yaml does not
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({ workspaces: { packages: ["apps/*"] } }),
    );
    // existsAsync for pnpm-workspace.yaml -> false
    vi.mocked(access).mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    const packages = await getWorkspacePackages("/mock");
    expect(packages).toEqual([]);
  });

  test("isMonorepo returns true when pnpm-workspace.yaml exists", async () => {
    const { access } = await import("node:fs/promises");
    // package.json read fails (no workspaces field)
    vi.mocked(readFile).mockRejectedValueOnce(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    // pnpm-workspace.yaml exists
    vi.mocked(access).mockResolvedValueOnce(undefined);
    expect(await isMonorepo("/some/path")).toBe(true);
  });
});
