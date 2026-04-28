"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { processText } from "@/lib/processText";
import type { ProcessOptions } from "@/lib/processText";
import { analyzeText } from "@/lib/aiAnalyzer";
import type { AIScore } from "@/lib/aiAnalyzer";
import { AdBanner } from "@/components/AdBanner";

type Tab = "fix" | "analyze";

export default function Home() {
  // Tab
  const [activeTab, setActiveTab] = useState<Tab>("fix");

  // Fix Text state
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

  // AI Analyzer state
  const [analyzerInput, setAnalyzerInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AIScore | null>(null);
  const [analyzerCopied, setAnalyzerCopied] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const analyzerTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Fix Text logic ───────────────────────────────────────────────

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

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

  const handlePaste = useCallback(() => {
    requestAnimationFrame(() => {
      const pastedText = textareaRef.current?.value ?? "";
      if (pastedText.trim()) runProcess(pastedText);
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

  // ─── AI Analyzer logic ────────────────────────────────────────────

  const runAnalysis = useCallback((text: string) => {
    if (!text.trim()) return;
    const result = analyzeText(text);
    setAnalysisResult(result);
  }, []);

  const handleAnalyzerInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnalyzerInput(e.target.value);
  }, []);

  const handleAnalyzerPaste = useCallback(() => {
    requestAnimationFrame(() => {
      const pastedText = analyzerTextareaRef.current?.value ?? "";
      if (pastedText.trim()) runAnalysis(pastedText);
    });
  }, [runAnalysis]);

  const handleAnalyzeClick = useCallback(() => {
    runAnalysis(analyzerInput);
  }, [analyzerInput, runAnalysis]);

  const handleAnalyzerClear = useCallback(() => {
    setAnalyzerInput("");
    setAnalysisResult(null);
    setAnimatedScore(0);
  }, []);

  // Animate score number counting up
  useEffect(() => {
    if (!analysisResult || analysisResult.overall === animatedScore) return;
    const target = analysisResult.overall;
    const step = target > animatedScore ? Math.max(1, Math.ceil((target - animatedScore) / 30)) : -Math.max(1, Math.ceil((animatedScore - target) / 30));
    const timer = setInterval(() => {
      setAnimatedScore((prev) => {
        const next = prev + step;
        if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [analysisResult, animatedScore]);

  const handleShareScore = useCallback(async () => {
    if (!analysisResult) return;
    const text = `I just tested my text on AddFullStop and got a ${analysisResult.overall}% AI score! 🔒 Try yours → addfullstop.vercel.app`;
    await navigator.clipboard.writeText(text);
    setAnalyzerCopied(true);
    setTimeout(() => setAnalyzerCopied(false), 2000);
  }, [analysisResult]);

  // ─── Score ring SVG ───────────────────────────────────────────────

  const scoreColor = analysisResult?.color ?? "green";
  const ringColor = scoreColor === "green" ? "#22c55e" : scoreColor === "yellow" ? "#eab308" : "#ef4444";
  const circumference = 2 * Math.PI * 70; // radius=70
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // ─── Metric bar helper ────────────────────────────────────────────

  const MetricCard = ({ title, metric, delay }: { title: string; metric: { score: number; label: string; description: string }; delay: string }) => (
    <div className={`animate-fade-in-up ${delay} rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</span>
        <span className={`text-sm font-bold ${metric.score < 30 ? "text-green-600 dark:text-green-400" : metric.score < 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
          {metric.score}%
        </span>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${metric.score < 30 ? "bg-green-500" : metric.score < 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${metric.score}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</p>
    </div>
  );

  return (
    <>
      <AdBanner slot="horizontal" />

      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-16">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Clean Up ChatGPT Text
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
            Fix trailing spaces, add periods, remove emojis — or check if your text sounds AI-generated.
            All processing happens in your browser.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setActiveTab("fix")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "fix"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              ✏️ Fix Text
            </button>
            <button
              onClick={() => setActiveTab("analyze")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "analyze"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              🔍 AI Analyzer
            </button>
          </div>
        </div>

        {/* ═══════════════ FIX TEXT TAB ═══════════════ */}
        {activeTab === "fix" && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Input */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="input-text" className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Input
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Upload .txt
                </button>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.text" onChange={handleFileUpload} className="hidden" aria-label="Upload text file" />
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
                <input type="checkbox" checked={fixTrailing} onChange={(e) => setFixTrailing(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add periods (fix trailing spaces)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 transition select-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/50">
                <input type="checkbox" checked={removeEmojis} onChange={(e) => setRemoveEmojis(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Remove emojis</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 transition select-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/50">
                <input type="checkbox" checked={addHR} onChange={(e) => setAddHR(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300"># → --- (horizontal rule before headings)</span>
              </label>
            </div>

            {/* Actions */}
            <div className="mb-4 flex flex-wrap gap-2 sm:gap-3">
              <button onClick={handleProcess} disabled={!input.trim() || (!fixTrailing && !removeEmojis && !addHR)} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
                Process
              </button>
              <button onClick={handleCopy} disabled={!output} className="rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-700 dark:hover:bg-zinc-600">
                {copied ? "Copied!" : "Copy Output"}
              </button>
              <button onClick={handleDownload} disabled={!output} className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Save .txt
              </button>
              <button onClick={handleClear} className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                Clear
              </button>
            </div>

            {/* Stats */}
            {hasResults && (
              <div role="status" className="mb-4 flex flex-wrap justify-center gap-4 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                {periodsAdded !== null && fixTrailing && (
                  <span>{periodsAdded > 0 ? <>Added <span className="font-bold">{periodsAdded}</span> period{periodsAdded > 1 ? "s" : ""}</> : "No trailing-space lines found"}</span>
                )}
                {emojisRemoved !== null && removeEmojis && (
                  <span>{emojisRemoved > 0 ? <>Removed <span className="font-bold">{emojisRemoved}</span> emoji{emojisRemoved > 1 ? "s" : ""}</> : "No emojis found"}</span>
                )}
                {headingsProcessed !== null && addHR && (
                  <span>{headingsProcessed > 0 ? <><span className="font-bold">{headingsProcessed}</span> heading{headingsProcessed > 1 ? "s" : ""} → ---</> : "No # headings found"}</span>
                )}
              </div>
            )}

            {/* Output */}
            <div>
              <label htmlFor="output-text" className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
        )}

        {/* ═══════════════ AI ANALYZER TAB ═══════════════ */}
        {activeTab === "analyze" && (
          <div className="space-y-6">
            {/* Input */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="analyzer-input" className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Paste your text
                </label>
                <button onClick={handleAnalyzerClear} className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                  Clear
                </button>
              </div>
              <textarea
                id="analyzer-input"
                ref={analyzerTextareaRef}
                value={analyzerInput}
                onChange={handleAnalyzerInputChange}
                onPaste={handleAnalyzerPaste}
                placeholder="Paste any text to check if it sounds AI-generated..."
                rows={6}
                className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
              />
              <button
                onClick={handleAnalyzeClick}
                disabled={!analyzerInput.trim()}
                className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Analyze Text
              </button>
              <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
                💡 Pro tip: Just paste — auto-analyzes on paste!
              </p>
            </div>

            {/* Results */}
            {analysisResult && (
              <>
                {/* Score Circle */}
                <div className="animate-pulse-once rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="relative mx-auto mb-4 h-48 w-48">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
                      <circle
                        cx="80" cy="80" r="70" fill="none"
                        stroke={ringColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="animate-score-ring"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-5xl font-black ${scoreColor === "green" ? "text-green-600 dark:text-green-400" : scoreColor === "yellow" ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                        {animatedScore}
                      </span>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">% AI Score</span>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${scoreColor === "green" ? "text-green-700 dark:text-green-400" : scoreColor === "yellow" ? "text-yellow-700 dark:text-yellow-400" : "text-red-700 dark:text-red-400"}`}>
                    {analysisResult.label}
                  </p>

                  {/* Stats bar */}
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{analysisResult.stats.wordCount} words</span>
                    <span>{analysisResult.stats.sentenceCount} sentences</span>
                    <span>{analysisResult.stats.readingTimeMin} min read</span>
                    <span>Avg {analysisResult.stats.avgSentenceLength} words/sentence</span>
                  </div>

                  {/* Share button */}
                  <button
                    onClick={handleShareScore}
                    className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {analyzerCopied ? "✅ Copied!" : "📋 Share your score"}
                  </button>
                </div>

                {/* Metric Breakdown */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">Score Breakdown</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <MetricCard title="Sentence Variance" metric={analysisResult.metrics.sentenceVariance} delay="delay-100" />
                    <MetricCard title="Vocabulary Richness" metric={analysisResult.metrics.vocabularyRichness} delay="delay-200" />
                    <MetricCard title="Burstiness" metric={analysisResult.metrics.burstiness} delay="delay-300" />
                    <MetricCard title="AI Phrases" metric={analysisResult.metrics.aiPhrases} delay="delay-400" />
                    <MetricCard title="Starter Repetition" metric={analysisResult.metrics.starterRepetition} delay="delay-500" />
                    <MetricCard title="Paragraph Uniformity" metric={analysisResult.metrics.paragraphUniformity} delay="delay-600" />
                  </div>
                </div>

                {/* Tips */}
                {analysisResult.tips.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {analysisResult.overall < 30 ? "✅ Looking Good" : "💡 Tips to Sound More Human"}
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <span className="mt-0.5 shrink-0">{analysisResult.overall < 30 ? "👍" : "→"}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Line-by-line */}
                {analysisResult.lineScores.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">Line-by-Line Analysis</h3>
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {analysisResult.lineScores.map((ls) => (
                        <div
                          key={ls.line}
                          className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                            ls.score < 20 ? "line-highlight-low" : ls.score < 50 ? "line-highlight-medium" : "line-highlight-high"
                          }`}
                        >
                          <span className="shrink-0 font-mono text-zinc-400 dark:text-zinc-500">{ls.line}.</span>
                          <span className="flex-1 text-zinc-700 dark:text-zinc-300">{ls.text}</span>
                          <span className={`shrink-0 text-[10px] font-medium ${ls.score >= 50 ? "text-red-500" : ls.score >= 20 ? "text-yellow-600" : "text-green-600"}`}>
                            {ls.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
                q: "How does the AI Analyzer work?",
                a: "It uses 6 heuristic metrics to detect patterns typical of AI-generated text: sentence length variance, vocabulary richness, burstiness (rhythm), AI phrase detection, sentence starter repetition, and paragraph uniformity. All analysis runs in your browser — no data is sent anywhere.",
              },
              {
                q: "How accurate is the AI score?",
                a: "This is a heuristic-based analyzer, not an ML model. It's best used as a guide — high scores strongly suggest AI patterns, but low scores don't guarantee human authorship. For best results, analyze texts of 100+ words.",
              },
              {
                q: "What does the emoji removal feature do?",
                a: "It strips all emoji characters from your text — including emoticons, symbols, pictographs, and flag sequences. Useful for clean, plain text for professional documents or emails.",
              },
              {
                q: "Is my data safe?",
                a: "Yes. All processing happens entirely in your browser. Your text is never sent to any server. There is no data collection, no cookies, and no tracking.",
              },
              {
                q: "Does it work with non-English text?",
                a: "Yes! Works with Thai, Chinese, Japanese, Korean, Arabic, and more. The analyzer detects patterns regardless of language.",
              },
              {
                q: "Can I use this offline?",
                a: "Yes. Once the page loads, all text processing runs locally in your browser. You can also use our Python CLI tool for offline processing.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-zinc-900 group-open:text-blue-600 dark:text-zinc-100 dark:group-open:text-blue-400">
                  {faq.q}
                </summary>
                <p className="px-5 pb-4 text-sm text-zinc-500 dark:text-zinc-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
