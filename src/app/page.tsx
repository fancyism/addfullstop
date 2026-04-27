"use client";

import { useState, useCallback, useRef } from "react";
import { processText } from "@/lib/processText";
import type { ProcessOptions } from "@/lib/processText";
import { AdBanner } from "@/components/AdBanner";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [periodsAdded, setPeriodsAdded] = useState<number | null>(null);
  const [emojisRemoved, setEmojisRemoved] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [removeEmojis, setRemoveEmojis] = useState(true);
  const [fixTrailing, setFixTrailing] = useState(true);
  const [addHR, setAddHR] = useState(true);
  const [headingsProcessed, setHeadingsProcessed] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getOptions = useCallback(
    (): ProcessOptions => ({
      fixTrailingSpaces: fixTrailing,
      removeEmojis,
      addHorizontalRule: addHR,
    }),
    [fixTrailing, removeEmojis, addHR],
  );

  const runProcess = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const opts = getOptions();
      const result = processText(text, opts);
      setOutput(result.text);
      setPeriodsAdded(result.periodsAdded);
      setEmojisRemoved(result.emojisRemoved);
      setHeadingsProcessed(result.headingsProcessed);
    },
    [getOptions],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  const handleProcess = useCallback(() => {
    runProcess(input);
  }, [input, runProcess]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "addfullstop-output.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setInput(text);
        runProcess(text);
      };
      reader.readAsText(file, "utf-8");
    },
    [runProcess],
  );

  // Read pasted value directly from the textarea DOM node — avoids stale closure
  const handlePaste = useCallback(() => {
    requestAnimationFrame(() => {
      const pastedText = textareaRef.current?.value ?? "";
      if (pastedText.trim()) {
        runProcess(pastedText);
      }
    });
  }, [runProcess]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setPeriodsAdded(null);
    setEmojisRemoved(null);
    setHeadingsProcessed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const hasResults = periodsAdded !== null || emojisRemoved !== null || headingsProcessed !== null;

  return (
    <>
      <AdBanner slot="horizontal" />

      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-16">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Clean Up ChatGPT Text
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
            Fix trailing spaces, add periods, and remove emojis from AI-generated
            text. All processing happens in your browser.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            {
              step: "1",
              title: "Paste or Upload",
              desc: "Paste text directly or upload a .txt file",
            },
            {
              step: "2",
              title: "Choose Options",
              desc: "Toggle emoji removal, period fixing, or both",
            },
            {
              step: "3",
              title: "Process",
              desc: "One click to clean up your text",
            },
            {
              step: "4",
              title: "Copy or Save",
              desc: "Copy to clipboard or download as file",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {item.step}
              </div>
              <h3 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {item.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Tool */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {/* Input */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="input-text"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                Input
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Upload .txt
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload text file"
              />
            </div>
            <textarea
              id="input-text"
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onPaste={handlePaste}
              placeholder="Paste your ChatGPT text here, or upload a file..."
              rows={8}
              className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 sm:rows-10"
            />
          </div>

          {/* Options */}
          <div className="mb-4 flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 transition select-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/50">
              <input
                type="checkbox"
                checked={fixTrailing}
                onChange={(e) => setFixTrailing(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Add periods (fix trailing spaces)
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 transition select-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/50">
              <input
                type="checkbox"
                checked={removeEmojis}
                onChange={(e) => setRemoveEmojis(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Remove emojis
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 transition select-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/50">
              <input
                type="checkbox"
                checked={addHR}
                onChange={(e) => setAddHR(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                # → --- (horizontal rule before headings)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="mb-4 flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleProcess}
              disabled={!input.trim() || (!fixTrailing && !removeEmojis && !addHR)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Process
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!output}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Save .txt
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Clear
            </button>
          </div>

          {/* Stats */}
          {hasResults && (
            <div
              role="status"
              className="mb-4 flex flex-wrap justify-center gap-4 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
            >
              {periodsAdded !== null && fixTrailing && (
                <span>
                  {periodsAdded > 0 ? (
                    <>
                      Added <span className="font-bold">{periodsAdded}</span>{" "}
                      period{periodsAdded > 1 ? "s" : ""}
                    </>
                  ) : (
                    "No trailing-space lines found"
                  )}
                </span>
              )}
              {emojisRemoved !== null && removeEmojis && (
                <span>
                  {emojisRemoved > 0 ? (
                    <>
                      Removed <span className="font-bold">{emojisRemoved}</span>{" "}
                      emoji{emojisRemoved > 1 ? "s" : ""}
                    </>
                  ) : (
                    "No emojis found"
                  )}
                </span>
              )}
              {headingsProcessed !== null && addHR && (
                <span>
                  {headingsProcessed > 0 ? (
                    <>
                      <span className="font-bold">{headingsProcessed}</span>{" "}
                      heading{headingsProcessed > 1 ? "s" : ""} → ---
                    </>
                  ) : (
                    "No # headings found"
                  )}
                </span>
              )}
            </div>
          )}

          {/* Output */}
          <div>
            <label
              htmlFor="output-text"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Output
            </label>
            <textarea
              id="output-text"
              value={output}
              readOnly
              placeholder="Processed text will appear here..."
              rows={8}
              className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 sm:rows-10"
            />
          </div>
        </div>

        <div className="mt-8">
          <AdBanner slot="horizontal" />
        </div>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-6 text-center text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Why does ChatGPT add trailing spaces?",
                a: "ChatGPT and other AI models sometimes generate text with trailing whitespace at the end of lines. This can cause formatting issues when pasting into documents, code editors, or social media.",
              },
              {
                q: "How does AddFullStop work?",
                a: "The tool scans each line of your text. If a line has trailing whitespace (extra spaces at the end), it removes those spaces and adds a period. Lines that already end with punctuation are left unchanged.",
              },
              {
                q: "What does the emoji removal feature do?",
                a: "It strips all emoji characters from your text — including emoticons, symbols, pictographs, and flag sequences. This is useful when you want clean, plain text without emojis for professional documents, emails, or social media posts.",
              },
              {
                q: "Is my data safe?",
                a: "Yes. All processing happens entirely in your browser. Your text is never sent to any server. There is no data collection, no cookies, and no tracking.",
              },
              {
                q: "Does it work with languages other than English?",
                a: "Yes! AddFullStop works with any language — Thai, Chinese, Japanese, Korean, Arabic, and more. It detects trailing whitespace and emojis regardless of the text language.",
              },
              {
                q: "Can I use only one feature at a time?",
                a: "Yes. Use the checkboxes to toggle each feature independently. You can fix only trailing spaces, only remove emojis, or use both together.",
              },
              {
                q: "Can I use this offline?",
                a: "Yes. Once the page loads, all text processing runs locally in your browser. You can also use our Python CLI tool for offline processing.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-zinc-900 group-open:text-blue-600 dark:text-zinc-100 dark:group-open:text-blue-400">
                  {faq.q}
                </summary>
                <p className="px-5 pb-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
