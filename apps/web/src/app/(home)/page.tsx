import type { Metadata } from "next";
import { DriftComparison } from "../../components/drift-comparison";
import { Footer } from "../../components/footer";
import { Hero } from "../../components/hero";
import { PackageGrid } from "../../components/package-grid";
import { TechnicalPreview } from "../../components/technical-preview";

export const metadata: Metadata = {
  title: "Turboforge - The Monorepo Operating System",
  description:
    "Stop codebase drift. Turboforge keeps your packages, tooling, and docs aligned long after day zero.",
  openGraph: {
    title: "Turboforge - The Monorepo Operating System",
    description:
      "Stop codebase drift. Turboforge keeps your packages, tooling, and docs aligned long after day zero.",
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1 w-full bg-background text-foreground antialiased selection:bg-primary/30">
      <Hero />
      <DriftComparison />
      <PackageGrid />
      <TechnicalPreview />
      <Footer />
    </main>
  );
}
