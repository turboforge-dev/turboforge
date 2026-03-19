import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";

export const DriftComparison = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
            End Codebase Drift
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Traditional monorepos rot. Configs diverge, docs go stale.
            Turboforge standardizes everything.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Before */}
          <Card className="border-destructive/20 bg-background/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-destructive/50"></div>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center text-foreground">
                <XCircle className="w-5 h-5 text-destructive mr-2" />
                Before (Manual)
              </h3>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-destructive mr-2 mt-1">✕</span>
                  Split conventions across 10 packages
                </li>
                <li className="flex items-start">
                  <span className="text-destructive mr-2 mt-1">✕</span>
                  Stale READMEs and API docs
                </li>
                <li className="flex items-start">
                  <span className="text-destructive mr-2 mt-1">✕</span>
                  Manual dependency upgrades
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* After */}
          <Card className="border-primary/20 bg-background/50 backdrop-blur-sm shadow-lg relative overflow-hidden ring-1 ring-primary/10">
            <div className="absolute top-0 w-full h-1 bg-primary"></div>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center text-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary mr-2" />
                With Turboforge
              </h3>
              <ul className="space-y-4 text-foreground/90 font-medium">
                <li className="flex items-start">
                  <span className="text-primary mr-2 mt-1">✓</span>
                  Shared CLI primitives and tooling
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2 mt-1">✓</span>
                  Live API-to-MDX documentation pipeline
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2 mt-1">✓</span>
                  Automated sync and uniform configs
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
