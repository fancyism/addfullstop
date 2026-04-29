/**
 * AI Client — LLM-first interface for all AI-powered features.
 *
 * When AI is available: LLM does the real analysis, heuristics only provide stats.
 * When AI is unavailable: heuristic fallback keeps the app working.
 *
 * Usage:
 *   aiClient.setModel("thudm/glm-5.1");
 *   const result = await aiClient.analyze(text);
 *   result.source // "ai" | "heuristic"
 */

import { analyzeText } from "./aiAnalyzer";
import type { AIScore } from "./aiAnalyzer";
import { humanizeText } from "./humanizer";
import type { HumanizeResult } from "./humanizer";
import { analyzeTone } from "./toneAnalyzer";
import type { ToneResult, ToneType } from "./toneAnalyzer";
import { TONE_META } from "./toneAnalyzer";
import { generateScript } from "./scriptGenerator";
import type { ScriptRole, GeneratedScript } from "./scriptGenerator";
import { rewriteText } from "./paraphraser";
import type { RewriteStyle, RewriteResult } from "./paraphraser";

// ─── Types ─────────────────────────────────────────────────────────────

export type AISource = "ai" | "heuristic";

export interface AIAnalyzeResult {
  source: AISource;
  score: AIScore;
}

export interface AIHumanizeResult {
  source: AISource;
  result: HumanizeResult;
}

export interface AIToneResult {
  source: AISource;
  result: ToneResult;
}

export interface AIScriptResult {
  source: AISource;
  result: GeneratedScript | null;
}

export interface AIRewriteResult {
  source: AISource;
  result: RewriteResult;
}

export interface ModelInfo {
  id: string;
  label: string;
  provider: string;
  tier: string;
}

// ─── Model Management ─────────────────────────────────────────────────

let currentModel = "thudm/glm-5.1";
let cachedModels: ModelInfo[] = [];

export function getModel(): string {
  return currentModel;
}

export function setModel(model: string): void {
  currentModel = model;
}

export function getAvailableModels(): ModelInfo[] {
  return cachedModels.length > 0 ? cachedModels : [
    { id: "thudm/glm-5.1", label: "GLM-5.1", provider: "Zhipu AI", tier: "smart" },
    { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tier: "fast" },
    { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tier: "smart" },
    { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic", tier: "smart" },
  ];
}

// ─── API Call ──────────────────────────────────────────────────────────

async function callAI(action: string, payload: unknown): Promise<{
  ok: boolean;
  data?: unknown;
  source: AISource;
  model?: string;
}> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload, model: currentModel }),
    });

    const json = await res.json();

    if (json.error || !json.aiAvailable) {
      return { ok: false, source: "heuristic" };
    }

    // Cache models from server if provided
    if (json.models) {
      cachedModels = json.models;
    }

    return { ok: true, data: json.result, source: "ai", model: json.model };
  } catch {
    return { ok: false, source: "heuristic" };
  }
}

// ─── Fetch available models from server ────────────────────────────────

export async function fetchModels(): Promise<{ models: ModelInfo[]; configured: boolean }> {
  try {
    const res = await fetch("/api/ai");
    const json = await res.json();
    if (json.models) {
      cachedModels = json.models;
      return { models: json.models, configured: json.configured };
    }
    return { models: getAvailableModels(), configured: false };
  } catch {
    return { models: getAvailableModels(), configured: false };
  }
}

// ─── Public API ────────────────────────────────────────────────────────

