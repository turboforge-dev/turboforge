import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import "./global.css";
import { Inter } from "next/font/google";
import { name } from "@/meta.json";

const inter = Inter({
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://turboforge.dev";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: `%s | ${name}`,
    default: `${name} - Production-grade TypeScript Monorepo Template`,
  },
  description:
    "Production-grade TypeScript monorepo template powered by Turborepo, Fumadocs, and Biome.",
  keywords: ["monorepo", "typescript", "turborepo", "fumadocs", "biome"],
  openGraph: {
    type: "website",
    siteName: name,
    locale: "en_US",
    title: `${name} - Production-grade TypeScript Monorepo Template`,
    description: "Production-grade TypeScript monorepo template.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${name} - Production-grade TypeScript Monorepo Template`,
    description: "Production-grade TypeScript monorepo template.",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
