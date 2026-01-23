#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  findProjectRoot,
  type LogLevel,
  resolveConfig,
} from "@turbo-forge/cli-kit";
import { DEFAULT_CONFIG, type ForgeSyncOptions, forgeSync } from "./forge-sync";
import { getBaseCommit } from "./utils";

interface CliOptions extends ForgeSyncOptions {
  help?: boolean;
  init?: boolean;
  config?: string;
}

export const parseArgs = (args: string[]): Partial<CliOptions> => {
  const options: Partial<CliOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--log-level":
      case "-l":
        options.logLevel = args[++i] as LogLevel;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--template-url":
        options.templateUrl = args[++i];
        break;
      case "--exclude":
        options.excludePaths = args[++i]?.split(",") || [];
        break;
      case "--post-sync":
        options.postSync = args[++i]?.split(",") || [];
        break;
      case "--remote-name":
        options.remoteName = args[++i];
        break;
      case "--max-retries":
        options.maxPatchRetries = parseInt(args[++i], 10) || 3;
        break;
      case "--skip-clean-check":
        options.skipCleanCheck = true;
        break;
      case "--base-ref":
        options.baseRef = args[++i];
        break;
      case "--target-ref":
        options.targetRef = args[++i];
        break;
      case "--meta-file":
        options.metaFile = args[++i];
        break;
      case "--backup-dir":
        options.backupDir = args[++i];
        break;
      case "--init":
      case "-i":
        options.init = true;
        // Check if next arg is a filename (not starting with --)
        if (args[i + 1] && !args[i + 1].startsWith("--")) {
          options.config = args[++i];
        }
        break;
      case "--config":
      case "-c":
        options.config = args[++i];
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  }

  return options;
};

export const showHelp = () => {
  console.log(`
Usage: forge-sync [options]

Options:
  -l, --log-level <level> Debug logging level - debug | info | warn | error  (default: info)
  --dry-run               Show what would be changed without applying
  --template-url <url>    Custom template repository URL
  --exclude <paths>       Comma-separated paths to exclude from upgrade
  --post-sync <cmds>      Comma-separated commands to run after sync
  --remote-name <name>    Custom remote name for template (default: template)
  --max-retries <num>     Maximum patch retry attempts (default: 3)
  --skip-clean-check      Skip git tree clean check
  --base-ref <ref>        Base commit hash, tag, or branch
  --target-ref <ref>      Target commit hash, tag, or branch (default: main)
  --meta-file <file>      Meta file to store template commit hash (default: .forge-meta.json)
  --backup-dir <dir>      Backup directory for patches (default: .forge-backup)
  -i, --init [file]       Create default config file (optionally specify filename)
  -c, --config <file>     Use custom config file
  -h, --help              Show this help message

Configuration:
  Create .forge-sync.config.json in your repo root for persistent settings.

Examples:
  forge-sync --dry-run
  forge-sync --exclude "docs,examples" --post-sync "pnpm install"
  forge-sync --template-url https://github.com/custom/template
  forge-sync --init
  forge-sync --config .forge-sync.prod.json
`);
};

export const main = async (args: string[] = process.argv.slice(2)) => {
  const { help, init, config: configFile, ...cliArgs } = parseArgs(args);

  if (help) {
    showHelp();
    return;
  }

  if (init) {
    await writeFile(
      resolve(findProjectRoot(), configFile || "forge-sync.config.json"),
      JSON.stringify(DEFAULT_CONFIG, null, 2),
    );
    console.log(
      `Created default config file at ${configFile || "forge-sync.config.json"}`,
    );
    return;
  }

  const config = (await resolveConfig<CliOptions>({
    name: "forge-sync",
    cliArgs,
    defaults: DEFAULT_CONFIG,
    configFile,
  })) as Required<CliOptions>;

  config.baseRef = await getBaseCommit(config.metaFile);

  await forgeSync(config);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
