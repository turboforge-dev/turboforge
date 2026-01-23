import { writeFile } from "node:fs/promises";
import {
  createLogger,
  deepMerge,
  execAsync,
  execFileAsync,
  type LogLevel,
} from "@turbo-forge/cli-kit";
import {
  cleanCheck,
  createAndApplyPatch,
  resolvePackageJSONConflicts,
  sanitizeGitRef,
  sanitizeLogInput,
  sanitizeRemoteName,
} from "./utils";

export interface ForgeSyncOptions {
  logLevel?: LogLevel;
  /** Show what would be changed without applying */
  dryRun?: boolean;
  /** Custom template repository URL */
  templateUrl?: string;
  /** Additional paths to exclude from upgrade */
  excludePaths?: string[];
  /** Commands to run after upgrade */
  postSync?: string[];
  /** Remote name for template @default "template" */
  remoteName?: string;
  /** Maximum patch recursion attempts */
  maxPatchRetries?: number;
  /** Custom backup directory */
  backupDir?: string;
  /** Skip git tree clean check */
  skipCleanCheck?: boolean;
  /** Specific commit hash, tag, or branch @default "main" */
  targetRef?: string;
  /** Meta file to store template commit hash, etc. */
  metaFile?: string;
  /** Base commit hash, tag, or branch @default "main" */
  baseRef: string;
}

export const DEFAULT_CONFIG: Required<ForgeSyncOptions> = {
  logLevel: "info",
  dryRun: false,
  templateUrl: "https://github.com/turbo-forge/forge-template.git",
  excludePaths: [],
  remoteName: "template",
  maxPatchRetries: 3,
  backupDir: ".forge-backup",
  skipCleanCheck: false,
  targetRef: "main",
  metaFile: ".forge-meta.json",
  baseRef: "",
  postSync: [
    "pnpm install",
    "pnpm biome check --write --no-errors-on-unmatched $(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(ts|tsx|js|json)$' || true)",
  ],
};

const errorLogs: unknown[] = [];
export const forgeSync = async (options: ForgeSyncOptions) => {
  const {
    logLevel,
    skipCleanCheck,
    dryRun,
    remoteName,
    templateUrl,
    backupDir,
    baseRef,
    excludePaths,
    targetRef,
    metaFile,
    postSync,
    maxPatchRetries,
  } = deepMerge(DEFAULT_CONFIG, options) as Required<ForgeSyncOptions>;
  const logger = createLogger({ level: logLevel });

  if (!baseRef) {
    logger.error("❌ Error: Base ref is required");
    return;
  }

  if (!skipCleanCheck) {
    try {
      await cleanCheck();
      logger.info("Git tree is clean");
    } catch {
      logger.error(
        "❌ Error: Please commit or stash your changes before upgrading.",
      );
      return;
    }
  } else {
    logger.info("Skipping git clean check");
  }

  if (dryRun) {
    logger.info("Dry run mode - no changes will be applied");
  }

  // Sanitize inputs to prevent command injection
  const sanitizedRemoteName = sanitizeRemoteName(remoteName);

  // Ensure template remote exists
  try {
    await Promise.all([
      execFileAsync("git", ["remote", "add", sanitizedRemoteName, templateUrl]),
      execAsync(`rm -rf ${backupDir}`),
    ]);
  } catch {
    logger.debug(
      `${sanitizeLogInput(sanitizedRemoteName)} remote already exists`,
    );
  } finally {
    logger.debug(
      `Added ${sanitizeLogInput(sanitizedRemoteName)} remote: ${sanitizeLogInput(templateUrl)}`,
    );
  }

  try {
    await execFileAsync("git", ["fetch", sanitizedRemoteName]);
    logger.debug(
      `Fetched latest changes from ${sanitizeLogInput(sanitizedRemoteName)}`,
    );

    const sanitizedBaseRef = sanitizeGitRef(baseRef);
    const sanitizedTargetRef = sanitizeGitRef(targetRef);

    // Build exclusion list
    const exclusions = [...excludePaths].map((entry) => `:!${entry}`);
    logger.debug(`Base exclusions: ${exclusions.length} items`);

    // Generate patch
    logger.debug(
      `Generating patch from ${sanitizedBaseRef} to ${sanitizedTargetRef}`,
    );
    logger.debug(`Total exclusions: ${exclusions.length}`);

    if (dryRun) {
      const { stdout: patch } = await execFileAsync(
        "git",
        [
          "diff",
          sanitizedBaseRef,
          `${sanitizedRemoteName}/${sanitizedTargetRef}`,
          "--",
          ...exclusions,
          ".",
        ],
        { encoding: "utf8" },
      );
      logger.info("📋 Patch preview:");
      logger.info(patch || "No changes to apply");
      return;
    }

    await createAndApplyPatch({
      remoteName: sanitizedRemoteName,
      baseRef: sanitizedBaseRef,
      targetRef: sanitizedTargetRef,
      exclusions,
      logger,
      maxRetries: maxPatchRetries,
      errorLogs,
    });

    const { stdout: templateLatestCommit } = await execFileAsync(
      "git",
      ["rev-parse", `${sanitizedRemoteName}/${sanitizedTargetRef}`],
      { encoding: "utf8" },
    );

    await writeFile(
      metaFile,
      JSON.stringify(
        {
          lastSyncedCommit: templateLatestCommit.trim(),
          baseRef: sanitizedBaseRef,
          targetRef: sanitizedTargetRef,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    await resolvePackageJSONConflicts(logLevel === "debug");

    console.log("✅ Upgrade applied successfully.");

    if (!dryRun) {
      logger.info("Running post-sync commands...");
      logger.info(postSync.join("\n"));
      await Promise.all(postSync.map((cmd) => execAsync(cmd)));
    }
  } catch (err) {
    console.error("❌ Upgrade failed:", err);
  }

  // Remove template from remote
  try {
    await execFileAsync("git", ["remote", "remove", sanitizedRemoteName]);
  } catch {}
};
