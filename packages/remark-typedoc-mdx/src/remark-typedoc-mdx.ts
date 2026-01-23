import type { Blockquote, Heading, Link, Paragraph, Parent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { convertToTable } from "./table-utils";
import { extractText } from "./utils";

export interface RemarkTypedocMdxOptions {
  removeTitle?: boolean;
  removeBreadcrumbs?: boolean;
  normalizeSignatures?: boolean;
  rewriteLinks?: boolean;
  /** @alpha */
  parametersAsTable?: boolean;
}

// type ModuleType =
//   | ""
//   | "class"
//   | "function"
//   | "interface"
//   | "type"
//   | "type alias"
//   | "variable";

export const remarkTypedocMdx: Plugin<[RemarkTypedocMdxOptions?]> = (
  options = {},
) => {
  const {
    removeTitle = true,
    removeBreadcrumbs = true,
    normalizeSignatures = true,
    rewriteLinks = true,
    parametersAsTable = true,
  } = options;
  return (tree) => {
    // let moduleType = "" as ModuleType;
    visit(tree, (node, index, parent: Parent) => {
      if (!parent || index === undefined) return;
      switch (node.type) {
        case "heading":
          if ((node as Heading).depth === 1) {
            // moduleType = extractText(node as Heading)
            //   .split(":")[0]
            //   .toLowerCase()
            //   .trim() as ModuleType;
            if (removeTitle) {
              parent.children.splice(index, 1);
              return index;
            }
          } else if ((node as Heading).depth === 2 && parametersAsTable) {
            convertToTable(node as Heading, index, parent);
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
