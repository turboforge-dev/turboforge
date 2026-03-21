import { docs } from "fumadocs-mdx:collections/server";
import { readdir } from "node:fs/promises";
import { createLimiter } from "@turboforge/cli-kit";
import { type InferPageType, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { defaultPkgDir } from "@/meta.json";

const limiter = createLimiter(10);

export const PKG_MAX_VERSION = await readdir("content/docs")
  .then((dirs) =>
    Promise.all(
      dirs.toSorted().map((dir) =>
        limiter(async () => {
          const version = await readdir(`content/docs/${dir}`).then((vDirs) =>
            vDirs
              .filter((vDir) => /^v\d+$/.test(vDir))
              .toSorted(
                (a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10),
              )
              .pop(),
          );
          return { dir, version };
        }),
      ),
    ),
  )
  .catch((err) => {
    console.error(err);
    return [];
  });

export const DEFAULT_PKG_DIR = defaultPkgDir || PKG_MAX_VERSION[0]?.dir;

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
  slugs: (file) => {
    const segments = file.path
      .replace(/\.mdx?$/g, "")
      .split(/[\\/]/)
      .filter((seg) => seg !== "index" && !/^\(.*\)$/.test(seg));

    if (
      segments[1] ===
      PKG_MAX_VERSION.find(({ dir }) => dir === segments[0])?.version
    ) {
      segments.splice(1, 1);
    }

    return segments[0] === DEFAULT_PKG_DIR ? segments.slice(1) : segments;
  },
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${processed}`;
}
