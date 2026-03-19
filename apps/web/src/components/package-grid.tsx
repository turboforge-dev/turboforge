import fs from "node:fs";
import path from "node:path";
import * as LucideIcons from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface PackageMeta {
  title: string;
  description?: string;
  tagLine?: string;
  icon?: string;
}

export const PackageGrid = async () => {
  const docsDir = path.join(process.cwd(), "content/docs");

  const packages: { pkgId: string; meta: PackageMeta }[] = [];

  try {
    const folders = fs.readdirSync(docsDir, { withFileTypes: true });

    for (const folder of folders) {
      if (folder.isDirectory()) {
        const metaPath = path.join(docsDir, folder.name, "meta.json");
        if (fs.existsSync(metaPath)) {
          const content = fs.readFileSync(metaPath, "utf8");
          try {
            const meta = JSON.parse(content);
            packages.push({
              pkgId: folder.name,
              meta,
            });
          } catch {
            console.error(`Failed to parse meta.json in ${folder.name}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error reading docs directory:", error);
  }

  // Sort by title alphabetically
  packages.sort((a, b) =>
    (a.meta.title || "").localeCompare(b.meta.title || ""),
  );

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
            The Turboforge Ecosystem
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to build, sync, and document standard tooling.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {packages.map(({ pkgId, meta }) => {
            const IconName = meta.icon || "Box";
            const IconComponent =
              // @ts-expect-error -- ok here
              // biome-ignore lint/performance/noDynamicNamespaceImportAccess: required here
              (LucideIcons[IconName] as React.ElementType) || LucideIcons.Box;

            return (
              <Link
                key={pkgId}
                href={`/docs/${pkgId}`}
                className="group block focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent rounded-xl"
              >
                <Card className="h-full border-border/50 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-md group-hover:-translate-y-1">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {meta.title || pkgId}
                    </CardTitle>
                    <CardDescription className="text-base mt-2 line-clamp-2">
                      {meta.tagLine ||
                        meta.description ||
                        "View documentation."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Explore documentation
                      <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
