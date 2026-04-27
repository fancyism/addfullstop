import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} AddFullStop. Free to use.
          </div>
          <nav className="flex gap-6">
            <Link
              href="/about"
              className="text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
