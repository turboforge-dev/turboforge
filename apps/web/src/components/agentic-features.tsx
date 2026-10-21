import { Bot, Brain, Sparkles, Terminal, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const features = [
  {
    icon: Bot,
    title: "Instant Agent Alignment",
    tagline: "AGENTS.md & .agents/rules.md",
    description:
      "Universal guidance for Antigravity, Cursor, Windsurf, Claude Code, and Copilot. Enforces commitlint scopes, ESM config conventions, and protected paths.",
    badge: "Standards",
  },
  {
    icon: Terminal,
    title: "Deterministic Plop Skills",
    tagline: "template-code-generator",
    description:
      "Autonomous generators for packages, Fumadocs metadata, React components, and hooks. Eliminates copy-paste drift and guarantees collision-free CLI setups.",
    badge: "Scaffolding",
  },
  {
    icon: Brain,
    title: "Persistent Working Memory",
    tagline: ".brain/ & context.md",
    description:
      "Git-ignored scratchpad and task-tracking directory for multi-turn AI sessions. Keeps experimental scripts, research notes, and checklists isolated.",
    badge: "Memory",
  },
  {
    icon: Zap,
    title: "Sub-5s Agent Loopback",
    tagline: "Turbo Build Isolation",
    description:
      "Default builds isolate packages from the Next.js documentation portal. Agent test & verification cycles run in under 3 seconds with minimal token burn.",
    badge: "Performance",
  },
];

export const AgenticFeatures = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            AI-Native Monorepo
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
            Architected for Agentic Engineering
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Traditional templates break when AI agents touch them. Turboforge
            empowers autonomous coding assistants with deterministic skills,
            persistent memory, and fast verification loops.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      {feature.badge}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {feature.title}
                  </CardTitle>
                  <p className="text-xs font-mono text-primary font-medium">
                    {feature.tagline}
                  </p>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" className="font-semibold" asChild>
            <Link href="/docs/agentic-architecture/overview">
              Explore Agentic Architecture
              <Bot className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
