# @turboforge/remark-typedoc-mdx

Turn raw TypeDoc markdown into MDX that reads like product docs instead of generator output.

<p className="flex gap-2">
  <a href="https://github.com/turboforge-dev/turboforge/actions/workflows/ci.yml" rel="noopener noreferrer">
    <img alt="CI" src="https://github.com/turboforge-dev/turboforge/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://codecov.io/gh/turboforge-dev/turboforge/tree/main/packages/@turboforge/remark-typedoc-mdx" rel="noopener noreferrer">
    <img alt="codecov" src="https://codecov.io/gh/turboforge-dev/turboforge/graph/badge.svg?flag=@turboforge/remark-typedoc-mdx" />
  </a>
  <a href="https://npmjs.com/package/@turboforge/remark-typedoc-mdx" rel="noopener noreferrer">
    <img alt="npm version" src="https://img.shields.io/npm/v/@turboforge/remark-typedoc-mdx" />
  </a>
  <a href="https://npmjs.com/package/@turboforge/remark-typedoc-mdx" rel="noopener noreferrer">
    <img alt="npm downloads" src="https://img.shields.io/npm/d18m/@turboforge/remark-typedoc-mdx" />
  </a>
  <a href="https://npmjs.com/package/@turboforge/remark-typedoc-mdx" rel="noopener noreferrer">
    <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/@turboforge/remark-typedoc-mdx" />
  </a>
  <img alt="license" src="https://img.shields.io/npm/l/@turboforge/remark-typedoc-mdx" />
</p>

TypeDoc is good at extracting API information. It is not especially good at producing documentation pages you want to ship as-is. `@turboforge/remark-typedoc-mdx` cleans that output so API references can live inside the same docs system as the rest of Turboforge.

Part of the Turboforge system:

- use [`@turboforge/cli-kit`](/c:/Users/G/web/open-source/turbo-forge/packages/cli-kit/README.md) to build tooling
- use [`@turboforge/sync`](/c:/Users/G/web/open-source/turbo-forge/packages/forge-sync/README.md) to keep the repo aligned
- use `@turboforge/remark-typedoc-mdx` to make the resulting docs feel like one product surface

## Highlights

- Rewrite TypeDoc markdown into MDX-friendly output.
- Strip generator noise like breadcrumbs and awkward structural artifacts.
- Normalize links and signatures so API docs match the rest of your docs site.

## Why It Exists

Generated API docs often break the tone of a docs site:

- awkward breadcrumbs
- markdown links that do not fit MDX routing
- signatures that read like export noise
- sections that feel machine-dumped instead of edited

This package fixes the common TypeDoc-to-MDX cleanup work so you do not have to hand-edit generated files.

## Real Example

You generate API docs for a package and want them to live in a Fumadocs or MDX-based site next to hand-written guides.

Instead of publishing raw TypeDoc markdown and accepting the mismatch, run it through this plugin so links, signatures, and structural noise are normalized before the files reach your docs app.

## When To Use It

- Your docs site is MDX-based.
- You generate markdown from TypeDoc and want cleaner output.
- You care that API docs match the rest of your docs experience.

## When Not To Use It

- You are happy with raw TypeDoc HTML output.
- You do not use MDX or a markdown processing pipeline.
- Your docs workflow does not involve TypeDoc-generated markdown.

## Installation

```bash
pnpm add @turboforge/remark-typedoc-mdx
```

**_or_**

```bash
$ npm install @turboforge/remark-typedoc-mdx
```

**_or_**

```bash
$ yarn add @turboforge/remark-typedoc-mdx
```

## Example

```ts
import { remarkTypedocMdx } from "@turboforge/remark-typedoc-mdx";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

const result = await unified()
  .use(remarkParse)
  .use(remarkTypedocMdx, {
    removeTitle: true,
    removeBreadcrumbs: true,
    normalizeSignatures: true,
    rewriteLinks: true,
  })
  .use(remarkStringify)
  .process(typedocMarkdown);
```

## Ecosystem Fit

Turboforge is not just about repo mechanics. It is also about making tooling outputs feel intentional.

This package is the docs-facing piece of that story.
