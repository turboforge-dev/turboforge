import { existsSync, readFileSync } from "node:fs";
import { sep } from "node:path";
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";
import { remarkTypedocMdx } from "remark-typedoc-mdx";
import { z } from "zod";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: (ctx) => {
      const { path } = ctx;
      const normalizedPath = path.replaceAll("\\", "/");

      return z
        .object({})
        .loose()
        .transform((data) => {
          const jsonPath = (
            normalizedPath.includes("/api/")
              ? path.replace(/[\\/]api[\\/]/, `${sep}api${sep}.meta${sep}`)
              : path
          ).replace(/\.mdx?$/, ".json");

          if (existsSync(jsonPath)) {
            const content = readFileSync(jsonPath, "utf-8");
            const metadata = JSON.parse(content);

            return {
              ...data,
              ...metadata,
            };
          }

          return data;
        })
        .pipe(
          frontmatterSchema.extend({
            editURL: z.string().optional(),
            commitHash: z.string().optional(),
            lastModified: z.iso.date().optional().or(z.string().optional()),
          }),
        );
    },
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [[remarkTypedocMdx, { normalizeSignatures: false }]],
  },
});
