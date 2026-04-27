import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for AddFullStop — understand how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Privacy Policy
      </h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            1. Overview
          </h2>
          <p>
            AddFullStop is a free, browser-based text processing tool. We are committed
            to protecting your privacy. This policy explains what information we collect
            (spoiler: almost nothing) and how we use it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            2. Data Processing
          </h2>
          <p>
            All text processing happens entirely in your browser. Your text is{" "}
            <strong>never sent to our servers</strong>. We do not collect, store, or
            transmit any text you input into the tool. The processing is performed
            locally using JavaScript running in your web browser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            3. Information We Collect
          </h2>
          <p>We do not collect personal information. Specifically:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We do not collect names, email addresses, or contact details</li>
            <li>We do not collect the text you process</li>
            <li>We do not use cookies for tracking</li>
            <li>We do not require account creation or login</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            4. Analytics
          </h2>
          <p>
            We may use privacy-respecting analytics to understand general usage patterns
            (such as page views). Any analytics used will be anonymized and will not
            track individual users or their text content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            5. Advertising
          </h2>
          <p>
            We may display advertisements through Google AdSense. Google may use cookies
            to serve ads based on your prior visits to this or other websites. You can
            opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            6. Third-Party Services
          </h2>
          <p>
            Our website may contain links to third-party websites or services. We are not
            responsible for the privacy practices of those external sites.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            7. Children&apos;s Privacy
          </h2>
          <p>
            Our service is not directed to anyone under the age of 13. We do not
            knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            8. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted
            on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            9. Contact
          </h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at our{" "}
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
