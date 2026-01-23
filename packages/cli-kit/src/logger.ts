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

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const createLogger = (config: { level: LogLevel; logFile?: string }) => {
  const currentLevel = LEVELS[config.level];

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
    debug: (m: string) => log("debug", m),
    info: (m: string) => log("info", m),
    warn: (m: string) => log("warn", m),
    error: (m: string) => log("error", m),
  };
};

export type Logger = ReturnType<typeof createLogger>;
