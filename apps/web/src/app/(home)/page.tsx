import type { Metadata } from "next";
import { Footer } from "../../components/footer";
import { HeroSection } from "../../components/hero-section";

export const metadata: Metadata = {
  title: "PromptShield - The Security Layer for AI Prompts",
  description:
    "A unified ecosystem for detecting and neutralizing adversarial Unicode, invisible character poisoning, and homoglyph attacks in LLM workflows.",
  openGraph: {
    title: "PromptShield - The Security Layer for AI Prompts",
    description:
      "A unified ecosystem for detecting and neutralizing adversarial Unicode, invisible character poisoning, and homoglyph attacks in LLM workflows.",
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 w-full bg-[var(--color-ps-bg)] text-[var(--color-ps-fg)] antialiased">
      <HeroSection />
      <Footer />
    </div>
  );
}
