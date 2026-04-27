import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the AddFullStop team.",
};

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Contact Us
      </h1>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        <p>
          Have questions, suggestions, or found a bug? We&apos;d love to hear from you.
        </p>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Get in Touch
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                GitHub
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Report issues or contribute at our GitHub repository. This is the best
                way to report bugs or request features.
              </p>
              <a
                href="https://github.com/fancyism/addfullstop"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                github.com/fancyism/addfullstop
              </a>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Email
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                For general inquiries, partnerships, or AdSense-related questions.
              </p>
              {/* Update with your actual email */}
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                hello@addfullstop.app
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Response Time
          </h2>
          <p>
            We typically respond within 24–48 hours. For urgent issues, please use
            GitHub issues for the fastest response.
          </p>
        </section>
      </div>
    </article>
  );
}