export const aiClient = {
  getModel,
  setModel,
  fetchModels,

  /**
   * AI-powered text analysis — LLM is the brain.
   * Heuristic only provides stats (word count, sentence count, etc).
   */
  async analyze(text: string): Promise<AIAnalyzeResult> {
    const { ok, data, source } = await callAI("analyze", { text });
    const heuristic = analyzeText(text);

    if (ok && data && typeof data === "object") {
      const ai = data as Record<string, unknown>;

      // AI provides the scores, heuristic provides stats only
      const overall = typeof ai.overall === "number" ? ai.overall : heuristic.overall;

      const score: AIScore = {
        overall,
        label: overall < 25 ? "Likely Human" : overall < 50 ? "Possibly AI" : "Likely AI",
        color: overall < 25 ? "green" : overall < 50 ? "yellow" : "red",
        warnings: heuristic.warnings,
        metrics: heuristic.metrics,
        lineScores: Array.isArray(ai.lineScores)
          ? (ai.lineScores as AIScore["lineScores"]).slice(0, 50)
          : heuristic.lineScores,
        tips: Array.isArray(ai.tips) ? (ai.tips as string[]).slice(0, 10) : heuristic.tips,
        stats: heuristic.stats,
      };

      // AI metrics override heuristic
      if (ai.metrics && typeof ai.metrics === "object") {
        const aiMetrics = ai.metrics as Record<string, unknown>;
        for (const key of Object.keys(aiMetrics)) {
          if (key in score.metrics && typeof aiMetrics[key] === "number") {
            const entry = score.metrics[key as keyof typeof score.metrics];
            (score.metrics as Record<string, typeof entry>)[key] = {
              ...entry,
              score: aiMetrics[key] as number,
            };
          }
        }
      }

      return { source, score };
    }

    return { source: "heuristic", score: heuristic };
  },

  /**
   * AI-powered humanization — LLM rewrites the text.
   */
  async humanize(text: string): Promise<AIHumanizeResult> {
    const { ok, data, source } = await callAI("humanize", { text });

    if (ok && data && typeof data === "string") {
      const humanizedText = data as string;
      const changes = computeChanges(text, humanizedText);
      return {
        source,
        result: { text: humanizedText, changes, totalChanges: changes.length },
      };
    }

    return { source: "heuristic", result: humanizeText(text) };
  },

  /**
   * AI-powered tone analysis — LLM reads the tone.
   * Heuristic only provides stats.
   */
  async tone(text: string): Promise<AIToneResult> {
    const { ok, data, source } = await callAI("tone", { text });
    const heuristic = analyzeTone(text);

    if (ok && data && typeof data === "object") {
      const ai = data as Record<string, unknown>;
      const stats = heuristic ? heuristic.stats : getDefaultStats(text);

      // Build ToneResult from AI response directly
      const tones = buildToneScores(ai);
      const sentenceTones = buildSentenceTones(ai, text);

      const result: ToneResult = {
        tones,
        primary: tones[0] || getDefaultToneScore(),
        emotionalIntensity: typeof ai.emotionalIntensity === "number" ? ai.emotionalIntensity : 50,
        tips: Array.isArray(ai.tips) ? (ai.tips as string[]).slice(0, 5) : [],
        sentenceTones,
        stats,
      };

      return { source, result };
    }

    return { source: "heuristic", result: heuristic ?? getDefaultToneResult(text) };
  },

  /**
   * AI-powered script generation — LLM writes the script.
   */
  async script(role: ScriptRole, context: string): Promise<AIScriptResult> {
    const { ok, data, source } = await callAI("script", { role, context });

    if (ok && data && typeof data === "object") {
      const ai = data as Record<string, unknown>;
      const dd = ai.dosAndDonts as Record<string, string[]> | undefined;

      const result: GeneratedScript = {
        role,
        context,
        sections: Array.isArray(ai.sections)
          ? (ai.sections as GeneratedScript["sections"])
          : [],
        preparation: Array.isArray(ai.preparation) ? (ai.preparation as string[]) : [],
        dosAndDonts: {
          dos: Array.isArray(dd?.dos) ? dd!.dos : [],
          donts: Array.isArray(dd?.donts) ? dd!.donts : [],
        },
        keyPhrases: Array.isArray(ai.keyPhrases) ? (ai.keyPhrases as string[]) : [],
        duration: typeof ai.duration === "string" ? ai.duration : "5-10 minutes",
      };
      return { source, result };
    }

    return { source: "heuristic", result: generateScript(role, context) };
  },

  /**
   * AI-powered rewrite/paraphrase in a target style.
   * Falls back to heuristic transformations.
   */
  async rewrite(text: string, style: RewriteStyle): Promise<AIRewriteResult> {
    const { ok, data, source } = await callAI("rewrite", { text, style });

    if (ok && data && typeof data === "string") {
      const rewrittenText = data as string;
      const changes = computeChanges(text, rewrittenText);
      return {
        source,
        result: {
          original: text,
          rewritten: rewrittenText,
          style,
          changes,
        },
      };
    }

    return { source: "heuristic", result: rewriteText(text, style) };
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────

function buildToneScores(ai: Record<string, unknown>): ToneResult["tones"] {
  if (!Array.isArray(ai.tones)) return [];

  return (ai.tones as Array<{ tone: string; score: number; reason: string }>)
    .filter(t => t.tone in TONE_META)
    .map(t => {
      const meta = TONE_META[t.tone as ToneType];
      return {
        tone: t.tone as ToneType,
        score: Math.min(100, Math.max(0, t.score)),
        label: meta.label,
        emoji: meta.emoji,
        description: meta.description,
        color: meta.color,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildSentenceTones(ai: Record<string, unknown>, text: string): ToneResult["sentenceTones"] {
  const sentences = text.split(/(?<=[.!?。？！])\s+/).filter(s => s.trim().length > 0);

  if (!Array.isArray(ai.sentenceTones)) {
    // Build basic sentence tones from text
    return sentences.slice(0, 30).map((s, i) => ({
      index: i + 1,
      text: s.length > 120 ? s.slice(0, 117) + "..." : s,
      tone: "casual" as ToneType,
      confidence: 50,
    }));
  }

  return (ai.sentenceTones as Array<{ index: number; tone: string; confidence: number }>)
    .filter(st => st.tone in TONE_META)
    .map((st, i) => {
      const sentence = sentences[i] || sentences[sentences.length - 1] || "";
      return {
        index: st.index + 1,
        text: sentence.length > 120 ? sentence.slice(0, 117) + "..." : sentence,
        tone: st.tone as ToneType,
        confidence: Math.min(100, Math.max(0, st.confidence)),
      };
    });
}

function computeChanges(original: string, humanized: string): HumanizeResult["changes"] {
  const changes: HumanizeResult["changes"] = [];
  const origLines = original.split("\n");
  const humLines = humanized.split("\n");
  const maxLines = Math.max(origLines.length, humLines.length);

  for (let i = 0; i < maxLines; i++) {
    const origLine = (origLines[i] || "").trim();
    const humLine = (humLines[i] || "").trim();

    if (origLine !== humLine && origLine && humLine) {
      changes.push({
        type: "synonym",
        original: origLine.length > 100 ? origLine.slice(0, 100) + "..." : origLine,
        replacement: humLine.length > 100 ? humLine.slice(0, 100) + "..." : humLine,
        description: "AI-humanized rewrite",
      });
    }
  }

  return changes.slice(0, 20);
}

function getDefaultToneScore(): ToneResult["primary"] {
  return { tone: "casual", score: 0, label: "Casual", emoji: "💬", description: "Default", color: "#6b7280" };
}

function getDefaultStats(text: string): ToneResult["stats"] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return {
    wordCount: words.length,
    sentenceCount: sentences.length || 1,
    avgSentenceLength: Math.round(words.length / Math.max(sentences.length, 1)),
    questionCount: (text.match(/\?/g) || []).length,
    exclamationCount: (text.match(/!/g) || []).length,
    firstPersonCount: (text.match(/\b(I|me|my|we|us|our)\b/gi) || []).length,
    secondPersonCount: (text.match(/\b(you|your|yours)\b/gi) || []).length,
    passiveVoiceCount: (text.match(/\b(was|were|is|are|been|being)\s+\w+ed\b/gi) || []).length,
  };
}

function getDefaultToneResult(text: string): ToneResult {
  return {
    tones: [],
    primary: getDefaultToneScore(),
    emotionalIntensity: 0,
    tips: [],
    sentenceTones: [],
    stats: getDefaultStats(text),
  };
}
