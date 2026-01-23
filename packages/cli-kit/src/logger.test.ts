/** biome-ignore-all lint/suspicious/noExplicitAny: ok for test files */
import { appendFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

// Mock fs to prevent actual file writes
vi.mock("node:fs", () => ({
  appendFileSync: vi.fn(),
}));

describe("Logger (Zero-Dep)", () => {
  // Visual checks
  process.env["FORCE_COLOR"] = "1";
  const logger = createLogger({ level: "debug" });
  logger.debug("debug message");
  logger.info("info message");
  logger.warn("warn message");
  logger.error("error message");

  let consoleSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should filter logs based on level", () => {
    const logger = createLogger({ level: "info" });
    logger.debug("hidden message");

    expect(consoleSpy).not.toHaveBeenCalled();

    logger.info("visible message");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should apply ANSI colors when isTTY is true", () => {
    // Force TTY on
    vi.stubGlobal("process", {
      ...process,
      stdout: { ...process.stdout, isTTY: true },
      env: {},
    });

    const logger = createLogger({ level: "debug" });
    logger.error("fail");

    // Check for Red ANSI code (\x1b[31m)
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain("\x1b[31m");
  });

  it("should strip colors when NO_COLOR is set", () => {
    vi.stubGlobal("process", {
      ...process,
      env: { NO_COLOR: "1" },
    });

    const logger = createLogger({ level: "info" });
    logger.info("test");

    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).not.toContain("\x1b[");
  });

  it("should persist logs to file when logFile is provided", () => {
    const logPath = "./test.log";
    const logger = createLogger({ level: "info", logFile: logPath });

    logger.warn("warning message");

    expect(appendFileSync).toHaveBeenCalledWith(
      logPath,
      expect.stringContaining("[WARN] warning message\n"),
    );
  });
});
