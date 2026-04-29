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
import { analyzeTone, TONE_META } from "@/lib/toneAnalyzer";
import type { ToneResult } from "@/lib/toneAnalyzer";
import { generateScript, SCRIPT_ROLES } from "@/lib/scriptGenerator";
import type { ScriptRole, GeneratedScript } from "@/lib/scriptGenerator";
import { aiClient, fetchModels, setModel, getModel } from "@/lib/aiClient";
import type { AISource, ModelInfo } from "@/lib/aiClient";
import { REWRITE_STYLES } from "@/lib/paraphraser";
import type { RewriteStyle } from "@/lib/paraphraser";
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

type Tab = "fix" | "analyze" | "readability" | "tone" | "script" | "rewrite";

export default function Home() {
  // Tab
  const [activeTab, setActiveTab] = useState<Tab>("fix");

  // AI status
  const [aiSource, setAiSource] = useState<AISource>("heuristic");
  const [aiChecking, setAiChecking] = useState(false);
  const [aiModels, setAiModels] = useState<ModelInfo[]>([]);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [selectedModel, setSelectedModel] = useState("thudm/glm-5.1");
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Fetch available models on mount
  useEffect(() => {
    fetchModels().then(({ models, configured }) => {
      setAiModels(models);
      setAiConfigured(configured);
      if (configured) setAiSource("ai");
    });
  }, []);

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

  // Tone Detector state
  const [toneInput, setToneInput] = useState("");
  const [toneResult, setToneResult] = useState<ToneResult | null>(null);
  const [toneError, setToneError] = useState<string | null>(null);
  const [toneCopied, setToneCopied] = useState(false);
  const toneTextareaRef = useRef<HTMLTextAreaElement>(null);
  const toneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Script Generator state
  const [scriptRole, setScriptRole] = useState<ScriptRole>("interviewer");
  const [scriptContext, setScriptContext] = useState("");
  const [scriptResult, setScriptResult] = useState<GeneratedScript | null>(null);
  const [scriptCopied, setScriptCopied] = useState(false);

  // Rewrite state
  const [rewriteInput, setRewriteInput] = useState("");
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>("casual");
  const [rewriteResult, setRewriteResult] = useState<{ rewritten: string; style: RewriteStyle; source: string } | null>(null);
  const [rewriteCopied, setRewriteCopied] = useState(false);

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

  const runAnalysis = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setAnalyzerError(null);
    setAiChecking(true);
    try {
      const { source, score } = await aiClient.analyze(text);
      setAiSource(source);
      setAnalysisResult(score);
    } catch (err) {
      setAnalyzerError("Analysis failed — something went wrong. Try shorter or different text.");
      console.error("analyzeText error:", err);
    } finally {
      setAiChecking(false);
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

  const handleHumanize = useCallback(async () => {
    if (!analyzerInput.trim()) return;
    setAnalyzerError(null);
    setAiChecking(true);
    try {
      const { source, result } = await aiClient.humanize(analyzerInput);
      setAiSource(source);
      setHumanizeResult(result);
      // Re-analyze the humanized text (heuristic for speed)
      const score = analyzeText(result.text);
      setHumanizedScore(score);
      setSelectedPlatform(null);
      setPlatformResult(null);
    } catch (err) {
      setAnalyzerError("Humanization failed — try different text.");
      console.error("humanizeText error:", err);
    } finally {
      setAiChecking(false);
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

  // ─── Tone Detector logic ───────────────────────────────────────────

  const runToneAnalysis = useCallback(async (text: string) => {
    try {
      setToneError(null);
      setAiChecking(true);
      const { source, result } = await aiClient.tone(text);
      setAiSource(source);
      setToneResult(result);
    } catch (err) {
      setToneError("Tone analysis failed — try different text.");
      console.error("analyzeTone error:", err);
    } finally {
      setAiChecking(false);
    }
  }, []);

  const handleToneInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setToneInput(e.target.value);
    if (toneDebounceRef.current) clearTimeout(toneDebounceRef.current);
    toneDebounceRef.current = setTimeout(() => {
      const val = e.target.value.trim();
      if (val.length >= 20) runToneAnalysis(val);
    }, 300);
  }, [runToneAnalysis]);

  const handleTonePaste = useCallback(() => {
    requestAnimationFrame(() => {
      const pastedText = toneTextareaRef.current?.value ?? "";
      if (pastedText.trim()) runToneAnalysis(pastedText);
    });
  }, [runToneAnalysis]);

  const handleToneClear = useCallback(() => {
    setToneInput("");
    setToneResult(null);
    setToneError(null);
    if (toneDebounceRef.current) clearTimeout(toneDebounceRef.current);
  }, []);

  const handleCopyTone = useCallback(async () => {
    if (!toneResult) return;
    const lines = toneResult.tones.slice(0, 4).map((t) => `${t.emoji} ${t.label}: ${t.score}%`);
    const summary = `🎭 Tone Analysis\n${lines.join("\n")}\nIntensity: ${toneResult.emotionalIntensity}%\nWords: ${toneResult.stats.wordCount} | Sentences: ${toneResult.stats.sentenceCount}\nAnalyzed on AddFullStop`;
    const ok = await copyToClipboard(summary);
    if (ok) { setToneCopied(true); setTimeout(() => setToneCopied(false), 2000); }
  }, [toneResult]);

  // ─── Script Generator logic ─────────────────────────────────────────

  const handleGenerateScript = useCallback(async () => {
    setAiChecking(true);
    try {
      const { source, result } = await aiClient.script(scriptRole, scriptContext);
      setAiSource(source);
      setScriptResult(result);
    } finally {
      setAiChecking(false);
    }
  }, [scriptRole, scriptContext]);

  // ─── Rewrite logic ──────────────────────────────────────────────────

  const handleRewrite = useCallback(async () => {
    if (!rewriteInput.trim()) return;
    setAiChecking(true);
    try {
      const { source, result } = await aiClient.rewrite(rewriteInput, rewriteStyle);
      setAiSource(source);
      setRewriteResult({ rewritten: result.rewritten, style: result.style, source });
    } finally {
      setAiChecking(false);
    }
  }, [rewriteInput, rewriteStyle]);

  const handleCopyRewrite = useCallback(async () => {
    if (!rewriteResult) return;
    const ok = await copyToClipboard(rewriteResult.rewritten);
    if (ok) { setRewriteCopied(true); setTimeout(() => setRewriteCopied(false), 2000); }
  }, [rewriteResult]);

  const handleClearRewrite = useCallback(() => {
    setRewriteInput("");
    setRewriteResult(null);
  }, []);

  const handleCopyScript = useCallback(async () => {
    if (!scriptResult) return;
    const lines: string[] = [];
    lines.push(`${scriptResult.sections[0]?.icon || "📝"} Speaking Script — ${SCRIPT_ROLES.find(r => r.role === scriptResult.role)?.label}`);
    lines.push(`Context: ${scriptResult.context}`);
    lines.push(`Estimated Duration: ${scriptResult.duration}`);
    lines.push("");
    for (const section of scriptResult.sections) {
      lines.push(`${section.icon} ${section.title}`);
      lines.push(section.content);
      if (section.bullets) {
        for (const b of section.bullets) lines.push(`  • ${b}`);
      }
      lines.push("");
    }
    lines.push("✅ Preparation");
    for (const p of scriptResult.preparation) lines.push(`  • ${p}`);
    lines.push("");
    lines.push("Key Phrases");
    for (const p of scriptResult.keyPhrases) lines.push(`  ${p}`);
    const ok = await copyToClipboard(lines.join("\n"));
    if (ok) { setScriptCopied(true); setTimeout(() => setScriptCopied(false), 2000); }
  }, [scriptResult, scriptRole]);

  const handleDownloadScript = useCallback(() => {
    if (!scriptResult) return;
    const roleMeta = SCRIPT_ROLES.find(r => r.role === scriptResult.role);
    const lines: string[] = [];
    lines.push(`${roleMeta?.emoji} ${roleMeta?.label} — Speaking Script`);
    lines.push(`Generated by AddFullStop`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`Context: ${scriptResult.context}`);
    lines.push(`Duration: ${scriptResult.duration}`);
    lines.push("═".repeat(50));
    lines.push("");
    for (const section of scriptResult.sections) {
      lines.push(`${section.icon} ${section.title}`);
      lines.push("─".repeat(40));
      lines.push(section.content);
      if (section.bullets) {
        lines.push("");
        for (const b of section.bullets) lines.push(`  • ${b}`);
      }
      lines.push("");
    }
    lines.push("═".repeat(50));
    lines.push("✅ Preparation Checklist");
    for (const p of scriptResult.preparation) lines.push(`  ☐ ${p}`);
    lines.push("");
    lines.push("👍 Do's");
    for (const d of scriptResult.dosAndDonts.dos) lines.push(`  • ${d}`);
    lines.push("");
    lines.push("👎 Don'ts");
    for (const d of scriptResult.dosAndDonts.donts) lines.push(`  • ${d}`);
    lines.push("");
    lines.push("💬 Key Phrases");
    for (const p of scriptResult.keyPhrases) lines.push(`  ${p}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${scriptResult.role}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [scriptResult]);

  // Close model picker on outside click
  useEffect(() => {
    if (!showModelPicker) return;
    const handler = () => setShowModelPicker(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showModelPicker]);

  // ─── Check icon helper ─────────────────────────────────────────────

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-green-500">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );

  // ─── Score ring SVG ───────────────────────────────────────────────

  const scoreColor = analysisResult?.color ?? "green";
  const ringColor = scoreColor === "green" ? "#22c55e" : scoreColor === "yellow" ? "#eab308" : "#ef4444";
  const circumference = 2 * Math.PI * 70; // radius=70
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // ─── Metric bar helper ────────────────────────────────────────────

  const MetricCard = ({ title, metric, delay }: { title: string; metric: { score: number; label: string; description: string }; delay: string }) => (
    <div className={`animate-fade-in-up ${delay} glass-subtle rounded-xl p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{title}</span>
        <span className={`text-sm font-bold ${metric.score < 30 ? "text-green-600 dark:text-green-400" : metric.score < 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
          {metric.score}%
        </span>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${metric.score < 30 ? "bg-green-500" : metric.score < 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${metric.score}%` }}
        />
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{metric.label}</p>
    </div>
  );

  return (
    <>
      {/* Print-only report header — hidden on screen, visible in PDF */}
      <div className="print-report-header" style={{ display: "none" }}>
        <h1>AddFullStop — Text Analysis Report</h1>
        <p>Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} • addfullstop.vercel.app</p>
      </div>

      <AdBanner slot="horizontal" data-print="hide" />

      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-16">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Clean Up ChatGPT Text
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base">
            Fix trailing spaces, add periods, remove emojis — check if text sounds AI-generated or analyze its tone.
            All processing happens in your browser.
          </p>
        </div>

        {/* AI status + model picker */}
        <div className="mb-2 flex justify-center">
          <div className="flex items-center gap-2">
            {aiChecking ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/></svg>
                AI processing...
              </span>
            ) : aiConfigured && aiSource === "ai" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AI-powered
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium opacity-40">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Heuristic mode (no API key)
              </span>
            )}

            {/* Model picker */}
            {aiConfigured && aiModels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium opacity-60 hover:opacity-100 transition"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.846 1.846a1.5 1.5 0 01-1.06.44H7.906a1.5 1.5 0 01-1.06-.44L5 14.5m14 0V5.846a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 5.846V14.5"/></svg>
                  {aiModels.find(m => m.id === selectedModel)?.label || "GLM-5.1"}
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                {showModelPicker && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 glass rounded-xl p-1 min-w-[200px] shadow-xl">
                    {aiModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setModel(m.id);
                          setShowModelPicker(false);
                        }}
                        className={`w-full text-left rounded-lg px-3 py-2 text-xs transition flex items-center justify-between ${
                          selectedModel === m.id
                            ? "bg-violet-500/20 font-bold"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <span>
                          <span className="font-semibold">{m.label}</span>
                          <span className="ml-1.5 opacity-40">{m.provider}</span>
                        </span>
                        {m.tier === "fast" && (
                          <span className="text-[9px] rounded-full bg-blue-500/20 px-1.5 py-0.5 opacity-60">fast</span>
                        )}
                        {m.tier === "smart" && (
                          <span className="text-[9px] rounded-full bg-amber-500/20 px-1.5 py-0.5 opacity-60">smart</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mb-6 flex justify-center">
          <div className="glass-subtle inline-flex rounded-xl p-1">
            <button
              onClick={() => setActiveTab("fix")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "fix"
                  ? "bg-white/60 font-semibold shadow-sm backdrop-blur-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              ✏️ Fix Text
            </button>
            <button
              onClick={() => setActiveTab("analyze")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "analyze"
                  ? "bg-white/60 font-semibold shadow-sm backdrop-blur-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              🔍 AI Analyzer
            </button>
            <button
              onClick={() => setActiveTab("readability")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "readability"
                  ? "bg-white/60 font-semibold shadow-sm backdrop-blur-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              📊 Readability
            </button>
            <button
              onClick={() => setActiveTab("tone")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "tone"
                  ? "bg-white/60 font-semibold shadow-sm backdrop-blur-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              🎭 Tone
            </button>
            <button
              onClick={() => setActiveTab("script")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "script"
                  ? "bg-white/60 font-semibold shadow-sm backdrop-blur-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              🎬 Script
            </button>
            <button
              onClick={() => setActiveTab("rewrite")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "rewrite"
                  ? "bg-white/60 font-semibold shadow-sm backdrop-blur-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              🔄 Rewrite
            </button>
          </div>
        </div>

        {/* ═══════════════ FIX TEXT TAB ═══════════════ */}
        {activeTab === "fix" && (
          <div className="glass rounded-2xl p-4 sm:p-6">
            {/* Input */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="input-text" className="text-xs font-medium uppercase tracking-wide">
                  Input
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-white/20 bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm transition hover:bg-white/40"
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
                className="w-full resize-y rounded-lg border border-white/30 bg-white/40 p-4 text-sm leading-relaxed outline-none backdrop-blur-sm transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 sm:rows-10"
              />
            </div>

            {/* Options */}
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="glass-subtle flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 transition select-none hover:bg-white/50">
                <input type="checkbox" checked={fixTrailing} onChange={(e) => setFixTrailing(e.target.checked)} className="h-4 w-4 rounded border-white/30 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm font-medium">Add periods (fix trailing spaces)</span>
              </label>
              <label className="glass-subtle flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 transition select-none hover:bg-white/50">
                <input type="checkbox" checked={removeEmojis} onChange={(e) => setRemoveEmojis(e.target.checked)} className="h-4 w-4 rounded border-white/30 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm font-medium">Remove emojis</span>
              </label>
              <label className="glass-subtle flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 transition select-none hover:bg-white/50">
                <input type="checkbox" checked={addHR} onChange={(e) => setAddHR(e.target.checked)} className="h-4 w-4 rounded border-white/30 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm font-medium"># → --- (horizontal rule before headings)</span>
              </label>
            </div>

            {/* Actions */}
            <div className="mb-4 flex flex-wrap gap-2 sm:gap-3">
              <button onClick={handleProcess} disabled={!input.trim() || (!fixTrailing && !removeEmojis && !addHR)} className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
                Process
              </button>
              <button onClick={handleCopy} disabled={!output} className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
                {copied ? "Copied!" : "Copy Output"}
              </button>
              <button onClick={handleDownload} disabled={!output} className="rounded-lg border border-white/20 bg-white/20 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-40">
                Save .txt
              </button>
              <button onClick={handleClear} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm backdrop-blur-sm transition hover:bg-white/30">
                Clear
              </button>
            </div>

            {/* Stats */}
            {hasResults && (
              <div role="status" className="mb-4 flex flex-wrap justify-center gap-4 rounded-lg bg-violet-500/5 px-4 py-2.5 text-sm text-violet-700 dark:text-violet-300">
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
              <label htmlFor="output-text" className="mb-2 block text-xs font-medium uppercase tracking-wide opacity-60">
                Output
              </label>
              <textarea
                id="output-text"
                value={output}
                readOnly
                placeholder="Processed text will appear here..."
                rows={8}
                className="w-full resize-y rounded-lg border border-white/30 bg-white/40 p-4 text-sm leading-relaxed outline-none backdrop-blur-sm sm:rows-10"
              />
            </div>
          </div>
        )}

        {/* ═══════════════ AI ANALYZER TAB ═══════════════ */}
        {activeTab === "analyze" && (
          <div className="space-y-6">
            {/* Input */}
            <div className="glass rounded-2xl p-4 sm:p-6">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="analyzer-input" className="text-xs font-medium uppercase tracking-wide">
                  Paste your text
                </label>
                <button onClick={handleAnalyzerClear} className="rounded-md border border-white/20 bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm transition hover:bg-white/40">
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
                className="w-full resize-y rounded-lg border border-white/30 bg-white/40 p-4 text-sm leading-relaxed outline-none backdrop-blur-sm transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
              {/* Character counter */}
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-[11px] ${
                  analyzerInput.length === 0 ? "opacity-40"
                    : analyzerInput.length < 50 ? "text-yellow-500"
                    : analyzerInput.length > 50000 ? "text-red-500"
                    : "opacity-40"
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
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Analyze Text
              </button>
              <p className="mt-2 text-center text-xs opacity-50">
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
                        : w.type === "non_english" ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-400"
                        : w.type === "repeated_text" ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-400"
                        : w.type === "too_long" ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-400"
                        : "border-white/20 bg-white/10 text-zinc-600 dark:text-zinc-400"
                      }`}>
                        {w.type === "code_detected" ? "🖥️" : w.type === "non_english" ? "🌐" : w.type === "repeated_text" ? "🔁" : w.type === "too_long" ? "📏" : "⚠️"} {w.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Score Circle */}
                <div className="glass animate-pulse-once rounded-2xl p-6 text-center">
                  <div className="relative mx-auto mb-4 h-48 w-48">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="opacity-10" />
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
                      <span className="text-xs font-medium opacity-70">% AI Score</span>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${scoreColor === "green" ? "text-green-700 dark:text-green-400" : scoreColor === "yellow" ? "text-yellow-700 dark:text-yellow-400" : "text-red-700 dark:text-red-400"}`}>
                    {analysisResult.label}
                  </p>

                  {/* Stats bar */}
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs opacity-70">
                    <span>{analysisResult.stats.wordCount} words</span>
                    <span>{analysisResult.stats.sentenceCount} sentences</span>
                    <span>{analysisResult.stats.readingTimeMin} min read</span>
                    <span>Avg {analysisResult.stats.avgSentenceLength} words/sentence</span>
                  </div>

                  {/* Share + Humanize + Export buttons */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={handleShareScore}
                      className="rounded-lg border border-white/20 bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/40"
                    >
                      {analyzerCopied ? "✅ Copied!" : "📋 Share your score"}
                    </button>
                    <button
                      onClick={handleHumanize}
                      disabled={aiChecking}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {aiChecking ? "Humanizing with AI..." : "✨ Humanize This Text"}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="rounded-lg border border-white/20 bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/40 no-print"
                    >
                      📄 Export PDF Report
                    </button>
                  </div>
                </div>

                {/* ═══ Humanize Results ═══ */}
                {humanizeResult && humanizedScore && (
                  <>
                    {/* Score comparison */}
                    <div className="glass animate-fade-in-up rounded-2xl p-6">
                      <h3 className="mb-4 text-center text-sm font-bold">
                        Before → After Humanization
                      </h3>
                      <div className="flex items-center justify-center gap-6">
                        {/* Before score */}
                        <div className="text-center">
                          <div className="relative mx-auto h-24 w-24">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                              <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="opacity-10" />
                              <circle cx="80" cy="80" r="70" fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (animatedScore / 100) * circumference} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className={`text-2xl font-black ${scoreColor === "green" ? "text-green-600" : scoreColor === "yellow" ? "text-yellow-600" : "text-red-600"}`}>{animatedScore}</span>
                            </div>
                          </div>
                          <span className="mt-1 block text-xs font-medium opacity-60">Before</span>
                        </div>

                        <span className="text-2xl opacity-30">→</span>

                        {/* After score */}
                        <div className="text-center">
                          <div className="relative mx-auto h-24 w-24">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                              <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="opacity-10" />
                              <circle cx="80" cy="80" r="70" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (animatedHumanizedScore / 100) * circumference} className="animate-score-ring" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-green-600 dark:text-green-400">{animatedHumanizedScore}</span>
                            </div>
                          </div>
                          <span className="mt-1 block text-xs font-medium opacity-60">After</span>
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
                    <div className="glass rounded-2xl p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold">Humanized Text</h3>
                        <button
                          onClick={handleCopyHumanized}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          {analyzerCopied ? "✅ Copied!" : "📋 Copy"}
                        </button>
                      </div>
                      <div className="glass-subtle max-h-64 overflow-y-auto rounded-lg p-4 text-sm leading-relaxed">
                        {humanizeResult.text}
                      </div>
                    </div>

                    {/* Changes log */}
                    {humanizeResult.changes.length > 0 && (
                      <div className="glass rounded-2xl p-5">
                        <details>
                          <summary className="cursor-pointer text-sm font-bold">
                            🔄 Changes Made ({humanizeResult.totalChanges})
                          </summary>
                          <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                            {humanizeResult.changes.map((change, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-md bg-white/10 px-3 py-2 text-xs">
                                <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 font-mono text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                  {change.type}
                                </span>
                                <div className="flex-1">
                                  <span className="text-red-500 line-through">{change.original}</span>
                                  <span className="mx-1 opacity-40">→</span>
                                  <span className="text-green-600">{change.replacement}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* ═══ Platform Formatter ═══ */}
                    <div className="glass rounded-2xl p-5">
                      <h3 className="mb-3 text-sm font-bold">
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
                                  : "border-white/20 bg-white/20 text-zinc-700 hover:border-violet-300 hover:bg-violet-50/50 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:bg-violet-900/30"
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
                      <div className="glass animate-fade-in-up rounded-2xl p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold">
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
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
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
                        <div className="glass-subtle max-h-72 overflow-y-auto rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                          {platformResult.text}
                        </div>

                        {/* Platform tips */}
                        {platformResult.tips.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {platformResult.tips.map((tip, i) => (
                              <p key={i} className="text-xs opacity-60">
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
                  <h3 className="mb-3 text-sm font-bold">Score Breakdown</h3>
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
                  <div className="glass rounded-2xl p-5">
                    <h3 className="mb-3 text-sm font-bold">
                      {analysisResult.overall < 30 ? "✅ Looking Good" : "💡 Tips to Sound More Human"}
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm opacity-80">
                          <span className="mt-0.5 shrink-0">{analysisResult.overall < 30 ? "👍" : "→"}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Line-by-line */}
                {analysisResult.lineScores.length > 0 && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="mb-3 text-sm font-bold">Line-by-Line Analysis</h3>
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {analysisResult.lineScores.map((ls) => (
                        <div
                          key={ls.line}
                          className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                            ls.score < 20 ? "line-highlight-low" : ls.score < 50 ? "line-highlight-medium" : "line-highlight-high"
                          }`}
                        >
                          <span className="shrink-0 font-mono opacity-40">{ls.line}.</span>
                          <span className="flex-1">{ls.text}</span>
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
            <div className="glass rounded-2xl p-4 sm:p-6">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="readability-input" className="text-xs font-medium uppercase tracking-wide">
                  Paste your text
                </label>
                <button onClick={handleReadabilityClear} className="rounded-md border border-white/20 bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm transition hover:bg-white/40">
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
                className="w-full resize-y rounded-lg border border-white/30 bg-white/40 p-4 text-sm leading-relaxed outline-none backdrop-blur-sm transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-[11px] ${readabilityInput.length === 0 ? "opacity-40" : readabilityInput.length < 50 ? "text-yellow-500" : readabilityInput.length > 50000 ? "text-red-500" : "opacity-40"}`}>
                  {readabilityInput.length === 0 ? "" : readabilityInput.length < 50 ? `⚠️ ${readabilityInput.length}/50 min chars` : `${readabilityInput.length.toLocaleString()} characters`}
                </span>
              </div>
              {readabilityError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  ⚠️ {readabilityError}
                </div>
              )}
              <p className="mt-2 text-center text-xs opacity-50">
                💡 Paste your text — auto-analyzes readability on paste!
              </p>
            </div>

            {/* Results */}
            {readabilityResult && (
              <>
                {/* Score Circle + Grade */}
                <div className="glass animate-pulse-once rounded-2xl p-6 text-center">
                  <div className="relative mx-auto mb-4 h-48 w-48">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="opacity-10" />
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
                      <span className="text-lg font-bold">{readabilityResult.fleschScore}</span>
                      <span className="text-[10px] font-medium opacity-50">Flesch Score</span>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${readabilityResult.gradeColor === "green" ? "text-green-700 dark:text-green-400" : readabilityResult.gradeColor === "yellow" ? "text-yellow-700 dark:text-yellow-400" : readabilityResult.gradeColor === "orange" ? "text-orange-700 dark:text-orange-400" : "text-red-700 dark:text-red-400"}`}>
                    {readabilityResult.readingLevel}
                  </p>
                  <p className="mt-1 text-sm opacity-70">
                    🎯 {readabilityResult.audience}
                  </p>

                  {/* Stats bar */}
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs opacity-70">
                    <span>{readabilityResult.stats.wordCount} words</span>
                    <span>{readabilityResult.stats.sentenceCount} sentences</span>
                    <span>Avg {readabilityResult.stats.avgWordsPerSentence} words/sentence</span>
                    <span>{readabilityResult.stats.readingTimeMin} min read</span>
                    <span>{readabilityResult.stats.speakingTimeMin} min speak</span>
                  </div>

                  {/* Share button */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={handleCopyReadability}
                      className="rounded-lg border border-white/20 bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/40"
                    >
                      {readabilityCopied ? "✅ Copied!" : "📋 Share Readability Report"}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="rounded-lg border border-white/20 bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/40 no-print"
                    >
                      📄 Export PDF Report
                    </button>
                  </div>
                </div>

                {/* Content Quality Stats */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="mb-3 text-sm font-bold">Content Quality</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="glass-subtle rounded-lg p-3 text-center">
                      <span className="block text-lg font-bold">{readabilityResult.stats.avgSyllablesPerWord}</span>
                      <span className="text-[10px] opacity-50">Syllables/Word</span>
                    </div>
                    <div className="glass-subtle rounded-lg p-3 text-center">
                      <span className="block text-lg font-bold">{readabilityResult.stats.avgWordLength}</span>
                      <span className="text-[10px] opacity-50">Avg Word Length</span>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${readabilityResult.stats.complexWordRatio > 0.15 ? "bg-orange-100/50 dark:bg-orange-950/20" : "bg-white/10"}`}>
                      <span className="block text-lg font-bold">{Math.round(readabilityResult.stats.complexWordRatio * 100)}%</span>
                      <span className="text-[10px] opacity-50">Complex Words</span>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${readabilityResult.stats.longSentenceRatio > 0.3 ? "bg-orange-100/50 dark:bg-orange-950/20" : "bg-white/10"}`}>
                      <span className="block text-lg font-bold">{readabilityResult.stats.longSentenceCount}</span>
                      <span className="text-[10px] opacity-50">Long Sentences (25+)</span>
                    </div>
                  </div>
                </div>

                {/* Grade Level Metrics */}
                <div>
                  <h3 className="mb-3 text-sm font-bold">Grade Level Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(readabilityResult.metrics).map(([key, metric]) => (
                      <div key={key} className="glass-subtle flex items-center gap-3 rounded-lg px-4 py-3">
                        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${
                          metric.value <= 6 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : metric.value <= 10 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : metric.value <= 13 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {metric.label}
                        </span>
                        <span className="flex-1 text-xs opacity-60">{metric.description}</span>
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
                  <div className="glass rounded-2xl p-5">
                    <h3 className="mb-3 text-sm font-bold">
                      {readabilityResult.fleschScore >= 60 ? "✅ Looking Good" : "💡 Tips to Improve Readability"}
                    </h3>
                    <ul className="space-y-2">
                      {readabilityResult.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm opacity-80">
                          <span className="mt-0.5 shrink-0">{readabilityResult.fleschScore >= 60 ? "👍" : "→"}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sentence Analysis */}
                {readabilityResult.sentenceAnalysis.length > 0 && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="mb-3 text-sm font-bold">Sentence Analysis</h3>
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {readabilityResult.sentenceAnalysis.map((sa) => (
                        <div
                          key={sa.index}
                          className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                            sa.isLong ? "bg-orange-100/50 dark:bg-orange-950/20" : "bg-white/10"
                          }`}
                        >
                          <span className="shrink-0 font-mono opacity-40">{sa.index}.</span>
                          <span className="flex-1">{sa.text}</span>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className={`text-[10px] font-medium ${sa.isLong ? "text-orange-600 dark:text-orange-400" : "opacity-40"}`}>
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

        {/* ═══════════════ TONE DETECTOR TAB ═══════════════ */}
        {activeTab === "tone" && (
          <div className="glass rounded-2xl p-4 sm:p-6">
            {/* Input */}
            <div className="mb-4">
              <label htmlFor="tone-input" className="text-xs font-medium uppercase tracking-wide opacity-60">
                Paste text to analyze tone
              </label>
              <button onClick={handleToneClear} className="ml-2 rounded-md border border-white/20 bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm transition hover:bg-white/40">
                Clear
              </button>
            </div>
            <textarea
              id="tone-input"
              ref={toneTextareaRef}
              value={toneInput}
              onChange={handleToneInputChange}
              onPaste={handleTonePaste}
              placeholder="Paste any text here to detect its tone — formal, casual, persuasive, friendly, urgent, analytical, or empathetic..."
              rows={5}
              className="w-full resize-y rounded-lg border border-white/30 bg-white/40 p-4 text-sm leading-relaxed outline-none backdrop-blur-sm transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-[11px] ${
                toneInput.length === 0 ? "opacity-40"
                  : toneInput.length < 20 ? "text-yellow-500"
                  : toneInput.length > 50000 ? "text-red-500"
                  : "opacity-40"
              }`}>
                {toneInput.length === 0 ? ""
                  : toneInput.length < 20 ? `⚠️ ${toneInput.length}/20 min chars`
                  : `${toneInput.length.toLocaleString()} characters`}
                {toneInput.length > 50000 && " — very long text"}
              </span>
            </div>

            {/* Auto-analyze on paste */}
            {toneInput.length >= 20 && !toneResult && !toneError && (
              <p className="mt-2 text-center text-xs opacity-50">Analyzing tone...</p>
            )}

            {toneError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {toneError}
              </div>
            )}

            {/* Results */}
            {toneResult && (
              <>
                {/* Primary Tone Score Circle */}
                <div className="glass animate-pulse-once rounded-2xl p-6 text-center">
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest opacity-50">Primary Tone</div>
                  <div className="text-5xl mb-2">{toneResult.primary.emoji}</div>
                  <div className="text-2xl font-bold" style={{ color: toneResult.primary.color }}>
                    {toneResult.primary.label}
                  </div>
                  <div className="mt-1 text-sm opacity-60">{toneResult.primary.description}</div>
                  <div className="mt-3 text-3xl font-bold" style={{ color: toneResult.primary.color }}>
                    {toneResult.primary.score}%
                  </div>

                  {/* Emotional Intensity Bar */}
                  <div className="mt-4">
                    <div className="mb-1 text-[10px] uppercase tracking-wide opacity-50">Emotional Intensity</div>
                    <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${toneResult.emotionalIntensity}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs opacity-50">{toneResult.emotionalIntensity}%</div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button onClick={handleCopyTone} className="rounded-lg border border-white/20 bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/40">
                      {toneCopied ? "✓ Copied!" : "📋 Copy Report"}
                    </button>
                    <button onClick={() => { const w = window.print(); }} className="rounded-lg border border-white/20 bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/40 no-print">
                      📄 Export PDF
                    </button>
                  </div>
                </div>

                {/* All Tones Breakdown */}
                <div className="glass animate-fade-in-up rounded-2xl p-5">
                  <h3 className="mb-3 text-sm font-bold">All Tones Breakdown</h3>
                  <div className="space-y-3">
                    {toneResult.tones.map((t) => (
                      <div key={t.tone}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <span>{t.emoji}</span>
                            <span>{t.label}</span>
                          </span>
                          <span className="text-sm font-bold" style={{ color: t.score > 40 ? t.color : undefined }}>{t.score}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${t.score}%`, backgroundColor: t.color, opacity: t.score > 30 ? 1 : 0.4 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="glass animate-fade-in-up rounded-2xl p-5">
                  <h3 className="mb-3 text-sm font-bold">Text Statistics</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Words", value: toneResult.stats.wordCount },
                      { label: "Sentences", value: toneResult.stats.sentenceCount },
                      { label: "Avg Length", value: `${toneResult.stats.avgSentenceLength}w` },
                      { label: "Questions", value: toneResult.stats.questionCount },
                      { label: "Exclamations", value: toneResult.stats.exclamationCount },
                      { label: "I/We (1st)", value: toneResult.stats.firstPersonCount },
                      { label: "You (2nd)", value: toneResult.stats.secondPersonCount },
                      { label: "Passive", value: toneResult.stats.passiveVoiceCount },
                    ].map((stat) => (
                      <div key={stat.label} className="glass-subtle rounded-lg p-3 text-center">
                        <span className="block text-lg font-bold">{stat.value}</span>
                        <span className="text-[10px] opacity-50">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentence-by-Sentence Analysis */}
                {toneResult.sentenceTones.length > 1 && (
                  <div className="glass animate-fade-in-up rounded-2xl p-5">
                    <h3 className="mb-3 text-sm font-bold">Sentence-by-Sentence</h3>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {toneResult.sentenceTones.map((st) => (
                        <div key={st.index} className="flex items-start gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs">
                          <span className="shrink-0 font-mono opacity-40">{st.index}.</span>
                          <span className="flex-1 opacity-80">{st.text}</span>
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: TONE_META[st.tone].color + "20", color: TONE_META[st.tone].color }}>
                            {TONE_META[st.tone].emoji} {TONE_META[st.tone].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {toneResult.tips.length > 0 && (
                  <div className="glass animate-fade-in-up rounded-2xl p-5">
                    <h3 className="mb-3 text-sm font-bold">Tips</h3>
                    <ul className="space-y-2">
                      {toneResult.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm opacity-80">
                          <CheckIcon />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {toneInput.length < 20 && (
              <div className="glass animate-pulse-once rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">🎭</div>
                <div className="text-sm font-bold">Paste at least 20 characters to analyze tone</div>
                <div className="mt-1 text-xs opacity-50">We detect 7 tones: Formal, Casual, Persuasive, Friendly, Urgent, Analytical, Empathetic</div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ SCRIPT GENERATOR TAB ═══════════════ */}
        {activeTab === "script" && (
          <div className="glass rounded-2xl p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Speaking Script Generator</h2>
              <p className="mt-1 text-xs opacity-60">Choose a role, describe your context, and get a structured speaking script.</p>
            </div>

            {/* Role Selector */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold">Select Role</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SCRIPT_ROLES.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => { setScriptRole(r.role); setScriptResult(null); }}
                    className={`rounded-xl p-3 text-left text-xs transition ${
                      scriptRole === r.role
                        ? "ring-2 ring-violet-500 bg-white/30 dark:bg-white/10 shadow-sm"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="text-lg mb-1">{r.emoji}</div>
                    <div className="font-bold">{r.label}</div>
                    <div className="mt-0.5 opacity-50 text-[10px] leading-tight">{r.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Context Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold">Context / Situation</label>
              <textarea
                value={scriptContext}
                onChange={(e) => setScriptContext(e.target.value)}
                placeholder={SCRIPT_ROLES.find(r => r.role === scriptRole)?.contextPlaceholder || "Describe the situation..."}
                rows={4}
                className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-sm outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-violet-500 placeholder:opacity-40 resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateScript}
              disabled={scriptContext.trim().length < 5 || aiChecking}
              className="mb-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {aiChecking ? "Generating with AI..." : "Generate Script"}
            </button>

            {/* Result */}
            {scriptResult && (
              <>
                {/* Header */}
                <div className="glass animate-fade-in-up rounded-2xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold">
                        {SCRIPT_ROLES.find(r => r.role === scriptResult.role)?.emoji}{" "}
                        {SCRIPT_ROLES.find(r => r.role === scriptResult.role)?.label} Script
                      </h3>
                      <p className="text-xs opacity-50 mt-0.5">
                        {scriptResult.duration} &middot; {scriptResult.sections.length} sections
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyScript}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition"
                      >
                        {scriptCopied ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={handleDownloadScript}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  {scriptContext && (
                    <p className="text-xs opacity-50 italic">Context: {scriptContext}</p>
                  )}
                </div>

                {/* Sections */}
                {scriptResult.sections.map((section, i) => (
                  <div key={i} className="glass animate-fade-in-up rounded-2xl p-5 mb-3">
                    <h4 className="mb-2 font-bold text-sm">
                      {section.icon} {section.title}
                    </h4>
                    <p className="text-sm opacity-80 whitespace-pre-line">{section.content}</p>
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {section.bullets.map((b, bi) => (
                          <li key={bi} className="flex items-start gap-2 text-sm opacity-75">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {/* Preparation Checklist */}
                <div className="glass animate-fade-in-up rounded-2xl p-5 mb-3">
                  <h4 className="mb-3 font-bold text-sm">✅ Preparation Checklist</h4>
                  <ul className="space-y-2">
                    {scriptResult.preparation.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm opacity-80">
                        <span className="mt-0.5 shrink-0 h-4 w-4 rounded border border-white/30 flex items-center justify-center text-[10px]">☐</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Do's and Don'ts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="glass animate-fade-in-up rounded-2xl p-5">
                    <h4 className="mb-3 font-bold text-sm text-emerald-500">👍 Do&apos;s</h4>
                    <ul className="space-y-2">
                      {scriptResult.dosAndDonts.dos.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm opacity-80">
                          <CheckIcon />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="glass animate-fade-in-up rounded-2xl p-5">
                    <h4 className="mb-3 font-bold text-sm text-rose-400">👎 Don&apos;ts</h4>
                    <ul className="space-y-2">
                      {scriptResult.dosAndDonts.donts.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm opacity-80">
                          <span className="mt-1 shrink-0 text-rose-400">✕</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Phrases */}
                {scriptResult.keyPhrases.length > 0 && (
                  <div className="glass animate-fade-in-up rounded-2xl p-5">
                    <h4 className="mb-3 font-bold text-sm">💬 Key Phrases</h4>
                    <div className="flex flex-wrap gap-2">
                      {scriptResult.keyPhrases.map((p, i) => (
                        <span key={i} className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium opacity-80">
                          &ldquo;{p}&rdquo;
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!scriptResult && scriptContext.trim().length < 5 && (
              <div className="glass animate-pulse-once rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">🎬</div>
                <div className="text-sm font-bold">Choose a role & describe your context</div>
                <div className="mt-1 text-xs opacity-50">We generate structured speaking scripts for 8 different roles</div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ REWRITE TAB ═══════════════ */}
        {activeTab === "rewrite" && (
          <div className="glass rounded-2xl p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Rewrite / Paraphrase</h2>
              <p className="mt-1 text-sm opacity-60">Transform your text into 8 different writing styles — powered by AI with heuristic fallback.</p>
            </div>

            {/* Style selector */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide">Target Style</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {REWRITE_STYLES.map((s) => (
                  <button
                    key={s.style}
                    onClick={() => setRewriteStyle(s.style)}
                    className={`rounded-xl border p-3 text-left transition ${
                      rewriteStyle === s.style
                        ? "border-white/40 bg-white/30 shadow-sm"
                        : "border-white/10 bg-white/5 hover:bg-white/15"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.emoji}</span>
                      <span className="text-sm font-semibold">{s.label}</span>
                    </div>
                    <div className="mt-1 text-[11px] leading-tight opacity-50">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="rewrite-input" className="text-xs font-medium uppercase tracking-wide">Input Text</label>
                <button onClick={handleClearRewrite} className="rounded-md border border-white/20 bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm transition hover:bg-white/40">
                  Clear
                </button>
              </div>
              <textarea
                id="rewrite-input"
                value={rewriteInput}
                onChange={(e) => setRewriteInput(e.target.value)}
                placeholder="Paste or type text to rewrite..."
                rows={6}
                className="w-full resize-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              />
            </div>

            {/* Action */}
            <button
              onClick={handleRewrite}
              disabled={aiChecking || !rewriteInput.trim()}
              className="mb-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40"
            >
              {aiChecking ? "Rewriting..." : `Rewrite as ${REWRITE_STYLES.find(s => s.style === rewriteStyle)?.label ?? rewriteStyle}`}
            </button>

            {/* Output */}
            {rewriteResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide">Rewritten Text</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      rewriteResult.source === "ai" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {rewriteResult.source === "ai" ? "AI" : "HEURISTIC"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopyRewrite} className="rounded-md border border-white/20 bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm transition hover:bg-white/40">
                      {rewriteCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-sm">
                  {rewriteResult.rewritten}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <AdBanner slot="horizontal" />
        </div>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-6 text-center text-xl font-bold">
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
              <details key={faq.q} className="glass-subtle group rounded-lg">
                <summary className="cursor-pointer px-5 py-4 text-sm font-medium group-open:text-violet-600 dark:group-open:text-violet-400">
                  {faq.q}
                </summary>
                <p className="px-5 pb-4 text-sm opacity-60">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
