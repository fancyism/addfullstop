"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <h1 className="text-6xl font-bold text-zinc-300 dark:text-zinc-700">404</h1>
      <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
        Page not found.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
