/** biome-ignore-all lint/suspicious/noExplicitAny: ok for test files */
import { createWriteStream } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

// Mock fs to prevent actual file writes
vi.mock("node:fs", () => ({
  createWriteStream: vi.fn(),
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

  it("should use the provided logger name", () => {
    const logger = createLogger({ level: "info", name: "MYAPP" });
    logger.info("test message");
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain("[MYAPP:INFO]");
  });

  it("should log in JSON format", () => {
    const logger = createLogger({ level: "info", logFormat: "json" });
    logger.info("test message");
    const output = stdoutSpy.mock.calls[0][0] as string;
    const json = JSON.parse(output.trim());
    expect(json).toMatchObject({
      level: "info",
      message: "test message",
    });
  });

  it("should apply ANSI colors when isTTY is true", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      configurable: true,
    });
    process.env["FORCE_COLOR"] = "1";

    const logger = createLogger({ level: "debug" });

    logger.debug("gray");
    expect(stdoutSpy.mock.calls[0][0]).toContain("\x1b[90m");
    vi.clearAllMocks();

    logger.info("blue");
    expect(stdoutSpy.mock.calls[0][0]).toContain("\x1b[34m");
    vi.clearAllMocks();

    logger.warn("yellow");
    expect(stderrSpy.mock.calls[0][0]).toContain("\x1b[33m");
    vi.clearAllMocks();

    logger.error("red");
    expect(stderrSpy.mock.calls[0][0]).toContain("\x1b[31m");
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

  it("should handle stream errors", () => {
    const mockStream = {
      write: vi.fn(),
      on: vi.fn(),
      end: vi.fn(),
    };
    vi.mocked(createWriteStream).mockReturnValue(mockStream as any);

    const logger = createLogger({ level: "info", logFile: "error.log" });

    // Trigger error handler
    const errorCallback = (mockStream.on as any).mock.calls.find(
      (c: any) => c[0] === "error",
    )[1];
    errorCallback(new Error("Disk full"));

    logger.info("test");
    expect(mockStream.write).not.toHaveBeenCalled();
  });

  it("should close stream on logger.close()", () => {
    const mockStream = {
      write: vi.fn(),
      on: vi.fn(),
      end: vi.fn(),
    };
    vi.mocked(createWriteStream).mockReturnValue(mockStream as any);
    const logger = createLogger({ level: "info", logFile: "test.log" });

    logger.close();
    expect(mockStream.end).toHaveBeenCalled();

    // Multiple closes should be safe
    logger.close();
    expect(mockStream.end).toHaveBeenCalledTimes(1);
  });

  it("should handle write errors on stream", () => {
    const mockStream = {
      write: vi.fn().mockImplementation(() => {
        throw new Error("Write failed");
      }),
      on: vi.fn(),
      end: vi.fn(),
    };
    vi.mocked(createWriteStream).mockReturnValue(mockStream as any);
    const logger = createLogger({ level: "info", logFile: "fail.log" });

    logger.info("test");
    // Stream should be set to null after failure
    logger.info("test2");
    expect(mockStream.write).toHaveBeenCalledTimes(1);
  });
});
