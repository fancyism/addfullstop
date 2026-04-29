/**
 * AI Client — Unified interface for all AI-powered features.
 *
 * Strategy: Try OpenRouter API first → fall back to heuristic if unavailable.
 * The API key stays server-side (never sent to client).
 *
 * Usage:
 *   const result = await aiClient.analyze(text);
 *   result.source // "ai" | "heuristic"
 */

import { analyzeText } from "./aiAnalyzer";
import type { AIScore } from "./aiAnalyzer";
import { humanizeText } from "./humanizer";
import type { HumanizeResult } from "./humanizer";
import { analyzeTone } from "./toneAnalyzer";
import type { ToneResult } from "./toneAnalyzer";
import { generateScript } from "./scriptGenerator";
import type { ScriptRole, GeneratedScript } from "./scriptGenerator";

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

export interface AIStatus {
  available: boolean;
  model: string | null;
}

// ─── API call helper ───────────────────────────────────────────────────

async function callAI(action: string, payload: unknown): Promise<{ ok: boolean; data?: unknown; source: AISource }> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });

    const json = await res.json();

    if (json.error || !json.aiAvailable) {
      return { ok: false, source: "heuristic" };
    }

    return { ok: true, data: json.result, source: "ai" };
  } catch {
    return { ok: false, source: "heuristic" };
  }
}

// ─── Public API ────────────────────────────────────────────────────────

