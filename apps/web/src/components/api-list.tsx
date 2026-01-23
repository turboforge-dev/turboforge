import { Card, Cards } from "fumadocs-ui/components/card";
import { Folder } from "lucide-react";
import { source } from "@/lib/source";

export function ApiList() {
  const pages = source
    .getPages()
    .filter((page) => page.url.startsWith("/docs/api/"));
  const packages = new Set<string>();

  for (const page of pages) {
    const parts = page.url.split("/");
    // url is like /docs/api/package-name/version/...
    // parts[0] = ""
    // parts[1] = "docs"
    // parts[2] = "api"
    // parts[3] = package name
    if (parts[3]) {
      packages.add(parts[3]);
    }
  }

  return (
    <Cards>
      {Array.from(packages)
        .sort()
        .map((pkg) => (
          <Card
            key={pkg}
            title={pkg}
            href={`/docs/api/${pkg}`}
            icon={<Folder />}
            description={`Documentation for ${pkg}`}
          />
        ))}
    </Cards>
  );
}
