import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import "./global.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://promptshield.js.org";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: "%s | PromptShield",
    default: "PromptShield - Adversarial Prompt Security Layer",
  },
  description:
    "Protect your LLMs from invisible Unicode characters, BIDI overrides (Trojan Source), homoglyph attacks, and prompt smuggling.",
  keywords: [
    "prompt security",
    "prompt injection defense",
    "Unicode attack detection",
    "invisible character detection",
    "homoglyph attack prevention",
    "LLM input validation",
    "Trojan Source",
  ],
  openGraph: {
    type: "website",
    siteName: "PromptShield",
    locale: "en_US",
    title: "PromptShield - Adversarial Prompt Security Layer",
    description: "Detect and sanitize adversarial prompts robustly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptShield - Adversarial Prompt Security Layer",
    description: "Detect and sanitize adversarial prompts robustly.",
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
