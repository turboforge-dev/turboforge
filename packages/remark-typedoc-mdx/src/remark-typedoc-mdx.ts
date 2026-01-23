import type { Blockquote, Heading, Link, Paragraph, Parent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { extractText } from "./utils";

export interface RemarkTypedocMdxOptions {
  removeTitle?: boolean;
  removeBreadcrumbs?: boolean;
  normalizeSignatures?: boolean;
  rewriteLinks?: boolean;
  /** @alpha */
  parametersAsTable?: boolean;
}

export const remarkTypedocMdx: Plugin<[RemarkTypedocMdxOptions?]> = (
  options = {},
) => {
  const {
    removeTitle = true,
    removeBreadcrumbs = true,
    normalizeSignatures = true,
    rewriteLinks = true,
  } = options;
  return (tree) => {
    visit(tree, (node, index, parent: Parent) => {
      if (!parent || index === undefined) return;
      switch (node.type) {
        case "heading":
          if (removeTitle && (node as Heading).depth === 1) {
            parent.children.splice(index, 1);
            return index;
          }
          break;
        case "paragraph":
          if (
            removeBreadcrumbs &&
            /\.\.\/index\.mdx?/i.test(
              ((node as Paragraph).children[0] as Link)?.url,
            )
          ) {
            parent.children.splice(index, 1);
            return index;
          }
          break;
        case "thematicBreak":
          if (removeBreadcrumbs) {
            parent.children.splice(index, 1);
            return index;
          }
          break;
        case "blockquote":
          if (normalizeSignatures) {
            (node as Blockquote).children = [
              {
                type: "paragraph",
                children: [
                  {
                    type: "inlineCode",
                    value: extractText(node as Blockquote),
                  },
                ],
              },
            ];
          }
          break;
        case "link":
          if (rewriteLinks && !(node as Link).url?.startsWith("http")) {
            (node as Link).url = (node as Link).url.replace(/\.md$/, ".mdx");
          }
      }
    });
  };
};
