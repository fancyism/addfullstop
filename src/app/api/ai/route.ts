/**
 * OpenRouter API Proxy — Server-side route handler.
 *
 * POST /api/ai
 * Body: { action: "analyze"|"humanize"|"tone"|"script", payload: {...}, model?: string }
 *
 * Keeps OPENROUTER_API_KEY server-side (never exposed to client).
 * Falls back gracefully if key is missing.
 */

import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Default model — fast & cheap, good enough for text analysis tasks
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

// ─── Action → System Prompt mapping ────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  analyze: `You are an expert AI text detector. Analyze the provided text and return ONLY valid JSON (no markdown, no code fences):
{
  "overall": <number 0-100, higher = more likely AI>,
  "metrics": {
    "zipfConformity": <0-100>,
    "aiPhrases": <0-100>,
    "punctuationEntropy": <0-100>,
    "sentenceVariance": <0-100>,
    "sentenceSkewness": <0-100>,
    "starterRepetition": <0-100>,
    "hapaxRatio": <0-100>,
    "paragraphUniformity": <0-100>,
    "vocabularyRichness": <0-100>,
    "burstiness": <0-100>
  },
  "lineScores": [
    { "line": <number>, "text": "<first 80 chars>", "score": <0-100>, "reason": "<brief reason>" }
  ],
  "tips": ["<actionable tip>", ...]
}
Score accurately. AI text tends to have: uniform sentence length, low burstiness, high Zipf conformity, common AI phrases ("delve", "it's worth noting", "in conclusion"), repetitive sentence starters, perfect grammar, low vocabulary richness. Human text is bursty, varied, imperfect, uses contractions, colloquialisms, and varied paragraph sizes.`,

  humanize: `You are an expert text humanizer. Rewrite the provided AI-generated text to sound naturally human while preserving the original meaning and key information.

Rules:
- Use contractions (it's, don't, we're, they've)
- Vary sentence length dramatically (some very short, some longer)
- Add natural imperfections: informal connectors, occasional fragments
- Replace AI clichés ("delve", "it's worth noting", "in conclusion", "furthermore", "moreover")
- Use active voice, concrete words, specific examples
- Make paragraphs varied in size
- Keep the same language as the input (Thai stays Thai, English stays English)
- Do NOT add new information, opinions, or change meaning
- Return ONLY the humanized text, nothing else`,

  tone: `You are an expert tone analyzer. Analyze the provided text and return ONLY valid JSON (no markdown, no code fences):
{
  "tones": [
    { "tone": "<formal|casual|persuasive|friendly|urgent|analytical|empathetic>", "score": <0-100>, "reason": "<brief reason>" }
  ],
  "emotionalIntensity": <0-100>,
  "tips": ["<actionable tip to adjust tone>", ...],
  "sentenceTones": [
    { "index": <0-based>, "tone": "<one of the 7>", "confidence": <0-100> }
  ]
}
Analyze word choice, punctuation patterns, sentence structure, pronouns, sentiment. Return ALL 7 tones with scores. The primary tone has the highest score.`,

  script: `You are an expert speaking script writer. Generate a structured speaking script based on the role and context provided.

Return ONLY valid JSON (no markdown, no code fences):
{
  "sections": [
    { "title": "<section name>", "icon": "<emoji>", "content": "<what to say>", "bullets": ["<talking point>", ...] }
  ],
  "preparation": ["<preparation step>", ...],
  "dosAndDonts": { "dos": ["<do this>", ...], "donts": ["<avoid this>", ...] },
  "keyPhrases": ["<memorable phrase>", ...],
  "duration": "<estimated speaking time>"
}

Make it practical, conversational, and role-appropriate. Use natural language, not robotic templates.`,
};

// ─── POST handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured", aiAvailable: false },
      { status: 200 } // 200 so client can fall back gracefully
    );
  }

  let body: { action: string; payload: unknown; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, payload, model } = body;

  if (!action || !SYSTEM_PROMPTS[action]) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${Object.keys(SYSTEM_PROMPTS).join(", ")}` },
      { status: 400 }
    );
  }

  const systemPrompt = SYSTEM_PROMPTS[action];
  const userMessage = JSON.stringify(payload);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://addfullstop.app",
        "X-Title": "AddFullStop",
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: action === "humanize" ? 0.8 : 0.3,
        max_tokens: action === "humanize" ? 4096 : 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[OpenRouter] ${response.status}: ${errText}`);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}`, aiAvailable: false },
        { status: 200 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI", aiAvailable: false },
        { status: 200 }
      );
    }

    // For humanize action, content is plain text
    if (action === "humanize") {
      return NextResponse.json({
        aiAvailable: true,
        action,
        result: content,
      });
    }

    // For other actions, parse JSON from the response
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({
        aiAvailable: true,
        action,
        result: parsed,
      });
    } catch {
      // AI returned malformed JSON — try to extract JSON from markdown code fences
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return NextResponse.json({
          aiAvailable: true,
          action,
          result: parsed,
        });
      }
      return NextResponse.json(
        { error: "AI returned invalid JSON", aiAvailable: false },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("[OpenRouter] Network error:", err);
    return NextResponse.json(
      { error: "Network error calling OpenRouter", aiAvailable: false },
      { status: 200 }
    );
  }
}
