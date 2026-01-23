import type { Literal, Node } from "mdast";
import { visit } from "unist-util-visit";

export const extractText = (tree: Node) => {
  let out = "";
  visit(tree, ["text", "inlineCode"], (node) => {
    out += (node as Literal).value;
  });
  return out;
};
