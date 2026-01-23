import { appendFileSync } from "node:fs";

// ANSI Escape Codes
const ESC = "\x1b[";
const colors = {
  gray: (msg: string) => `${ESC}90m${msg}${ESC}39m`,
  blue: (msg: string) => `${ESC}34m${msg}${ESC}39m`,
  yellow: (msg: string) => `${ESC}33m${msg}${ESC}39m`,
  red: (msg: string) => `${ESC}31m${msg}${ESC}39m`,
  // reset: (msg: string) => `${ESC}0m${msg}`,
};

/** Available log levels in order of severity */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Numeric mapping of log levels for filtering */
const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Creates a logger instance with configurable level and optional file output
 * @param config - Logger configuration
 * @param config.level - Minimum log level to output
 * @param config.logFile - Optional file path to write logs to
 * @returns Logger instance with debug, info, warn, and error methods
 */
export const createLogger = (config: { level: LogLevel; logFile?: string }) => {
  const currentLevel = LEVELS[config.level];

  /**
   * Internal log function that handles level filtering, formatting, and output
   * @param level - Log level for this message
   * @param message - Message to log
   */
  const log = (level: LogLevel, message: string) => {
    if (LEVELS[level] < currentLevel) return;

    const ts = new Date().toISOString();
    const raw = `[${ts}] [${level.toUpperCase()}] ${message}`;

    // Terminal logic
    const colorMap = {
      debug: colors.gray,
      info: colors.blue,
      warn: colors.yellow,
      error: colors.red,
    };

    // Only apply color if it's a TTY (standard terminal) or explicitly forced
    const isTTY =
      (process.stdout.isTTY && !process.env["NO_COLOR"]) ||
      !!process.env["FORCE_COLOR"];
    console.log(isTTY ? colorMap[level](raw) : raw);

    if (config.logFile) {
      appendFileSync(config.logFile, `${raw}\n`);
    }
  };

  return {
    debug: (message: string) => log("debug", message),
    info: (message: string) => log("info", message),
    warn: (message: string) => log("warn", message),
    error: (message: string) => log("error", message),
  };
};

/** Logger instance type with debug, info, warn, and error methods */
export type Logger = ReturnType<typeof createLogger>;
