import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="container relative z-10 mx-auto px-4 text-center">
        <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground mb-8">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
          Introducing Turboforge Beta
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6">
          The Monorepo <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 to-neutral-800 dark:from-neutral-300 dark:to-neutral-600">
            Operating System
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-10">
          Stop codebase drift. Turboforge keeps your packages, tooling, and docs
          aligned long after day zero.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button size="lg" className="w-full sm:w-auto font-semibold" asChild>
            <Link href="/docs">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto font-semibold"
            asChild
          >
            <Link
              href="https://github.com/turboforge-dev/turboforge"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
