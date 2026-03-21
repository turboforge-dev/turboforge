import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

const sourceTree = source.getPageTree();

const Layout = ({ children }: { children: ReactNode }) => (
  <RootProvider search={{ options: { type: "static" } }}>
    <DocsLayout tree={sourceTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  </RootProvider>
);

export default Layout;
