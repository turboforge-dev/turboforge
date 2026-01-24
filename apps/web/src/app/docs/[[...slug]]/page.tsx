import { Callout } from "fumadocs-ui/components/callout";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions";
import { getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

const GIT_CONFIG = {
  user: "react18-tools",
  repo: "turbo-forge",
  branch: "main",
};

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const lastSegment = params.slug?.pop() ?? "";

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          // update it to match your repo
          githubUrl={
            page.data.editURL ||
            `https://github.com/${GIT_CONFIG.user}/${GIT_CONFIG.repo}/blob/${GIT_CONFIG.branch}/docs/content/docs/${page.path}`
          }
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: ({ href, ...props }) => {
              if (href.startsWith("http")) {
                return (
                  <a
                    {...props}
                    href={href.replace(
                      "/blob/main/",
                      `/blob/${page.data.commitHash ?? GIT_CONFIG.branch}/`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                );
              }
              const cleanedHref = href
                .replace(/index\.mdx?/, "")
                .replace(/\.mdx?$/, "");
              return (
                <Link
                  {...props}
                  href={
                    /^(\/|\.)/.test(cleanedHref) ||
                    cleanedHref.startsWith(lastSegment)
                      ? cleanedHref
                      : `${lastSegment}/${cleanedHref}`
                  }
                />
              );
            },
            // biome-ignore lint/complexity/noUselessFragments: Required to suppress default icon
            blockquote: (props) => <Callout {...props} icon={<></>} />,
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
