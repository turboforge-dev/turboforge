# @turboforge/remark-typedoc-mdx

> Transform TypeDoc generated markdown into clean, production-ready MDX.

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

## ✨ Features

- **MDX Optimization**: Automatically rewrites `.md` links to `.mdx` for modern documentation frameworks.
- **Breadcrumb Cleaning**: Removes redundant TypeDoc breadcrumbs and thematic breaks.
- **Signature Normalization**: Converts complex TypeDoc blockquotes into clean, readable inline code signatures.
- **Table Conversion**: Transforms parameter lists into structured tables for better readability (Alpha).
- **Highly Configurable**: Easily toggle title removal, breadcrumb stripping, and link rewriting.

## 📦 Installation

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

## 🚀 Usage

Integrate with `unified`, `remark`, or `next-mdx-remote` to process TypeDoc output.

```ts
import { remarkTypedocMdx } from "@turboforge/remark-typedoc-mdx";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkTypedocMdx, {
    removeTitle: true,
    removeBreadcrumbs: true,
    normalizeSignatures: true,
    rewriteLinks: true
  })
  .use(remarkStringify);

const result = await processor.process(typedocMarkdownContent);
console.log(String(result));
```

## 🧠 API

### `remarkTypedocMdx(options?)`

#### Options

- `removeTitle` (boolean, default: `true`): Remove the top-level H1 title.
- `removeBreadcrumbs` (boolean, default: `true`): Remove TypeDoc navigation breadcrumbs and separators.
- `normalizeSignatures` (boolean, default: `true`): Wrap function/type signatures in inline code blocks.
- `rewriteLinks` (boolean, default: `true`): Convert local `.md` links to `.mdx`.
- `parametersAsTable` (boolean, default: `true`): Convert parameter lists into tables.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/turboforge-dev/turboforge/blob/main/CONTRIBUTING.md) for more details.

## 📄 License

MIT © [Mayank Kumar Chaudhari](https://mayankchaudhari.com)

