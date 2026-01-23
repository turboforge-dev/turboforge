/** biome-ignore-all lint/suspicious/noExplicitAny: Use of any is ok for test files */
import * as fs from "node:fs/promises";
import * as cliKit from "@turbo-forge/cli-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main, parseArgs, showHelp } from "./cli";
import * as forgeSyncModule from "./forge-sync";
import * as utils from "./utils";

vi.mock("@turbo-forge/cli-kit", () => ({
  findProjectRoot: vi.fn(),
  resolveConfig: vi.fn(),
  LogLevel: {},
}));

vi.mock("./forge-sync", () => ({
  forgeSync: vi.fn(),
  DEFAULT_CONFIG: {
    logLevel: "info",
    metaFile: ".forge-meta.json",
  },
}));

vi.mock("./utils", () => ({
  getBaseCommit: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn(),
}));

describe("cli-main", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseArgs", () => {
    it("should parse boolean flags", () => {
      const args = ["--dry-run", "--skip-clean-check", "--init", "--help"];
      const opts = parseArgs(args);
      expect(opts.dryRun).toBe(true);
      expect(opts.skipCleanCheck).toBe(true);
      expect(opts.init).toBe(true);
      expect(opts.help).toBe(true);
    });

    it("should parse value flags", () => {
      const args = [
        "--template-url",
        "http://foo",
        "--exclude",
        "a,b",
        "--max-retries",
        "5",
        "--post-sync",
        "echo 1",
        "--remote-name",
        "upstream",
        "--base-ref",
        "base",
        "--target-ref",
        "target",
        "--meta-file",
        "meta.json",
        "--backup-dir",
        "backup",
      ];
      const opts = parseArgs(args);
      expect(opts.templateUrl).toBe("http://foo");
      expect(opts.excludePaths).toEqual(["a", "b"]);
      expect(opts.maxPatchRetries).toBe(5);
      expect(opts.postSync).toEqual(["echo 1"]);
      expect(opts.remoteName).toBe("upstream");
      expect(opts.baseRef).toBe("base");
      expect(opts.targetRef).toBe("target");
      expect(opts.metaFile).toBe("meta.json");
      expect(opts.backupDir).toBe("backup");
    });

    it("should parse aliases", () => {
      const args = ["-l", "debug", "-c", "conf.json"];
      const opts = parseArgs(args);
      expect(opts.logLevel).toBe("debug");
      expect(opts.config).toBe("conf.json");
    });
  });

  describe("showHelp", () => {
    it("should print help message", () => {
      showHelp();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Usage: forge-sync"),
      );
    });
  });

  describe("main", () => {
    it("should show help if requested", async () => {
      await main(["--help"]);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Usage:"),
      );
      expect(forgeSyncModule.forgeSync).not.toHaveBeenCalled();
    });

    it("should init config file", async () => {
      vi.mocked(cliKit.findProjectRoot).mockReturnValue("/root");
      await main(["--init"]);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("forge-sync.config.json"),
        expect.any(String),
      );
    });

    it("should init custom config file", async () => {
      vi.mocked(cliKit.findProjectRoot).mockReturnValue("/root");
      await main(["--init", "my.json"]);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("my.json"),
        expect.any(String),
      );
    });

    it("should resolve config and run sync", async () => {
      const mockConfig = { metaFile: ".meta", remoteName: "origin" };
      vi.mocked(cliKit.resolveConfig).mockResolvedValue(mockConfig as any);
      vi.mocked(utils.getBaseCommit).mockResolvedValue("commit-hash");

      await main(["--dry-run"]);

      expect(cliKit.resolveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "forge-sync",
          cliArgs: expect.objectContaining({ dryRun: true }),
        }),
      );
      expect(utils.getBaseCommit).toHaveBeenCalledWith(".meta");
      expect(forgeSyncModule.forgeSync).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockConfig,
          baseRef: "commit-hash",
        }),
      );
    });
  });
});
