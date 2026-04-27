"use client";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <h1 className="text-4xl font-bold text-zinc-300 dark:text-zinc-700">
        Something went wrong
      </h1>
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Reload Page
      </button>
    </div>
  );
}
