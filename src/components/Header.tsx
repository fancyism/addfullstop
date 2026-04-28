import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-white/20 dark:border-white/5">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight transition hover:opacity-80"
          style={{ color: "var(--text-primary)" }}
        >
          AddFullStop<span className="text-violet-500">.</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-sm transition hover:opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="hidden text-sm transition hover:opacity-70 sm:block"
            style={{ color: "var(--text-secondary)" }}
          >
            Privacy
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
