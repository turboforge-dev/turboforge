import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { VersionSelect } from "@/components/VersionSelect";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Compute package versions map
  const pages = source.getPages();
  const versions: Record<string, Set<string>> = {};

  for (const page of pages) {
    if (page.url.startsWith("/docs/api/")) {
      // /docs/api/[pkg]/[ver]/...
      const parts = page.url.split("/");
      const pkg = parts[3];
      const ver = parts[4];
      if (pkg && ver && ver.startsWith("v")) {
        if (!versions[pkg]) versions[pkg] = new Set();
        versions[pkg].add(ver);
      }
    }
  }

  const versionsMap: Record<string, string[]> = {};
  Object.entries(versions).forEach(([pkg, set]) => {
    versionsMap[pkg] = Array.from(set);
  });

  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{
        banner: <VersionSelect versions={versionsMap} />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
