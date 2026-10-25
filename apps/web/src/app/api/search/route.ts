import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

export const dynamic = "force-static"; // Required by Next.js static export for custom API routes

// Filter out older versioned directories (e.g., v1, v2) so only the latest documentation is indexed
const searchSource = {
  ...source,
  getPages: (locale?: string) =>
    source.getPages(locale).filter((page) => {
      return !page.slugs.some((slug) => /^v\d+$/.test(slug));
    }),
};

export const { staticGET: GET } = createFromSource(searchSource, {
  language: "english",
  buildIndex: async (page) => {
    const data = page.data as {
      title: string;
      description?: string;
      structuredData?: {
        headings: { id: string; content: string }[];
        contents: { heading?: string; content: string }[];
      };
      load?: () => Promise<{
        structuredData: {
          headings: { id: string; content: string }[];
          contents: { heading?: string; content: string }[];
        };
      }>;
    };

    const loadedData = data.load ? await data.load() : undefined;
    const structuredData = (loadedData?.structuredData ??
      data.structuredData ?? { headings: [], contents: [] }) as {
      headings: { id: string; content: string }[];
      contents: {
        heading: string | undefined;
        content: string;
        table?: string;
      }[];
    };

    return {
      title: data.title,
      description: data.description,
      url: page.url,
      id: page.url,
      structuredData: {
        headings: structuredData.headings,
        contents: structuredData.contents
          .filter(
            (c) =>
              !c.content.trimStart().startsWith("```") &&
              c.content.length < 600,
          )
          .map((c) => ({
            heading: c.heading,
            content: c.content.slice(0, 300),
            table: c.table,
          })),
      },
    };
  },
});
