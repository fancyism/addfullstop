import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About AddFullStop — a free tool to fix ChatGPT trailing space issues.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        About AddFullStop
      </h1>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            What is AddFullStop?
          </h2>
          <p>
            AddFullStop is a free, open-source tool designed to fix a common issue with
            AI-generated text. When ChatGPT and similar AI models generate text, they
            sometimes add trailing whitespace at the end of lines. This can cause
            formatting problems when pasting into documents, social media posts, or code
            editors.
          </p>
          <p className="mt-3">
            Our tool automatically detects lines with trailing spaces, removes the extra
            whitespace, and adds a period — making your text clean and ready to use.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            How It Works
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Detection:</strong> Each line is scanned for trailing whitespace
              (spaces or tabs at the end of the line).
            </li>
            <li>
              <strong>Cleanup:</strong> Trailing whitespace is removed.
            </li>
            <li>
              <strong>Punctuation:</strong> A period is added to lines that don&apos;t
              already end with punctuation (., !, ?, 。, ？, ！).
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Privacy First
          </h2>
          <p>
            All text processing happens entirely in your browser. Your text is{" "}
            <strong>never sent to any server</strong>. No data is collected, stored, or
            tracked. What you type stays on your device.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Multi-Language Support
          </h2>
          <p>
            AddFullStop works with any language — English, Thai, Chinese, Japanese,
            Korean, Arabic, and more. The tool detects trailing whitespace regardless of
            the text language.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Also Available as CLI
          </h2>
          <p>
            For developers and power users, we also provide a Python CLI tool that can
            process text from files, clipboard, or stdin:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100 p-4 text-xs dark:bg-zinc-800">
            <code>{`# From clipboard → clipboard
python addfullstop.py --clipboard --clipboard-out

# From file → file
python addfullstop.py -i input.txt -o output.txt`}</code>
          </pre>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Built With
          </h2>
          <div className="flex flex-wrap gap-2">
            {["Next.js", "TypeScript", "Tailwind CSS", "Python"].map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
