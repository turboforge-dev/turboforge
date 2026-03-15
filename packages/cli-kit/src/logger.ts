import { createWriteStream, type WriteStream } from "node:fs";
import os from "node:os";

/**
 * ANSI escape prefix used for terminal coloring.
 */
const ESC = "\x1b[";

/**
 * Color helpers for terminal output.
 * Applied only when stdout is a TTY and colors are not disabled.
 */
const COLORS = {
  gray: (msg: string) => `${ESC}90m${msg}${ESC}39m`,
  blue: (msg: string) => `${ESC}34m${msg}${ESC}39m`,
  yellow: (msg: string) => `${ESC}33m${msg}${ESC}39m`,
  red: (msg: string) => `${ESC}31m${msg}${ESC}39m`,
};

/**
 * Log severity levels.
 *
 * Ordered from lowest → highest severity.
 * This ordering allows efficient numeric filtering.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Numeric mapping for log levels.
 *
 * Higher number = higher severity.
 * Used for fast runtime filtering.
 *
 * Aligns with common conventions used by tools like pino/bunyan.
 */
const LEVELS: Record<LogLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
} as const;

/**
 * Mapping between log level and terminal color formatter.
 */
const COLOR_MAP: Record<LogLevel, (msg: string) => string> = {
  debug: COLORS.gray,
  info: COLORS.blue,
  warn: COLORS.yellow,
  error: COLORS.red,
};

/**
 * Logger configuration.
 */
export interface LoggerConfig {
  /**
   * Minimum severity level to output.
   *
   * Logs below this level will be ignored.
   */
  level: LogLevel;

  /**
   * Optional file path to append logs to.
   *
   * If provided, logs will be written to both terminal and file.
   */
  logFile?: string;

  /**
   * Log format.
   *
   * `text` - Human-readable format
   * `json` - JSON format for machine parsing
   *
   * @default "text"
   */
  logFormat?: "text" | "json";

  /**
   * Optional name to prepend to all log messages.
   * Useful for identifying the source of logs in multi-process environments.
   */
  name?: string;
}

/**
 * Logger interface.
 */
export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;

  /**
   * Flushes and closes the file stream if active.
   *
   * Safe to call multiple times.
   */
  close: () => void;
}

/**
 * Creates a minimal structured logger.
 *
 * Features:
 * - Level-based filtering
 * - Colored terminal output
 * - Optional file logging
 * - Automatic stream cleanup on process exit
 *
 * Designed for:
 * - CLI tools
 * - developer utilities
 * - small Node services
 *
 * Example:
 *
 * ```ts
 * const logger = createLogger({ level: "info", logFile: "./app.log" })
 *
 * logger.info("Server started", port)
 * logger.warn("Cache miss")
 * logger.error("Unhandled error", err)
 * ```
 */
export const createLogger = (config: LoggerConfig): Logger => {
  const currentLevel = LEVELS[config.level];
  const logFormat = config.logFormat ?? "text";
  const name = config.name;

  const logLevelLabels = name
    ? {
        debug: `${name}:DEBUG`,
        info: `${name}:INFO`,
        warn: `${name}:WARN`,
        error: `${config.name}:ERROR`,
      }
    : {
        debug: "DEBUG",
        info: "INFO",
        warn: "WARN",
        error: "ERROR",
      };

  let stream: WriteStream | null = null;
  let closed = false;

  /**
   * Detect whether colored output should be used.
   */
  const isTTY =
    (process.stdout.isTTY && !process.env["NO_COLOR"]) ||
    !!process.env["FORCE_COLOR"];

  /**
   * Initialize file stream if requested.
   */
  if (config.logFile) {
    try {
      stream = createWriteStream(config.logFile, { flags: "a" });

      /**
       * If the stream errors (disk full, permission change, etc),
       * disable file logging but continue console logging.
       */
      stream.on("error", () => {
        stream = null;
      });
    } catch {
      stream = null;
    }
  }

  /**
   * Safely closes the file stream.
   */
  const close = () => {
    if (closed) return;
    closed = true;

    if (stream) {
      try {
        stream.end();
      } catch {
        // ignore
      }
      stream = null;
    }
  };

  /**
   * Ensure logs are flushed during normal process shutdown.
   *
   * This protects against lost logs when the consumer forgets
   * to explicitly call `logger.close()`.
   */
  process.once("exit", close);

  process.once("SIGINT", () => {
    close();
    process.exit(0);
  });

  process.once("SIGTERM", () => {
    close();
    process.exit(0);
  });

  const pid = process.pid;
  const hostname = os.hostname();

  /**
   * Core logging implementation.
   */
  const log = (level: LogLevel, ...args: unknown[]) => {
    if (LEVELS[level] < currentLevel) return;

    const ts = new Date().toISOString();
    const message = args.map(String).join(" ");

    const raw =
      logFormat === "json"
        ? JSON.stringify({ ts, level, message, pid, hostname, name })
        : `[${ts}] [${logLevelLabels[level]}] ${message}`;

    const output = isTTY && COLOR_MAP[level] ? COLOR_MAP[level](raw) : raw;

    const out =
      level === "warn" || level === "error" ? process.stderr : process.stdout;

    out.write(`${output}\n`);

    if (stream) {
      try {
        stream.write(`${raw}\n`);
      } catch {
        stream = null;
      }
    }
  };

  return {
    debug: (...args) => log("debug", ...args),
    info: (...args) => log("info", ...args),
    warn: (...args) => log("warn", ...args),
    error: (...args) => log("error", ...args),
    close,
  };
};
