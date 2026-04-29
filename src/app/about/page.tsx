import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — How AddFullStop Works",
  description:
    "AddFullStop fixes ChatGPT text, detects AI writing, and analyzes readability — 100% free, no sign-up, all in your browser.",
};

/* ─── Inline SVG icons (Heroicons-style) ─── */
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const PencilSquareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const MagnifyingGlassIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-500">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
);

const NumberCircle = ({ n }: { n: number }) => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-500/20">
    {n}
  </span>
);

/* ─── Before/After example ─── */
const BeforeAfter = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    <div className="rounded-xl bg-red-500/5 p-4">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-400">Before</div>
      <div className="space-y-1 font-mono text-xs leading-relaxed opacity-70">
        <p>Hello there  &nbsp;&nbsp;</p>
        <p>How are you doing  &nbsp;</p>
        <p>I am fine  </p>
        <p>What about you  </p>
      </div>
    </div>
    <div className="rounded-xl bg-green-500/5 p-4">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-green-400">After</div>
      <div className="space-y-1 font-mono text-xs leading-relaxed opacity-70">
        <p>Hello there.</p>
        <p>How are you doing.</p>
        <p>I am fine.</p>
        <p>What about you.</p>
      </div>
    </div>
  </div>
);

/* ─── Feature Card ─── */
const FeatureCard = ({
  icon,
  title,
  description,
  points,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  points: string[];
  delay: string;
}) => (
  <div className={`glass animate-fade-in-up rounded-2xl p-6 ${delay}`}>
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-600 dark:text-violet-400">
      {icon}
    </div>
    <h3 className="mb-2 text-base font-bold">{title}</h3>
    <p className="mb-4 text-sm leading-relaxed opacity-60">{description}</p>
    <ul className="space-y-2">
      {points.map((p) => (
        <li key={p} className="flex items-start gap-2 text-sm">
          <CheckIcon />
          <span className="opacity-80">{p}</span>
        </li>
      ))}
    </ul>
  </div>
);

/* ─── Step Card ─── */
const StepCard = ({
  n,
  title,
  description,
  delay,
}: {
  n: number;
  title: string;
  description: string;
  delay: string;
}) => (
  <div className={`glass animate-fade-in-up rounded-2xl p-5 text-center ${delay}`}>
    <div className="mb-3 flex justify-center">
      <NumberCircle n={n} />
    </div>
    <h3 className="mb-1 text-sm font-bold">{title}</h3>
    <p className="text-xs leading-relaxed opacity-60">{description}</p>
  </div>
);

/* ─── Main Page ─── */
export default function AboutPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      {/* ── Hero ── */}
      <section className="animate-fade-in-up mb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
          <SparklesIcon />
          Free &middot; No Sign-up &middot; Privacy-First
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Make AI Text Feel{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Human Again
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed opacity-60 sm:text-lg">
          AddFullStop cleans up messy ChatGPT output, detects AI-written text, and
          analyzes readability — all inside your browser, no data ever leaves your device.
        </p>
      </section>

      {/* ── Problem → Solution ── */}
      <section className="glass animate-fade-in-up mb-16 rounded-2xl p-6 sm:p-8" style={{ animationDelay: "100ms" }}>
        <h2 className="mb-2 text-center text-lg font-bold">The Problem</h2>
        <p className="mb-6 text-center text-sm opacity-60">
          ChatGPT adds trailing spaces, missing periods, and awkward formatting that
          breaks when you paste it anywhere.
        </p>
        <BeforeAfter />
      </section>

      {/* ── 3 Features ── */}
      <section className="mb-16">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-xl font-bold sm:text-2xl">Three Tools in One</h2>
          <p className="text-sm opacity-60">Everything you need to clean, check, and improve AI text.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <FeatureCard
            icon={<PencilSquareIcon />}
            title="Fix Text"
            description="Instantly clean up ChatGPT output with one click."
            points={[
              "Remove trailing spaces",
              "Add missing periods",
              "Strip emojis",
              "Format markdown headings",
            ]}
            delay=""
          />
          <FeatureCard
            icon={<MagnifyingGlassIcon />}
            title="AI Analyzer"
            description="Check if text sounds AI-generated with 10 heuristic metrics."
            points={[
              "10 detection metrics",
              "Line-by-line breakdown",
              "Score breakdown with tips",
              "Humanize suggestions",
            ]}
            delay="animation-delay-[100ms]"
          />
          <FeatureCard
            icon={<ChartBarIcon />}
            title="Readability"
            description="Measure how easy your text is to read."
            points={[
              "6 readability formulas",
              "Grade level scores",
              "Sentence analysis",
              "Content quality stats",
            ]}
            delay="animation-delay-[200ms]"
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="mb-16">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-xl font-bold sm:text-2xl">How It Works</h2>
          <p className="text-sm opacity-60">Three steps. Under 10 seconds.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StepCard
            n={1}
            title="Paste Your Text"
            description="Copy from ChatGPT, Gemini, Claude — or any source. Paste it in."
            delay=""
          />
          <StepCard
            n={2}
            title="Choose a Tool"
            description="Pick Fix Text, AI Analyzer, or Readability. Each tool does one thing well."
            delay="animation-delay-[100ms]"
          />
          <StepCard
            n={3}
            title="Get Results"
            description="Instant results. Copy, download, or export as PDF. Done."
            delay="animation-delay-[200ms]"
          />
        </div>
        {/* Connector line (desktop only) */}
        <div className="relative mt-[-1.5rem] hidden h-0 sm:block">
          <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-violet-400/0 via-violet-400/40 to-violet-400/0" />
        </div>
      </section>

      {/* ── Trust / Privacy ── */}
      <section className="glass animate-fade-in-up mb-16 rounded-2xl p-6 text-center sm:p-8">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400">
          <ShieldCheckIcon />
        </div>
        <h2 className="mb-2 text-lg font-bold">100% Private by Design</h2>
        <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed opacity-60">
          All processing happens entirely in your browser. Your text is{" "}
          <strong>never sent to any server</strong>. No data collected, stored, or tracked.
          What you type stays on your device.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "No sign-up required",
            "No cookies tracking",
            "No server-side processing",
            "Works offline",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-green-300/20 bg-green-500/5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ── Multi-Language ── */}
      <section className="glass-subtle animate-fade-in-up mb-16 rounded-2xl p-6 text-center">
        <h2 className="mb-2 text-base font-bold">Works in Every Language</h2>
        <p className="mb-4 text-sm opacity-60">
          English, Thai, Chinese, Japanese, Korean, Arabic, and more — AddFullStop
          detects and processes any language automatically.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-lg">
          {["EN", "TH", "ZH", "JP", "KR", "AR", "DE", "FR", "ES"].map((lang) => (
            <span
              key={lang}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xs font-bold"
            >
              {lang}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="animate-fade-in-up text-center">
        <h2 className="mb-3 text-xl font-bold sm:text-2xl">Ready to Clean Your Text?</h2>
        <p className="mb-6 text-sm opacity-60">It&apos;s free. It&apos;s instant. No strings attached.</p>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition duration-200 hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-violet-500/30"
        >
          Try AddFullStop Free
          <ArrowRightIcon />
        </Link>
        <p className="mt-4 text-xs opacity-40">
          Also available as a{" "}
          <a
            href="https://github.com/fancyism/addfullstop"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:opacity-80"
          >
            Python CLI
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/fancyism/addfullstop"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:opacity-80"
          >
            open-source on GitHub
          </a>
          .
        </p>
      </section>
    </article>
  );
}
