import { highlight } from "sugar-high";

const codeSnippet = `packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"

// Turboforge derives intelligence from your 
// standard package manager configurations.`;

const highlightedCode = highlight(codeSnippet);

export const TechnicalPreview = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-foreground">
              Convention Over Configuration
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Turboforge embraces zero-config standardization. Instead of
              reinventing the wheel with new config files, it derives its
              intelligence directly from your existing{" "}
              <code className="text-primary font-mono text-sm px-1.5 py-0.5 rounded-md bg-primary/10">
                pnpm-workspace.yaml
              </code>
              .
            </p>
            <ul className="space-y-3">
              {[
                "Zero proprietary config files",
                "Automated package synchronization",
                "Fumadocs integration by default",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center text-foreground font-medium"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:w-1/2 w-full">
            <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-border bg-zinc-950 font-mono text-sm leading-relaxed p-6 text-zinc-300">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-zinc-500 text-xs">
                  pnpm-workspace.yaml
                </span>
              </div>
              <pre className="overflow-x-auto scroolbar-thin">
                <code
                  className="text-sm"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled input
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
