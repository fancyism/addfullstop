import Link from "next/link";

export function Footer() {
  return (
    <footer className="glass mt-auto border-t border-white/20 dark:border-white/5">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} AddFullStop. Free to use.
          </div>
          <nav className="flex gap-6">
            <Link
              href="/about"
              className="text-sm transition hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm transition hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm transition hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-sm transition hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
