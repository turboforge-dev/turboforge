import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execAsync, execFileAsync, type Logger } from "@turbo-forge/cli-kit";
import {
  type InbuiltMergeStrategies,
  resolveConflicts,
} from "git-json-resolver";

export const cleanCheck = () =>
  Promise.all([
    execAsync("git diff --quiet"),
    execAsync("git diff --cached --quiet"),
  ]);

export const checkFileExists = async (path: string) => {
  try {
    await access(resolve(process.cwd(), path));
    return true;
  } catch {
    return false;
  }
};

// Helper functions for sanitization
export const sanitizeGitRef = (ref: string) => ref.replace(/[^a-zA-Z0-9]/g, "");

export const sanitizeRemoteName = (name: string) => {
  // Only allow alphanumeric, underscore, hyphen, *not* starting with dash
  const cleaned = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "");
  // Must start with alphanumeric or underscore
  if (!cleaned || !/^[a-zA-Z0-9_]/.test(cleaned) || cleaned.startsWith("-")) {
    throw new Error(
      `Invalid remote name: "${name}". Remote names may only contain letters, numbers, underscore, and hyphen, and cannot start with '-'.`,
    );
  }
  return cleaned;
};

export const sanitizeLogInput = (input: string) => input.replace(/[\r\n]/g, "");

/**
 * Create and apply patch
 */
export const createAndApplyPatch = async (
  {
    remoteName,
    baseRef,
    targetRef,
    exclusions,
    logger,
    maxRetries = 3,
    errorLogs = [],
  }: {
    baseRef: string;
    targetRef: string;
    exclusions: string[];
    logger: Logger;
    remoteName: string;
    maxRetries: number;
    errorLogs: unknown[];
  },
  patchRecurseCount = 0,
) => {
  if (patchRecurseCount > maxRetries) {
    logger.warn(`Max patch recursion reached (${maxRetries}), stopping`);
    return;
  }

  const diffCmd = `git diff ${baseRef} ${remoteName}/main -- ${exclusions.join(
    " ",
  )} .`;
  logger.debug(`Running: ${diffCmd}`);
  const { stdout: patch } = await execFileAsync(
    "git",
    ["diff", baseRef, `${remoteName}/${targetRef}`, "--", ...exclusions, "."],
    { encoding: "utf8" },
  );
  await writeFile(".template.patch", patch);
  logger.debug(`Patch written to .template.patch (${patch.length} chars)`);

  // 8. Apply patch
  try {
    logger.debug("Applying patch with 3-way merge");
    await execAsync(
      "git apply --3way --ignore-space-change --ignore-whitespace .template.patch",
      { encoding: "utf8" },
    );
    logger.debug("Patch applied successfully");
    // biome-ignore lint/suspicious/noExplicitAny: Error as any
  } catch (err: any) {
    const errorLines: string[] = err.stderr
      ?.split("\n")
      .filter((line: string) => line.startsWith("error"));
    logger.debug(`Patch failed with ${errorLines.length} errors`);
    errorLines.forEach((line: string) => {
      const filePath = line.split(":")[1]?.trim();
      if (filePath) {
        exclusions.push(`:!${filePath}`);
        logger.debug(`Added to exclusions: ${sanitizeLogInput(filePath)}`);
      }
    });
    errorLogs.push("Applied patch with errors: ");
    errorLogs.push({ errorLines, exclusions });
    errorLogs.push("^^^---Applied patch with errors");
    if (errorLines.length)
      await createAndApplyPatch(
        {
          remoteName,
          baseRef,
          targetRef,
          exclusions,
          logger,
          maxRetries,
          errorLogs,
        },
        patchRecurseCount + 1,
      );
  }
};

/* v8 ignore start */
export const resolvePackageJSONConflicts = async (debug: boolean) => {
  await resolveConflicts<InbuiltMergeStrategies | "ignore-removed">({
    include: ["package.json"],
    defaultStrategy: ["merge", "theirs"],
    rules: {
      name: ["ours"],
      "devDependencies.*": ["ignore-removed", "theirs"],
      "dependencies.*": ["ignore-removed", "theirs"],
    },
    debug,
  });

  await resolveConflicts({
    include: ["**/package.json"],
    exclude: ["package.json", "**/dist/**", "**/.next/**"],
    defaultStrategy: ["merge", "non-empty", "ours"],
    rules: {
      "devDependencies.*": ["semver-max"],
      "dependencies.*": ["semver-max"],
    },
    loggerConfig: {
      logDir: ".logs2",
      levels: { stdout: [] },
    },
    plugins: ["git-json-resolver-semver"],
    pluginConfig: {
      "git-json-resolver-semver": {
        preferValid: true,
      },
    },
    includeNonConflicted: true,
    debug,
  });
};
/* v8 ignore stop */

export const getBaseCommit = async (metaFile: string) => {
  // 1. If already tracked, prefer that
  try {
    const content = await readFile(metaFile, "utf8");
    return JSON.parse(content).lastSyncedCommit;
  } catch {}

  // 2. Get first commit date and template commits in parallel
  const [{ stdout: firstCommitDate }, { stdout: templateLog }] =
    await Promise.all([
      execAsync("git log --reverse --format=%ai | head -n 1", {
        encoding: "utf8",
      }),
      execAsync("git log --format=%H::%ai template/main", { encoding: "utf8" }),
    ]);

  const firstDate = new Date(firstCommitDate.trim());

  // 3. Parse template commits
  const templateCommits = templateLog
    .trim()
    .split("\n")
    .map((line) => {
      const [hash, dateStr] = line.split("::");
      return { hash, date: new Date(dateStr?.trim()) };
    })
    .reverse();

  // 4. Find latest commit before or equal to firstDate
  const baseCommit = templateCommits.find((c) => c.date >= firstDate);

  if (baseCommit) {
    console.info(
      "Applying changes from ",
      baseCommit.hash,
      " dated ",
      baseCommit.date,
    );
    return baseCommit.hash;
  }
};
