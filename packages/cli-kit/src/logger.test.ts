/** biome-ignore-all lint/suspicious/noExplicitAny: ok for test files */
import { createWriteStream } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

// Mock fs to prevent actual file writes
vi.mock("node:fs", () => ({
  createWriteStream: vi.fn().mockReturnValue({
    write: vi.fn(),
    on: vi.fn(),
    end: vi.fn(),
  }),
}));

describe("Logger (Zero-Dep)", () => {
  let stdoutSpy: any;
  let stderrSpy: any;
  const originalTTY = {
    stdout: process.stdout.isTTY,
    stderr: process.stderr.isTTY,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    // Reset env vars
    process.env["NO_COLOR"] = "";
    process.env["FORCE_COLOR"] = "";

    // Default TTY status
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    Object.defineProperty(process.stderr, "isTTY", {
      value: false,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalTTY.stdout,
      configurable: true,
    });
    Object.defineProperty(process.stderr, "isTTY", {
      value: originalTTY.stderr,
      configurable: true,
    });
  });

  it("should filter logs based on level", () => {
    const logger = createLogger({ level: "info" });
    logger.debug("hidden message");

    expect(stdoutSpy).not.toHaveBeenCalled();

    logger.info("visible message");
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it("should apply ANSI colors when isTTY is true", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      configurable: true,
    });
    Object.defineProperty(process.stderr, "isTTY", {
      value: true,
      configurable: true,
    });
    process.env["FORCE_COLOR"] = "1";

    const logger = createLogger({ level: "error" });
    logger.error("fail");

    // Check for Red ANSI code (\x1b[31m)
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain("\x1b[31m");
  });

  it("should strip colors when NO_COLOR is set", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      configurable: true,
    });
    process.env["NO_COLOR"] = "1";

    const logger = createLogger({ level: "info" });
    logger.info("test");

    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).not.toContain("\x1b[");
  });

  it("should persist logs to file when logFile is provided", () => {
    const logPath = "./test.log";
    const mockStream = {
      write: vi.fn(),
      on: vi.fn(),
      end: vi.fn(),
    };
    vi.mocked(createWriteStream).mockReturnValue(mockStream as any);

    const logger = createLogger({ level: "info", logFile: logPath });

    logger.warn("warning message");

    expect(createWriteStream).toHaveBeenCalledWith(logPath, { flags: "a" });
    expect(mockStream.write).toHaveBeenCalledWith(
      expect.stringContaining("[WARN] warning message\n"),
    );
  });
});
