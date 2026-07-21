import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import * as LucideIcons from "lucide-react";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { DEFAULT_PKG_DIR, source } from "@/lib/source";

const sourceTree = source.getPageTree();

const getRootToggleOptions = () => {
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

  return dirs.map((dir) => {
    const metaPath = path.join(docsDir, dir, "meta.json");
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    const title = meta.title || dir;
    const description = meta.description || meta.tagLine || "";
    const isDefault = dir === DEFAULT_PKG_DIR;
    const url = isDefault ? "/docs" : `/docs/${dir}`;

    const IconComponent =
      (LucideIcons[
        meta.icon as keyof typeof LucideIcons
      ] as LucideIcons.LucideIcon) ?? LucideIcons.LibraryBig;

    return {
      title,
      description,
      url,
      icon: <IconComponent className="size-4" />,
    };
  });
};

const Layout = ({ children }: { children: ReactNode }) => {
  const toggleOptions = getRootToggleOptions();

  return (
    <RootProvider search={{ options: { type: "static" } }}>
      <DocsLayout tree={sourceTree} {...baseOptions()} tabs={toggleOptions}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
};

export default Layout;
