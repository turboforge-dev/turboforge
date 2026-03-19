/** biome-ignore-all lint/suspicious/noExplicitAny: ok for test files */
import type { Blockquote, Link, Paragraph, Root, Table } from "mdast";
import { describe, expect, it } from "vitest";
import { remarkTypedocMdx } from "./remark-typedoc-mdx";
import { extractText } from "./utils";

describe("remarkTypedocMdx", () => {
  it("should remove title when removeTitle is true", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 1,
          children: [{ type: "text", value: "Title" }],
        },
        { type: "paragraph", children: [{ type: "text", value: "Content" }] },
      ],
    };

    // @ts-expect-error -- testing simplification
    const transform = remarkTypedocMdx({ removeTitle: true });
    (transform as any)(tree);

    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].type).toBe("paragraph");
  });

  it("should remove breadcrumbs when removeBreadcrumbs is true", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "link",
              url: "../index.md",
              children: [{ type: "text", value: "Index" }],
            },
          ],
        },
        { type: "thematicBreak" },
        { type: "paragraph", children: [{ type: "text", value: "Content" }] },
      ],
    };

    // @ts-expect-error -- testing simplification
    const transform = remarkTypedocMdx({ removeBreadcrumbs: true });
    (transform as any)(tree);

    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].type).toBe("paragraph");
    const paragraph = tree.children[0] as Paragraph;
    expect(extractText(paragraph)).toBe("Content");
  });

  it("should normalize signatures", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "blockquote",
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: "const x: number = 1;" }],
            },
          ],
        },
      ],
    };

    // @ts-expect-error -- testing simplification
    const transform = remarkTypedocMdx({ normalizeSignatures: true });
    (transform as any)(tree);

    expect(tree.children[0].type).toBe("blockquote");
    const blockquote = tree.children[0] as Blockquote;
    const paragraph = blockquote.children[0] as Paragraph;
    expect(paragraph.children[0].type).toBe("inlineCode");
    expect(extractText(paragraph)).toBe("const x: number = 1;");
  });

  it("should rewrite links from .md to .mdx", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "link",
              url: "other.md",
              children: [{ type: "text", value: "Other" }],
            },
            {
              type: "link",
              url: "https://google.com",
              children: [{ type: "text", value: "External" }],
            },
          ],
        },
      ],
    };

    // @ts-expect-error -- testing simplification
    const transform = remarkTypedocMdx({ rewriteLinks: true });
    (transform as any)(tree);

    const paragraph = tree.children[0] as Paragraph;
    expect((paragraph.children[0] as Link).url).toBe("other.mdx");
    expect((paragraph.children[1] as Link).url).toBe("https://google.com");
  });

  it("should convert Parameters section with nested H4s to table", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 2,
          children: [{ type: "text", value: "Parameters" }],
        },
        {
          type: "heading",
          depth: 3,
          children: [{ type: "text", value: "config" }],
        },
        {
          type: "heading",
          depth: 4,
          children: [{ type: "text", value: "name" }],
        },
        { type: "paragraph", children: [{ type: "text", value: "string" }] },
        {
          type: "paragraph",
          children: [{ type: "text", value: "The name of the user" }],
        },
        {
          type: "heading",
          depth: 2,
          children: [{ type: "text", value: "Next Section" }],
        },
      ],
    };

    // @ts-expect-error -- testing simplification
    const transform = remarkTypedocMdx({ parametersAsTable: true });
    (transform as any)(tree);

    // [H2 Parameters, H3 config, Table, H2 Next Section]
    expect(tree.children[0].type).toBe("heading");
    expect(tree.children[1].type).toBe("heading");
    expect(tree.children[2].type).toBe("table");
    const table = tree.children[2] as Table;
    expect(table.children).toHaveLength(2); // Header + 1 row

    // Check row data
    const row = table.children[1];
    expect(extractText(row.children[0])).toBe("name");
    expect(extractText(row.children[1])).toBe("string");
    expect(extractText(row.children[2])).toBe("The name of the user ");
  });

  it("should convert Returns section with nested H5s to table", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 2,
          children: [{ type: "text", value: "Returns" }],
        },
        {
          type: "heading",
          depth: 3,
          children: [{ type: "text", value: "method()" }],
        },
        {
          type: "heading",
          depth: 4,
          children: [{ type: "text", value: "Parameters" }],
        },
        {
          type: "heading",
          depth: 5,
          children: [{ type: "text", value: "id" }],
        },
        { type: "paragraph", children: [{ type: "text", value: "number" }] },
        {
          type: "paragraph",
          children: [{ type: "text", value: "The user ID" }],
        },
      ],
    };

    // @ts-expect-error -- testing simplification
    const transform = remarkTypedocMdx({ parametersAsTable: true });
    (transform as any)(tree);

    // [H2 Returns, H3 method, H4 Parameters, Table]
    expect(tree.children[3].type).toBe("table");
  });
});
