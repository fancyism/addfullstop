import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for AddFullStop.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Terms of Service
      </h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using AddFullStop, you agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            2. Description of Service
          </h2>
          <p>
            AddFullStop is a free, browser-based text formatting tool that processes text
            to add periods to lines with trailing whitespace. The service is provided
            &quot;as is&quot; without any warranties of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            3. Use of Service
          </h2>
          <p>You agree to use this service only for lawful purposes. You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the service for any illegal or unauthorized purpose</li>
            <li>Attempt to disrupt or overload the service</li>
            <li>Use automated tools to access the service in a way that exceeds reasonable use</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            4. Intellectual Property
          </h2>
          <p>
            The content, design, and code of AddFullStop are protected by intellectual
            property laws. You may not copy, modify, or distribute our code without
            explicit permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            5. Limitation of Liability
          </h2>
          <p>
            AddFullStop is provided &quot;as is&quot; without warranty of any kind. We
            are not liable for any damages arising from the use of this service,
            including but not limited to loss of data, text corruption, or any other
            issues resulting from the use of the tool.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            6. Data Responsibility
          </h2>
          <p>
            All text processing happens in your browser. We do not store, transmit, or
            have access to any text you process. You are solely responsible for the
            content you input and the results you obtain.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            7. Modifications
          </h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the
            service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            8. Contact
          </h2>
          <p>
            Questions about these terms? Visit our{" "}
            <a
              href="/contact"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              Contact page
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
