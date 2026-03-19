import { getLLMText, source } from "@/lib/source";

export const dynamic = "force-static";

export async function GET() {
  const texts = await Promise.all(source.getPages().map(getLLMText));

  return new Response(texts.join("\n\n"), {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