export const aiClient = {
  /**
   * Check if AI is available (has API key configured).
   */
  async getStatus(): Promise<AIStatus> {
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", payload: { text: "test" } }),
      });
      const json = await res.json();
      return { available: json.aiAvailable === true, model: json.aiAvailable ? "openrouter" : null };
    } catch {
      return { available: false, model: null };
    }
  },

  /**
   * AI-powered text analysis (AI detection).
   * Falls back to heuristic analysis.
   */
  async analyze(text: string): Promise<AIAnalyzeResult> {
    const { ok, data, source } = await callAI("analyze", { text });

    if (ok && data && typeof data === "object") {
      const aiData = data as Record<string, unknown>;
      // Merge AI scores with heuristic stats (AI doesn't compute word stats)
      const heuristic = analyzeText(text);

      // Build the merged result — AI metrics take priority
      const score: AIScore = {
        overall: typeof aiData.overall === "number" ? aiData.overall : heuristic.overall,
        label: heuristic.label,
        color: heuristic.color,
        warnings: heuristic.warnings,
        metrics: heuristic.metrics, // Keep heuristic metrics as baseline
        lineScores: Array.isArray(aiData.lineScores)
          ? (aiData.lineScores as Array<{ line: number; text: string; score: number; reason: string }>).slice(0, 50)
          : heuristic.lineScores,
        tips: Array.isArray(aiData.tips) ? (aiData.tips as string[]).slice(0, 10) : heuristic.tips,
        stats: heuristic.stats,
      };

      // Recalculate label/color from AI overall score
      if (score.overall < 25) {
        score.label = "Likely Human";
        score.color = "green";
      } else if (score.overall < 50) {
        score.label = "Possibly AI";
        score.color = "yellow";
      } else {
        score.label = "Likely AI";
        score.color = "red";
      }

      // If AI returned metrics, override the heuristic ones
      if (aiData.metrics && typeof aiData.metrics === "object") {
        const aiMetrics = aiData.metrics as Record<string, unknown>;
        for (const key of Object.keys(aiMetrics)) {
          if (key in score.metrics && typeof aiMetrics[key] === "number") {
            (score.metrics as Record<string, { score: number; label: string; description: string }>)[key] = {
              ...score.metrics[key as keyof typeof score.metrics],
              score: aiMetrics[key] as number,
            };
          }
        }
      }

      return { source, score };
    }

    // Fallback to heuristic
    return { source: "heuristic", score: analyzeText(text) };
  },

  /**
   * AI-powered text humanization.
   * Falls back to rule-based humanizer.
   */
  async humanize(text: string): Promise<AIHumanizeResult> {
    const { ok, data, source } = await callAI("humanize", { text });

    if (ok && data && typeof data === "string") {
      // AI returned humanized text — compute diff-like changes
      const changes = computeChanges(text, data as string);
      return {
        source,
        result: {
          text: data as string,
          changes,
          totalChanges: changes.length,
        },
      };
    }

    // Fallback to rule-based
    return { source: "heuristic", result: humanizeText(text) };
  },

  /**
   * AI-powered tone analysis.
   * Falls back to heuristic tone detector.
   */
  async tone(text: string): Promise<AIToneResult> {
    const { ok, data, source } = await callAI("tone", { text });

    if (ok && data && typeof data === "object") {
      const heuristic = analyzeTone(text);
      if (!heuristic) {
        return { source: "heuristic", result: analyzeTone(text) ?? getDefaultToneResult() };
      }
      const aiData = data as Record<string, unknown>;

      // Clone heuristic as base (satisfies ToneResult fully)
      const result: ToneResult = {
        tones: [...heuristic.tones],
        primary: { ...heuristic.primary },
        emotionalIntensity: heuristic.emotionalIntensity,
        tips: [...heuristic.tips],
        sentenceTones: [...heuristic.sentenceTones],
        stats: { ...heuristic.stats },
      };

      if (typeof aiData.emotionalIntensity === "number") {
        result.emotionalIntensity = aiData.emotionalIntensity;
      }

      if (Array.isArray(aiData.tips)) {
        result.tips = aiData.tips as string[];
      }

      // Merge AI tone scores into the heuristic result
      if (Array.isArray(aiData.tones)) {
        const aiTones = aiData.tones as Array<{ tone: string; score: number; reason: string }>;
        // Boost heuristic scores with AI confidence where available
        for (const at of aiTones) {
          const existing = result.tones.find(t => t.tone === at.tone);
          if (existing) {
            // Blend: 60% AI, 40% heuristic
            existing.score = Math.round(existing.score * 0.4 + at.score * 0.6);
          }
        }
        // Re-sort and re-pick primary
        result.tones.sort((a, b) => b.score - a.score);
        result.primary = result.tones[0];
      }

      if (Array.isArray(aiData.sentenceTones)) {
        const aiST = aiData.sentenceTones as Array<{ index: number; tone: string; confidence: number }>;
        for (const st of aiST) {
          const existing = result.sentenceTones.find(s => s.index === st.index);
          if (existing) {
            existing.tone = st.tone as ToneResult["primary"]["tone"];
            existing.confidence = st.confidence;
          }
        }
      }

      return { source, result };
    }

    return { source: "heuristic", result: analyzeTone(text) ?? getDefaultToneResult() };
  },

  /**
   * AI-powered script generation.
   * Falls back to template-based generator.
   */
  async script(role: ScriptRole, context: string): Promise<AIScriptResult> {
    const { ok, data, source } = await callAI("script", { role, context });

    if (ok && data && typeof data === "object") {
      const aiData = data as Record<string, unknown>;
      const result: GeneratedScript = {
        role,
        context,
        sections: Array.isArray(aiData.sections)
          ? (aiData.sections as Array<{ title: string; icon: string; content: string; bullets?: string[] }>)
          : [],
        preparation: Array.isArray(aiData.preparation) ? (aiData.preparation as string[]) : [],
        dosAndDonts: {
          dos: Array.isArray((aiData.dosAndDonts as Record<string, string[]>)?.dos) ? ((aiData.dosAndDonts as Record<string, string[]>).dos) : [],
          donts: Array.isArray((aiData.dosAndDonts as Record<string, string[]>)?.donts) ? ((aiData.dosAndDonts as Record<string, string[]>).donts) : [],
        },
        keyPhrases: Array.isArray(aiData.keyPhrases) ? (aiData.keyPhrases as string[]) : [],
        duration: typeof aiData.duration === "string" ? aiData.duration : "5-10 minutes",
      };
      return { source, result };
    }

    // Fallback to template-based
    return { source: "heuristic", result: generateScript(role, context) };
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────

/** Compute change descriptions between original and humanized text */
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

  return changes.slice(0, 20); // Cap at 20 changes
}

/** Minimal fallback ToneResult when both AI and heuristic fail */
function getDefaultToneResult(): ToneResult {
  return {
    tones: [],
    primary: { tone: "casual" as const, score: 0, label: "Casual", emoji: "💬", description: "Default", color: "#6b7280" },
    emotionalIntensity: 0,
    tips: [],
    sentenceTones: [],
    stats: { wordCount: 0, sentenceCount: 0, avgSentenceLength: 0, questionCount: 0, exclamationCount: 0, firstPersonCount: 0, secondPersonCount: 0, passiveVoiceCount: 0 },
  };
}
