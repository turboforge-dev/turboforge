import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { DEFAULT_PKG_DIR, source } from "@/lib/source";

const sourceTree = source.getPageTree();

const toKebabCase = (str: string) =>
  str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/^-/, "");

const getRootToggleOptions = async () => {
  const docsDir = path.resolve("content/docs");
  if (!existsSync(docsDir)) return [];

  const dirs = readdirSync(docsDir).filter((f) => {
    try {
      const fullPath = path.join(docsDir, f);
      return (
        statSync(fullPath).isDirectory() &&
        existsSync(path.join(fullPath, "meta.json"))
      );
    } catch {
      return false;
    }
  });

  return Promise.all(
    dirs.map(async (dir) => {
      const metaPath = path.join(docsDir, dir, "meta.json");
      const meta = JSON.parse(readFileSync(metaPath, "utf8"));
      const title = meta.title || dir;
      const description = meta.description || meta.tagLine || "";
      const isDefault = dir === DEFAULT_PKG_DIR;
      const url = isDefault ? "/docs" : `/docs/${dir}`;

      const iconKey = (
        meta.icon ? toKebabCase(meta.icon) : "library-big"
      ) as keyof typeof dynamicIconImports;
      const loadIcon =
        dynamicIconImports[iconKey] ?? dynamicIconImports["library-big"];
      const { default: IconComponent } = await loadIcon();

      return {
        title,
        description,
        url,
        icon: <IconComponent className="size-4" />,
      };
    }),
  );
};

const Layout = async ({ children }: { children: ReactNode }) => {
  const toggleOptions = await getRootToggleOptions();

  return (
    <RootProvider search={{ options: { type: "static" } }}>
      <DocsLayout tree={sourceTree} {...baseOptions()} tabs={toggleOptions}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
};

export default Layout;
