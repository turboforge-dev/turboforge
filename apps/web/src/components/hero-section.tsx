import { ArrowRight, Download, Github } from "lucide-react";
import Link from "next/link";
import { highlight } from "sugar-high";

const codeSample = `import { scanWorkspace } from "@promptshield/workspace";
import type { FileScanResult } from "@promptshield/workspace";

const allThreats: Record<string, FileScanResult> = {};

for await (const event of scanWorkspace()) {
  const { path, result, progress } = event;
  // show progress, handle abort etc.
  if (threatCount) allThreats[path] = result;
}`;

const highlightedCode = highlight(codeSample);

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center gap-12">
        {/* Decorative background blurs using CSS vars */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--color-ps-accent)]/20 blur-[120px] rounded-full pointer-events-none -z-10 animate-[var(--animate-pulse-slow)]" />

        <div className="flex-1 text-center lg:text-left">
          {/* Trust Lever Badges */}
          {/* <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6 animate-[var(--animate-fade-in-up)]">
            <img alt="npm downloads" src="https://img.shields.io/npm/dt/@promptshield/core?style=flat-square&color=blue" className="h-5" />
            <img alt="github stars" src="https://img.shields.io/github/stars/promptshield-io/promptshield?style=flat-square&color=gray" className="h-5" />
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20 h-5">
              Defends against CVE-2021-42574
            </span>
          </div> */}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 animate-[var(--animate-fade-in-up)] [animation-delay:100ms] opacity-0">
            Secure LLM Inputs — <br className="hidden xl:block" />
            <span className="text-[var(--color-ps-accent)]">
              From Prompts to Source Code
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--color-ps-muted-fg)] mb-8 animate-[var(--animate-fade-in-up)] [animation-delay:200ms] opacity-0 max-w-xl mx-auto lg:mx-0">
            Scan entire repositories for invisible Unicode, BIDI overrides, and
            homoglyphs — before they reach your LLM.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-[var(--animate-fade-in-up)] [animation-delay:400ms] opacity-0 mb-4">
            <Link
              href="/docs"
              className="flex items-center gap-2 bg-[var(--color-ps-accent)] hover:bg-blue-600 text-[var(--color-ps-accent-fg)] px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/20"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="vscode:extension/mayank1513.promptshield"
              className="flex items-center gap-2 bg-[var(--color-ps-secondary)] hover:bg-[var(--color-ps-muted)] text-[var(--color-ps-fg)] px-8 py-3 rounded-xl font-semibold transition-colors border border-[var(--color-ps-border)]"
            >
              Install Extension
              <Download className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/promptshield-io/promptshield"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-[var(--color-ps-secondary)] hover:bg-[var(--color-ps-muted)] text-[var(--color-ps-fg)] px-8 py-3 rounded-xl font-semibold transition-colors border border-[var(--color-ps-border)]"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
          <p className="text-sm font-medium text-[var(--color-ps-muted-fg)] animate-[var(--animate-fade-in-up)] [animation-delay:500ms] opacity-0">
            Deterministic. Local. Zero dependencies.
          </p>
        </div>

        <div className="flex-1 w-full max-w-2xl animate-[var(--animate-fade-in-up)] [animation-delay:600ms] opacity-0">
          <div className="bg-[#0D1117] rounded-2xl border border-[var(--color-ps-border)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-[#161B22]">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-gray-400 font-mono">
                security-layer.ts
              </span>
            </div>
            <div className="p-4 md:p-6 text-sm md:text-base font-mono leading-relaxed overflow-x-auto text-gray-300">
              <pre className="dark">
                <code
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled input
                  dangerouslySetInnerHTML={{
                    __html: highlightedCode,
                  }}
                />
              </pre>
            </div>
            <div className="px-4 py-3 border-t border-gray-800 bg-[#161B22] text-sm font-mono text-gray-400 flex items-center gap-2 overflow-x-auto">
              <span className="text-pink-400">$&nbsp;</span>
              <span>npx @promptshield/cli scan</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
