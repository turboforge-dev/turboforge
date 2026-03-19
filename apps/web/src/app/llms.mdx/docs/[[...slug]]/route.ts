import { notFound } from "next/navigation";
import { getLLMText, source } from "@/lib/source";

export const dynamic = "force-static";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;

  const lastParam = slug?.[slug.length - 1];
  let fetchSlug = slug;
  if (lastParam?.endsWith(".mdx")) {
    fetchSlug = [...(slug || [])];
    fetchSlug[fetchSlug.length - 1] = lastParam.replace(/\.mdx$/, "");
  }

  const page = source.getPage(fetchSlug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown",
    },
  });
}

export function generateStaticParams() {
  const params = source.generateParams();
  return params.map((p) => {
    if (!p.slug?.length) return p;
    const newSlug = [...p.slug];
    newSlug[newSlug.length - 1] = `${newSlug[newSlug.length - 1]}.mdx`;
    return { ...p, slug: newSlug };
  });
}
