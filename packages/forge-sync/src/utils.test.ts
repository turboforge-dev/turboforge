import * as fs from "node:fs/promises";
import * as cliKit from "@turbo-forge/cli-kit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkFileExists,
  cleanCheck,
  createAndApplyPatch,
  getBaseCommit,
  sanitizeGitRef,
  sanitizeLogInput,
  sanitizeRemoteName,
} from "./utils";

vi.mock("@turbo-forge/cli-kit", () => ({
  execAsync: vi.fn(),
  execFileAsync: vi.fn(),
  createLogger: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  access: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
}));

describe("utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cleanCheck", () => {
    it("should resolve if git is clean", async () => {
      vi.mocked(cliKit.execAsync).mockResolvedValue({
        stdout: "",
      } as unknown as { stdout: string; stderr: string });
      await expect(cleanCheck()).resolves.toEqual([
        { stdout: "" },
        { stdout: "" },
      ]);
    });

    it("should reject if git is dirty", async () => {
      vi.mocked(cliKit.execAsync).mockRejectedValueOnce(new Error("dirty"));
      await expect(cleanCheck()).rejects.toThrow("dirty");
    });
  });

  describe("checkFileExists", () => {
    it("should return true if access succeeds", async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      expect(await checkFileExists("foo")).toBe(true);
    });

    it("should return false if access fails", async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));
      expect(await checkFileExists("foo")).toBe(false);
    });
  });

  describe("sanitization", () => {
    it("should sanitize git refs", () => {
      expect(sanitizeGitRef("feature/branch-1")).toBe("featurebranch1");
      expect(sanitizeGitRef("foo; rm -rf /")).toBe("foormrf");
    });

    it("should sanitize remote names", () => {
      expect(sanitizeRemoteName("origin")).toBe("origin");
      expect(sanitizeRemoteName("my_remote-1")).toBe("my_remote-1");
      expect(() => sanitizeRemoteName("-invalid")).toThrow();
    });

    it("should sanitize log input", () => {
      expect(sanitizeLogInput("foo\nbar")).toBe("foobar");
    });
  });

  describe("getBaseCommit", () => {
    it("should read from meta file if available", async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({ lastSyncedCommit: "abc" }),
      );
      expect(await getBaseCommit(".meta")).toBe("abc");
    });

    it("should fallback to git log calculation", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error("no file"));
      vi.mocked(cliKit.execAsync)
        .mockResolvedValueOnce({
          stdout: "2023-01-01 10:00:00\n",
        } as unknown as { stdout: string; stderr: string }) // first commit date
        .mockResolvedValueOnce({
          stdout: "hash1::2023-01-01 09:00:00\nhash2::2023-01-01 11:00:00\n",
        } as unknown as { stdout: string; stderr: string }); // template log

      await getBaseCommit(".meta");

      expect(cliKit.execAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe("createAndApplyPatch", () => {
    const mockLogger = {
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    it("should create and apply patch successfully", async () => {
      vi.mocked(cliKit.execFileAsync).mockResolvedValue({
        stdout: "patch content",
      } as unknown as { stdout: string; stderr: string });
      vi.mocked(cliKit.execAsync).mockResolvedValue({
        stdout: "",
      } as unknown as { stdout: string; stderr: string });

      await createAndApplyPatch({
        remoteName: "origin",
        baseRef: "base",
        targetRef: "target",
        exclusions: [],
        logger: mockLogger as unknown as cliKit.Logger,
        maxRetries: 3,
        errorLogs: [],
      });

      expect(cliKit.execFileAsync).toHaveBeenCalledWith(
        "git",
        expect.arrayContaining(["diff", "base", "origin/target"]),
        expect.anything(),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        ".template.patch",
        "patch content",
      );
      expect(cliKit.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("git apply --3way"),
        expect.anything(),
      );
    });

    it("should stop after max retries", async () => {
      await createAndApplyPatch(
        {
          remoteName: "origin",
          baseRef: "base",
          targetRef: "target",
          exclusions: [],
          logger: mockLogger as unknown as cliKit.Logger,
          maxRetries: 0,
          errorLogs: [],
        },
        1,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Max patch recursion reached"),
      );
      expect(cliKit.execFileAsync).not.toHaveBeenCalled();
    });

    it("should recurse on patch failure", async () => {
      vi.mocked(cliKit.execFileAsync).mockResolvedValue({
        stdout: "patch content",
      } as unknown as { stdout: string; stderr: string });

      // First attempt fails
      const error = new Error("patch failed");
      (error as unknown as { stderr: string }).stderr =
        "error: src/file.ts: patch failed";
      vi.mocked(cliKit.execAsync)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          stdout: "",
        } as unknown as { stdout: string; stderr: string }); // Second attempt succeeds

      await createAndApplyPatch({
        remoteName: "origin",
        baseRef: "base",
        targetRef: "target",
        exclusions: [],
        logger: mockLogger as unknown as cliKit.Logger,
        maxRetries: 3,
        errorLogs: [],
      });

      // Should have parsed error and added exclusion
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Added to exclusions: src/file.ts"),
      );

      // Should have recursed (called execFileAsync twice)
      expect(cliKit.execFileAsync).toHaveBeenCalledTimes(2);
    });
  });
});
