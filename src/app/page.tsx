"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { processText } from "@/lib/processText";
import type { ProcessOptions } from "@/lib/processText";
import { analyzeText } from "@/lib/aiAnalyzer";
import type { AIScore } from "@/lib/aiAnalyzer";
import { humanizeText } from "@/lib/humanizer";
import type { HumanizeResult } from "@/lib/humanizer";
import { formatForPlatform, PLATFORM_META } from "@/lib/platformFormatter";
import type { Platform, PlatformFormatResult } from "@/lib/platformFormatter";
import { analyzeReadability } from "@/lib/readabilityAnalyzer";
import type { ReadabilityResult } from "@/lib/readabilityAnalyzer";
import { AdBanner } from "@/components/AdBanner";

// ─── Clipboard with fallback ──────────────────────────────────────────
async function copyToClipboard(text: string): Promise<boolean> {
  // Modern Clipboard API (requires HTTPS or localhost)
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: hidden textarea + execCommand (works on HTTP)
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

type Tab = "fix" | "analyze" | "readability";

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
  const [humanizeResult, setHumanizeResult] = useState<HumanizeResult | null>(null);
  const [humanizedScore, setHumanizedScore] = useState<AIScore | null>(null);
  const [animatedHumanizedScore, setAnimatedHumanizedScore] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [platformResult, setPlatformResult] = useState<PlatformFormatResult | null>(null);
  const [platformCopied, setPlatformCopied] = useState(false);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);
  const analyzerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Readability state
  const [readabilityInput, setReadabilityInput] = useState("");
  const [readabilityResult, setReadabilityResult] = useState<ReadabilityResult | null>(null);
  const [readabilityError, setReadabilityError] = useState<string | null>(null);
  const [readabilityCopied, setReadabilityCopied] = useState(false);
  const readabilityTextareaRef = useRef<HTMLTextAreaElement>(null);
  const readabilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const ok = await copyToClipboard(output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
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
    setAnalyzerError(null);
    try {
      const result = analyzeText(text);
      setAnalysisResult(result);
    } catch (err) {
      setAnalyzerError("Analysis failed — something went wrong. Try shorter or different text.");
      console.error("analyzeText error:", err);
    }
  }, []);

  const handleAnalyzerInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnalyzerInput(e.target.value);
    // Debounce auto-analysis on typing (300ms)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const val = e.target.value.trim();
      if (val.length >= 50) {
        runAnalysis(val);
      }
    }, 300);
  }, [runAnalysis]);

  const handleAnalyzerPaste = useCallback(() => {
    requestAnimationFrame(() => {
      const pastedText = analyzerTextareaRef.current?.value ?? "";
      if (pastedText.trim()) runAnalysis(pastedText);
    });
  }, [runAnalysis]);

  const handleAnalyzeClick = useCallback(() => {
    setAnalyzerError(null);
    runAnalysis(analyzerInput);
  }, [analyzerInput, runAnalysis]);

  const handleAnalyzerClear = useCallback(() => {
    setAnalyzerInput("");
    setAnalysisResult(null);
    setAnalyzerError(null);
    setAnimatedScore(0);
    setHumanizeResult(null);
    setHumanizedScore(null);
    setAnimatedHumanizedScore(0);
    setSelectedPlatform(null);
    setPlatformResult(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // ─── Humanizer logic ─────────────────────────────────────────────

  const handleHumanize = useCallback(() => {
    if (!analyzerInput.trim()) return;
    setAnalyzerError(null);
    try {
      const result = humanizeText(analyzerInput);
      setHumanizeResult(result);
      const score = analyzeText(result.text);
      setHumanizedScore(score);
      // Reset platform when re-humanizing
      setSelectedPlatform(null);
      setPlatformResult(null);
    } catch (err) {
      setAnalyzerError("Humanization failed — try different text.");
      console.error("humanizeText error:", err);
    }
  }, [analyzerInput]);

  const handlePlatformSelect = useCallback((platform: Platform) => {
    if (!humanizeResult) return;
    // Toggle off if same platform
    if (selectedPlatform === platform) {
      setSelectedPlatform(null);
      setPlatformResult(null);
      return;
    }
    setSelectedPlatform(platform);
    const result = formatForPlatform(humanizeResult.text, platform);
    setPlatformResult(result);
  }, [humanizeResult, selectedPlatform]);

  const handleCopyPlatform = useCallback(async () => {
    if (!platformResult) return;
    const ok = await copyToClipboard(platformResult.text);
    if (ok) { setPlatformCopied(true); setTimeout(() => setPlatformCopied(false), 2000); }
  }, [platformResult]);

  // Animate original score
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
  }, [analysisResult]);

  // Animate humanized score
  useEffect(() => {
    if (!humanizedScore || humanizedScore.overall === animatedHumanizedScore) return;
    const target = humanizedScore.overall;
    const step = target > animatedHumanizedScore ? Math.max(1, Math.ceil((target - animatedHumanizedScore) / 30)) : -Math.max(1, Math.ceil((animatedHumanizedScore - target) / 30));
    const timer = setInterval(() => {
      setAnimatedHumanizedScore((prev) => {
        const next = prev + step;
        if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [humanizedScore]);

  const handleCopyHumanized = useCallback(async () => {
    if (!humanizeResult) return;
    const ok = await copyToClipboard(humanizeResult.text);
    if (ok) { setAnalyzerCopied(true); setTimeout(() => setAnalyzerCopied(false), 2000); }
  }, [humanizeResult]);

  const handleShareScore = useCallback(async () => {
    if (!analysisResult) return;
    const text = `I just tested my text on AddFullStop and got a ${analysisResult.overall}% AI score! 🔒 Try yours → addfullstop.vercel.app`;
    const ok = await copyToClipboard(text);
    if (ok) { setAnalyzerCopied(true); setTimeout(() => setAnalyzerCopied(false), 2000); }
  }, [analysisResult]);

  // ─── Readability logic ────────────────────────────────────────────

  const runReadabilityAnalysis = useCallback((text: string) => {
    if (!text.trim()) return;
    setReadabilityError(null);
    try {
      const result = analyzeReadability(text);
      setReadabilityResult(result);
    } catch (err) {
      setReadabilityError("Readability analysis failed — try different text.");
      console.error("analyzeReadability error:", err);
    }
  }, []);

  const handleReadabilityInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReadabilityInput(e.target.value);
    if (readabilityDebounceRef.current) clearTimeout(readabilityDebounceRef.current);
    readabilityDebounceRef.current = setTimeout(() => {
      const val = e.target.value.trim();
      if (val.length >= 50) runReadabilityAnalysis(val);
    }, 300);
  }, [runReadabilityAnalysis]);

  const handleReadabilityPaste = useCallback(() => {
    requestAnimationFrame(() => {
      const pastedText = readabilityTextareaRef.current?.value ?? "";
      if (pastedText.trim()) runReadabilityAnalysis(pastedText);
    });
  }, [runReadabilityAnalysis]);

  const handleReadabilityClear = useCallback(() => {
    setReadabilityInput("");
    setReadabilityResult(null);
    setReadabilityError(null);
    if (readabilityDebounceRef.current) clearTimeout(readabilityDebounceRef.current);
  }, []);

  const handleCopyReadability = useCallback(async () => {
    if (!readabilityResult) return;
    const summary = `📊 Readability Report\nFlesch Score: ${readabilityResult.fleschScore}/100 (${readabilityResult.grade})\nReading Level: ${readabilityResult.readingLevel}\nTarget: ${readabilityResult.audience}\nWords: ${readabilityResult.stats.wordCount} | Sentences: ${readabilityResult.stats.sentenceCount} | Avg ${readabilityResult.stats.avgWordsPerSentence} words/sentence\nAnalyzed on AddFullStop`;
    const ok = await copyToClipboard(summary);
    if (ok) { setReadabilityCopied(true); setTimeout(() => setReadabilityCopied(false), 2000); }
  }, [readabilityResult]);

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
            <button
              onClick={() => setActiveTab("readability")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "readability"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              📊 Readability
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
                maxLength={100000}
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
                maxLength={100000}
                className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
              />
              {/* Character counter */}
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-[11px] ${
                  analyzerInput.length === 0 ? "text-zinc-400"
                    : analyzerInput.length < 50 ? "text-yellow-500"
                    : analyzerInput.length > 50000 ? "text-red-500"
                    : "text-zinc-400"
                }`}>
                  {analyzerInput.length === 0 ? ""
                    : analyzerInput.length < 50 ? `⚠️ ${analyzerInput.length}/50 min chars`
                    : `${analyzerInput.length.toLocaleString()} characters`}
                  {analyzerInput.length > 50000 && " — very long text"}
                </span>
                {analyzerInput.length > 0 && analyzerInput.length < 50 && (
                  <span className="text-[11px] text-yellow-500">Type or paste 50+ chars to analyze</span>
                )}
              </div>
              {/* Error banner */}
              {analyzerError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  ⚠️ {analyzerError}
                </div>
              )}
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
                {/* Warnings banner */}
                {analysisResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    {analysisResult.warnings.map((w, i) => (
                      <div key={i} className={`rounded-lg border px-4 py-2.5 text-sm ${
                        w.type === "code_detected" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400"
                        : w.type === "non_english" ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400"
                        : w.type === "repeated_text" ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-400"
                        : w.type === "too_long" ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-400"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400"
                      }`}>
                        {w.type === "code_detected" ? "🖥️" : w.type === "non_english" ? "🌐" : w.type === "repeated_text" ? "🔁" : w.type === "too_long" ? "📏" : "⚠️"} {w.message}
                      </div>
                    ))}
                  </div>
                )}

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

                  {/* Share + Humanize buttons */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={handleShareScore}
                      className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {analyzerCopied ? "✅ Copied!" : "📋 Share your score"}
                    </button>
                    <button
                      onClick={handleHumanize}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      ✨ Humanize This Text
                    </button>
                  </div>
                </div>

                {/* ═══ Humanize Results ═══ */}
                {humanizeResult && humanizedScore && (
                  <>
                    {/* Score comparison */}
                    <div className="animate-fade-in-up rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-6 shadow-sm dark:border-emerald-900 dark:from-emerald-950/30 dark:to-zinc-900">
                      <h3 className="mb-4 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Before → After Humanization
                      </h3>
                      <div className="flex items-center justify-center gap-6">
                        {/* Before score */}
                        <div className="text-center">
                          <div className="relative mx-auto h-24 w-24">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                              <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
                              <circle cx="80" cy="80" r="70" fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (animatedScore / 100) * circumference} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className={`text-2xl font-black ${scoreColor === "green" ? "text-green-600" : scoreColor === "yellow" ? "text-yellow-600" : "text-red-600"}`}>{animatedScore}</span>
                            </div>
                          </div>
                          <span className="mt-1 block text-xs font-medium text-zinc-500">Before</span>
                        </div>

                        <span className="text-2xl text-zinc-300 dark:text-zinc-600">→</span>

                        {/* After score */}
                        <div className="text-center">
                          <div className="relative mx-auto h-24 w-24">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                              <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
                              <circle cx="80" cy="80" r="70" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (animatedHumanizedScore / 100) * circumference} className="animate-score-ring" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-green-600 dark:text-green-400">{animatedHumanizedScore}</span>
                            </div>
                          </div>
                          <span className="mt-1 block text-xs font-medium text-zinc-500">After</span>
                        </div>
                      </div>

                      {/* Improvement badge */}
                      {analysisResult && humanizedScore.overall < analysisResult.overall && (
                        <div className="mt-4 text-center">
                          <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            ↓ Reduced by {analysisResult.overall - humanizedScore.overall} points • {humanizeResult.totalChanges} changes made
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Humanized text output */}
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Humanized Text</h3>
                        <button
                          onClick={handleCopyHumanized}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          {analyzerCopied ? "✅ Copied!" : "📋 Copy"}
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-200">
                        {humanizeResult.text}
                      </div>
                    </div>

                    {/* Changes log */}
                    {humanizeResult.changes.length > 0 && (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <details>
                          <summary className="cursor-pointer text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            🔄 Changes Made ({humanizeResult.totalChanges})
                          </summary>
                          <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                            {humanizeResult.changes.map((change, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800/50">
                                <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 font-mono text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  {change.type}
                                </span>
                                <div className="flex-1">
                                  <span className="text-red-500 line-through">{change.original}</span>
                                  <span className="mx-1 text-zinc-400">→</span>
                                  <span className="text-green-600">{change.replacement}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* ═══ Platform Formatter ═══ */}
                    <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-5 dark:border-violet-900 dark:from-violet-950/20 dark:to-zinc-900">
                      <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        📱 Format for Platform
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
                          const meta = PLATFORM_META[p];
                          const isActive = selectedPlatform === p;
                          return (
                            <button
                              key={p}
                              onClick={() => handlePlatformSelect(p)}
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                isActive
                                  ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:bg-violet-900/30"
                              }`}
                            >
                              {meta.icon} {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Platform formatted output */}
                    {platformResult && (
                      <div className="animate-fade-in-up rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {PLATFORM_META[platformResult.platform].icon} {PLATFORM_META[platformResult.platform].label} Format
                            </h3>
                            {platformResult.charLimit && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                platformResult.isOverLimit
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : platformResult.charCount > platformResult.charLimit * 0.9
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              }`}>
                                {platformResult.charCount}{platformResult.charLimit ? `/${platformResult.charLimit}` : ""} chars
                              </span>
                            )}
                            {!platformResult.charLimit && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {platformResult.charCount} chars
                              </span>
                            )}
                          </div>
                          <button
                            onClick={handleCopyPlatform}
                            className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                          >
                            {platformCopied ? "✅ Copied!" : "📋 Copy"}
                          </button>
                        </div>

                        {/* Formatted text preview */}
                        <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-200">
                          {platformResult.text}
                        </div>

                        {/* Platform tips */}
                        {platformResult.tips.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {platformResult.tips.map((tip, i) => (
                              <p key={i} className="text-xs text-zinc-500 dark:text-zinc-400">
                                💡 {tip}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Metric Breakdown */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">Score Breakdown</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <MetricCard title="Zipf Conformity" metric={analysisResult.metrics.zipfConformity} delay="delay-100" />
                    <MetricCard title="AI Phrases" metric={analysisResult.metrics.aiPhrases} delay="delay-150" />
                    <MetricCard title="Punctuation Entropy" metric={analysisResult.metrics.punctuationEntropy} delay="delay-200" />
                    <MetricCard title="Sentence Variance" metric={analysisResult.metrics.sentenceVariance} delay="delay-250" />
                    <MetricCard title="Sentence Skewness" metric={analysisResult.metrics.sentenceSkewness} delay="delay-300" />
                    <MetricCard title="Starter Repetition" metric={analysisResult.metrics.starterRepetition} delay="delay-350" />
                    <MetricCard title="Hapax Ratio" metric={analysisResult.metrics.hapaxRatio} delay="delay-400" />
                    <MetricCard title="Paragraph Uniformity" metric={analysisResult.metrics.paragraphUniformity} delay="delay-450" />
                    <MetricCard title="Vocabulary Richness" metric={analysisResult.metrics.vocabularyRichness} delay="delay-500" />
                    <MetricCard title="Burstiness" metric={analysisResult.metrics.burstiness} delay="delay-550" />
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

        {/* ═══════════════ READABILITY TAB ═══════════════ */}
        {activeTab === "readability" && (
          <div className="space-y-6">
            {/* Input */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="readability-input" className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Paste your text
                </label>
                <button onClick={handleReadabilityClear} className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                  Clear
                </button>
              </div>
              <textarea
                id="readability-input"
                ref={readabilityTextareaRef}
                value={readabilityInput}
                onChange={handleReadabilityInputChange}
                onPaste={handleReadabilityPaste}
                placeholder="Paste any text to analyze readability, grade level, and reading difficulty..."
                rows={6}
                maxLength={100000}
                className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-[11px] ${readabilityInput.length === 0 ? "text-zinc-400" : readabilityInput.length < 50 ? "text-yellow-500" : readabilityInput.length > 50000 ? "text-red-500" : "text-zinc-400"}`}>
                  {readabilityInput.length === 0 ? "" : readabilityInput.length < 50 ? `⚠️ ${readabilityInput.length}/50 min chars` : `${readabilityInput.length.toLocaleString()} characters`}
                </span>
              </div>
              {readabilityError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  ⚠️ {readabilityError}
                </div>
              )}
              <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
                💡 Paste your text — auto-analyzes readability on paste!
              </p>
            </div>

            {/* Results */}
            {readabilityResult && (
              <>
                {/* Score Circle + Grade */}
                <div className="animate-pulse-once rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="relative mx-auto mb-4 h-48 w-48">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
                      <circle
                        cx="80" cy="80" r="70" fill="none"
                        stroke={readabilityResult.gradeColor === "green" ? "#22c55e" : readabilityResult.gradeColor === "yellow" ? "#eab308" : readabilityResult.gradeColor === "orange" ? "#f97316" : "#ef4444"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={2 * Math.PI * 70 - (Math.max(0, readabilityResult.fleschScore) / 100) * 2 * Math.PI * 70}
                        className="animate-score-ring"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-black ${readabilityResult.gradeColor === "green" ? "text-green-600 dark:text-green-400" : readabilityResult.gradeColor === "yellow" ? "text-yellow-600 dark:text-yellow-400" : readabilityResult.gradeColor === "orange" ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"}`}>
                        {readabilityResult.grade}
                      </span>
                      <span className="text-lg font-bold text-zinc-700 dark:text-zinc-300">{readabilityResult.fleschScore}</span>
                      <span className="text-[10px] font-medium text-zinc-400">Flesch Score</span>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${readabilityResult.gradeColor === "green" ? "text-green-700 dark:text-green-400" : readabilityResult.gradeColor === "yellow" ? "text-yellow-700 dark:text-yellow-400" : readabilityResult.gradeColor === "orange" ? "text-orange-700 dark:text-orange-400" : "text-red-700 dark:text-red-400"}`}>
                    {readabilityResult.readingLevel}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    🎯 {readabilityResult.audience}
                  </p>

                  {/* Stats bar */}
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{readabilityResult.stats.wordCount} words</span>
                    <span>{readabilityResult.stats.sentenceCount} sentences</span>
                    <span>Avg {readabilityResult.stats.avgWordsPerSentence} words/sentence</span>
                    <span>{readabilityResult.stats.readingTimeMin} min read</span>
                    <span>{readabilityResult.stats.speakingTimeMin} min speak</span>
                  </div>

                  {/* Share button */}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleCopyReadability}
                      className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {readabilityCopied ? "✅ Copied!" : "📋 Share Readability Report"}
                    </button>
                  </div>
                </div>

                {/* Content Quality Stats */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">Content Quality</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800/50">
                      <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100">{readabilityResult.stats.avgSyllablesPerWord}</span>
                      <span className="text-[10px] text-zinc-500">Syllables/Word</span>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800/50">
                      <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100">{readabilityResult.stats.avgWordLength}</span>
                      <span className="text-[10px] text-zinc-500">Avg Word Length</span>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${readabilityResult.stats.complexWordRatio > 0.15 ? "bg-orange-50 dark:bg-orange-950/20" : "bg-zinc-50 dark:bg-zinc-800/50"}`}>
                      <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100">{Math.round(readabilityResult.stats.complexWordRatio * 100)}%</span>
                      <span className="text-[10px] text-zinc-500">Complex Words</span>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${readabilityResult.stats.longSentenceRatio > 0.3 ? "bg-orange-50 dark:bg-orange-950/20" : "bg-zinc-50 dark:bg-zinc-800/50"}`}>
                      <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100">{readabilityResult.stats.longSentenceCount}</span>
                      <span className="text-[10px] text-zinc-500">Long Sentences (25+)</span>
                    </div>
                  </div>
                </div>

                {/* Grade Level Metrics */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">Grade Level Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(readabilityResult.metrics).map(([key, metric]) => (
                      <div key={key} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${
                          metric.value <= 6 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : metric.value <= 10 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : metric.value <= 13 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {metric.label}
                        </span>
                        <span className="flex-1 text-xs text-zinc-500 dark:text-zinc-400">{metric.description}</span>
                        <span className={`text-xs font-medium ${
                          metric.value <= 6 ? "text-green-600 dark:text-green-400"
                          : metric.value <= 10 ? "text-yellow-600 dark:text-yellow-400"
                          : metric.value <= 13 ? "text-orange-600 dark:text-orange-400"
                          : "text-red-600 dark:text-red-400"
                        }`}>
                          {metric.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                {readabilityResult.tips.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {readabilityResult.fleschScore >= 60 ? "✅ Looking Good" : "💡 Tips to Improve Readability"}
                    </h3>
                    <ul className="space-y-2">
                      {readabilityResult.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <span className="mt-0.5 shrink-0">{readabilityResult.fleschScore >= 60 ? "👍" : "→"}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sentence Analysis */}
                {readabilityResult.sentenceAnalysis.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">Sentence Analysis</h3>
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {readabilityResult.sentenceAnalysis.map((sa) => (
                        <div
                          key={sa.index}
                          className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                            sa.isLong ? "bg-orange-50 dark:bg-orange-950/20" : "bg-zinc-50 dark:bg-zinc-800/50"
                          }`}
                        >
                          <span className="shrink-0 font-mono text-zinc-400 dark:text-zinc-500">{sa.index}.</span>
                          <span className="flex-1 text-zinc-700 dark:text-zinc-300">{sa.text}</span>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className={`text-[10px] font-medium ${sa.isLong ? "text-orange-600 dark:text-orange-400" : "text-zinc-400"}`}>
                              {sa.wordCount}w
                            </span>
                            {sa.complexWords.length > 0 && (
                              <span className="rounded bg-yellow-100 px-1 py-0.5 text-[9px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" title={`Complex: ${sa.complexWords.join(", ")}`}>
                                {sa.complexWords.length}⚡
                              </span>
                            )}
                          </div>
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
                q: "What does the Humanize feature do?",
                a: "After analyzing your text, click \"Humanize This Text\" to automatically rewrite AI-sounding patterns. It adds contractions, replaces AI clichés with natural alternatives, removes hedging language, simplifies formal phrasing, and breaks long uniform sentences. All processing runs locally in your browser.",
              },
              {
                q: "How does the AI Analyzer work?",
                a: "It uses 10 heuristic metrics inspired by academic research to detect patterns typical of AI-generated text: Zipf's law conformity, AI phrase detection, punctuation entropy, sentence variance, sentence skewness, starter repetition, hapax ratio, paragraph uniformity, vocabulary richness, and burstiness. All analysis runs in your browser — no data is sent anywhere.",
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
