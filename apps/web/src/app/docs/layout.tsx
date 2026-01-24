import type { Folder } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

const cleanUpSourceTree = (node: Folder) => {
  if (
    node.children[0]?.type === "folder" &&
    /^v\d+$/i.test(String(node.children[0]?.name))
  ) {
    node.children.sort((a, b) => {
      const aNum = Number(
        a.$id
          ?.split(/\/\(?v/)
          .pop()
          ?.replace(/\)$/, "") ?? 0,
      );
      const bNum = Number(
        b.$id
          ?.split(/\/\(?v/)
          .pop()
          ?.replace(/\)$/, "") ?? 0,
      );
      return bNum - aNum;
    });
    const defaultVersionInd = node.children.findIndex((child) =>
      /\/\(v\d+\)$/i.test(child.$id ?? ""),
    );
    if (defaultVersionInd !== -1) {
      const defaultVersion = node.children.splice(defaultVersionInd, 1)[0];
      node.children.unshift(...(defaultVersion as Folder).children);
    }
  } else {
    node.children.forEach((child) => {
      if (child.type === "folder") {
        cleanUpSourceTree(child as Folder);
      }
    });
  }
};

const sourceTree = source.getPageTree();
cleanUpSourceTree(sourceTree as Folder);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout tree={sourceTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
