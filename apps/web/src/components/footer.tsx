import { Heart } from "lucide-react";
import { author, name, year } from "@/meta.json";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-ps-border)] bg-[var(--color-ps-bg)] py-12">
      <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-[var(--color-ps-muted-fg)]">
        <div className="flex flex-col items-center md:items-start gap-2">
          <p className="font-semibold text-[var(--color-ps-fg)]">{name}</p>
          <p>
            MIT License &copy;{" "}
            {currentYear > year ? `${year}-${currentYear}` : currentYear}
          </p>
          <p>
            Built with{" "}
            <a
              href="https://github.com/turboforge-dev/turboforge/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-foreground"
            >
              Turboforge
            </a>
            .
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Built with</span>
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span>
            by{" "}
            <a
              href="https://github.com/mayank1513"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--color-ps-fg)] hover:text-[var(--color-ps-accent)] transition-colors"
            >
              {author}
            </a>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-medium text-[var(--color-ps-fg)]">
            Sponsors:
          </span>
          <a
            href="https://github.com/sponsors/mayank1513"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-ps-accent)] transition-colors"
          >
            GitHub Sponsors
          </a>
          <a
            href="https://polar.sh/mayank1513"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-ps-accent)] transition-colors"
          >
            Polar
          </a>
          <a
            href="https://pages.razorpay.com/pl_GNzW6vS10F9XyA/view"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-ps-accent)] transition-colors"
          >
            Razorpay
          </a>
        </div>
      </div>
    </footer>
  );
}
