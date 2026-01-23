"use client";

import { usePathname, useRouter } from "next/navigation";
import { useId, useMemo } from "react";

export function VersionSelect({
  versions,
}: {
  versions: Record<string, string[]>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const selectId = useId();

  const { pkg, currentVersion } = useMemo(() => {
    if (!pathname?.startsWith("/docs/api/")) return {};
    const parts = pathname.split("/");
    // ['', 'docs', 'api', 'pkg', 'ver', ...]
    // Example: /docs/api/cli-kit/v0/logger
    return { pkg: parts[3], currentVersion: parts[4] };
  }, [pathname]);

  if (!pkg || !currentVersion || !versions[pkg]) return null;

  const availableVersions = versions[pkg];
  // Sort reverse to show latest first usually, assumes v0, v1, etc.
  // Sort reverse to show latest first usually, assumes v0, v1, etc.
  const sortedVersions = [...availableVersions].sort().reverse();

  return (
    <div className="mb-4 px-2">
      <label
        htmlFor={selectId}
        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block"
      >
        {pkg} Version
      </label>
      <select
        id={selectId}
        aria-label="Select version"
        value={currentVersion}
        onChange={(e) => {
          const newVer = e.target.value;
          const parts = pathname.split("/");
          if (parts[4] === currentVersion) {
            parts[4] = newVer;
            router.push(parts.join("/"));
          }
        }}
        className="w-full bg-secondary/50 border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {sortedVersions.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}
