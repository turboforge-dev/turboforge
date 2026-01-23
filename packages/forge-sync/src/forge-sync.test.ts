import * as fs from "node:fs/promises";
import * as cliKit from "@turbo-forge/cli-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG, type ForgeSyncOptions, forgeSync } from "./forge-sync";
import * as utils from "./utils";

// Mock dependencies
vi.mock("@turbo-forge/cli-kit", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  deepMerge: vi.fn((a, b) => ({ ...a, ...b })),
  execAsync: vi.fn(),
  execFileAsync: vi.fn(),
}));

vi.mock("./utils", () => ({
  cleanCheck: vi.fn(),
  createAndApplyPatch: vi.fn(),
  resolvePackageJSONConflicts: vi.fn(),
  sanitizeGitRef: vi.fn((s) => s),
  sanitizeRemoteName: vi.fn((s) => s),
  sanitizeLogInput: vi.fn((s) => s),
}));

vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn(),
}));

describe("forgeSync", () => {
  const loggerMock = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cliKit.createLogger).mockReturnValue(
      loggerMock as unknown as cliKit.Logger,
    );
    // Default default deepMerge behavior for simple tests
    vi.mocked(cliKit.deepMerge).mockImplementation((def, opts) => ({
      ...def,
      ...opts,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fail validation if baseRef is missing", async () => {
    await forgeSync({} as ForgeSyncOptions);
    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining("Base ref is required"),
    );
    expect(utils.cleanCheck).not.toHaveBeenCalled();
  });

  it("should perform clean check by default", async () => {
    vi.mocked(cliKit.deepMerge).mockReturnValue({
      ...DEFAULT_CONFIG,
      baseRef: "main",
    } as unknown as Required<ForgeSyncOptions>);

    await forgeSync({ baseRef: "main" });

    expect(utils.cleanCheck).toHaveBeenCalled();
    expect(loggerMock.info).toHaveBeenCalledWith("Git tree is clean");
  });

  it("should skip clean check if configured", async () => {
    vi.mocked(cliKit.deepMerge).mockReturnValue({
      ...DEFAULT_CONFIG,
      baseRef: "main",
      skipCleanCheck: true,
    } as unknown as Required<ForgeSyncOptions>);

    await forgeSync({ baseRef: "main", skipCleanCheck: true });

    expect(utils.cleanCheck).not.toHaveBeenCalled();
    expect(loggerMock.info).toHaveBeenCalledWith("Skipping git clean check");
  });

  it("should handle dry run correctly", async () => {
    vi.mocked(cliKit.deepMerge).mockReturnValue({
      ...DEFAULT_CONFIG,
      baseRef: "main",
      dryRun: true,
    } as unknown as Required<ForgeSyncOptions>);

    vi.mocked(cliKit.execFileAsync).mockResolvedValue({
      stdout: "mock patch content",
    } as unknown as { stdout: string; stderr: string });

    await forgeSync({ baseRef: "main", dryRun: true });

    // Should fetch
    expect(cliKit.execFileAsync).toHaveBeenCalledWith(
      "git",
      expect.arrayContaining(["fetch", "template"]),
    );
    // Should NOT apply patch
    expect(utils.createAndApplyPatch).not.toHaveBeenCalled();
    // Should print patch preview
    expect(loggerMock.info).toHaveBeenCalledWith("📋 Patch preview:");
    expect(loggerMock.info).toHaveBeenCalledWith("mock patch content");
  });

  it("should execute full sync flow", async () => {
    vi.mocked(cliKit.deepMerge).mockReturnValue({
      ...DEFAULT_CONFIG,
      baseRef: "main",
      targetRef: "target-branch",
    } as unknown as Required<ForgeSyncOptions>);

    vi.mocked(cliKit.execFileAsync).mockResolvedValue({
      stdout: "new-commit-hash",
    } as unknown as { stdout: string; stderr: string });

    await forgeSync({ baseRef: "main", targetRef: "target-branch" });

    // 1. Add remote & clean backup
    expect(cliKit.execFileAsync).toHaveBeenCalledWith(
      "git",
      expect.arrayContaining([
        "remote",
        "add",
        "template",
        DEFAULT_CONFIG.templateUrl,
      ]),
    );

    // 2. Fetch
    expect(cliKit.execFileAsync).toHaveBeenCalledWith(
      "git",
      expect.arrayContaining(["fetch", "template"]),
    );

    // 3. Create & Apply Patch
    expect(utils.createAndApplyPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        baseRef: "main",
        targetRef: "target-branch",
        remoteName: "template",
      }),
    );

    // 4. Write Meta File
    expect(fs.writeFile).toHaveBeenCalledWith(
      DEFAULT_CONFIG.metaFile,
      expect.stringContaining("new-commit-hash"),
    );

    // 5. Resolve Conflicts
    expect(utils.resolvePackageJSONConflicts).toHaveBeenCalled();

    // 6. Post Sync
    expect(cliKit.execAsync).toHaveBeenCalledWith(DEFAULT_CONFIG.postSync[0]);

    // 7. Cleanup Remote
    expect(cliKit.execFileAsync).toHaveBeenCalledWith("git", [
      "remote",
      "remove",
      "template",
    ]);
  });

  it("should handle clean check failure", async () => {
    vi.mocked(cliKit.deepMerge).mockReturnValue({
      ...DEFAULT_CONFIG,
      baseRef: "main",
    } as unknown as Required<ForgeSyncOptions>);

    vi.mocked(utils.cleanCheck).mockRejectedValue(new Error("dirty"));

    await forgeSync({ baseRef: "main" });

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining("Please commit or stash"),
    );
    // Should stop early
    expect(cliKit.execFileAsync).not.toHaveBeenCalled();
  });
});
