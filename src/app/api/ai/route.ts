/**
 * OpenRouter API Proxy — Server-side route handler.
 *
 * POST /api/ai
 * Body: { action, payload, model? }
 *
 * Supports any OpenRouter model. Keeps API key server-side.
 */

import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ─── Available Models ──────────────────────────────────────────────────

export const MODELS = [
  { id: "thudm/glm-5.1", label: "GLM-5.1", provider: "Zhipu AI", tier: "smart" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tier: "fast" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", tier: "smart" },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tier: "smart" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tier: "fast" },
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic", tier: "smart" },
  { id: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3", provider: "DeepSeek", tier: "fast" },
  { id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", provider: "Meta", tier: "fast" },
] as const;

export type ModelId = typeof MODELS[number]["id"];

const DEFAULT_MODEL: ModelId = "thudm/glm-5.1";

// ─── GET handler — list available models ────────────────────────────────

export async function GET() {
  return NextResponse.json({
    models: MODELS.map(m => ({ id: m.id, label: m.label, provider: m.provider, tier: m.tier })),
    defaultModel: DEFAULT_MODEL,
    configured: !!process.env.OPENROUTER_API_KEY,
  });
}

// ─── System Prompts ────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  analyze: `You are an expert AI text detector. Analyze the provided text and determine if it was written by AI or a human.

IMPORTANT: Return ONLY valid JSON. No markdown. No code fences. No explanation outside JSON.

{
  "overall": <number 0-100, higher = more likely AI-generated>,
  "metrics": {
    "zipfConformity": <0-100, how well word frequency follows Zipf's law — AI text is unnaturally perfect>,
    "aiPhrases": <0-100, presence of AI-typical phrases like "delve", "it's worth noting", "in conclusion", "furthermore">,
    "punctuationEntropy": <0-100, uniformity of punctuation — AI is too consistent>,
    "sentenceVariance": <0-100, how much sentence lengths vary — AI is too uniform>,
    "sentenceSkewness": <0-100, distribution skewness of sentence complexity>,
    "starterRepetition": <0-100, how often sentences start with the same words>,
    "hapaxRatio": <0-100, ratio of words used only once — AI reuses vocabulary less>,
    "paragraphUniformity": <0-100, how similar paragraph sizes are>,
    "vocabularyRichness": <0-100, type-token ratio — AI uses richer but less natural vocab>,
    "burstiness": <0-100, variation in complexity over time — human writing is bursty, AI is flat>
  },
  "lineScores": [
    { "line": <1-based line number>, "text": "<first 80 chars of the line>", "score": <0-100>, "reason": "<why this line looks AI or human>" }
  ],
  "tips": ["<specific actionable tip to make the text sound more human>", "..."]
}

Analyze deeply. Consider:
- Sentence rhythm and variation
- Vocabulary choices and repetition
- Punctuation patterns
- Emotional authenticity
- Structural patterns AI typically produces
- Whether the text "sounds" like a real person wrote it`,

  humanize: `You are an expert text humanizer. Your job is to rewrite AI-generated text so it sounds like a real person wrote it.

RULES:
- Preserve ALL meaning and key information — do not add, remove, or change facts
- Keep the same language (Thai stays Thai, English stays English)
- Use natural contractions (it's, don't, we're, they've, couldn't)
- Vary sentence length dramatically — mix short punchy ones with longer flowing ones
- Replace AI clichés: "delve" → "dig into", "furthermore" → "plus" or "and", "it's worth noting" → remove entirely, "in conclusion" → "so" or just end naturally
- Add human touches: informal connectors ("anyway", "so", "but here's the thing"), occasional sentence fragments, natural digressions
- Use active voice, concrete specific words instead of abstract generic ones
- Break up perfectly uniform paragraphs into varied sizes
- Make it sound like someone actually talking, not a textbook

Return ONLY the humanized text. No JSON. No explanation. Just the rewritten text.`,

  tone: `You are an expert linguist and tone analyst. Analyze the TONE of the provided text.

IMPORTANT: Return ONLY valid JSON. No markdown. No code fences.

{
  "tones": [
    { "tone": "formal", "score": <0-100>, "reason": "<why>" },
    { "tone": "casual", "score": <0-100>, "reason": "<why>" },
    { "tone": "persuasive", "score": <0-100>, "reason": "<why>" },
    { "tone": "friendly", "score": <0-100>, "reason": "<why>" },
    { "tone": "urgent", "score": <0-100>, "reason": "<why>" },
    { "tone": "analytical", "score": <0-100>, "reason": "<why>" },
    { "tone": "empathetic", "score": <0-100>, "reason": "<why>" }
  ],
  "emotionalIntensity": <0-100>,
  "tips": ["<specific tip to adjust the tone>", "..."],
  "sentenceTones": [
    { "index": <0-based sentence number>, "tone": "<primary tone of this sentence>", "confidence": <0-100> }
  ]
}

Analyze DEEPLY. Consider:
- Word choice (formal vs slang, abstract vs concrete)
- Punctuation (!!! = excited/urgent, no exclamations = formal)
- Sentence structure (complex = formal/analytical, simple/fragmented = casual)
- Pronouns (I/we = personal, you = direct/persuasive)
- Sentiment and emotional undertone
- Cultural context and colloquialisms
- Profanity and slang are ALWAYS casual indicators

Score EACH tone independently. Do NOT just make the highest tone 100%. Be honest about scores — if text is very casual, casual should be high (70-95) and formal should be low (0-15).`,

  script: `You are an expert speaking coach and scriptwriter. Generate a practical, conversational speaking script.

The user wants a script for role: {{ROLE}} with context: {{CONTEXT}}

IMPORTANT: Return ONLY valid JSON. No markdown. No code fences.

{
  "sections": [
    { "title": "<clear section name>", "icon": "<single emoji>", "content": "<what to actually say — write it as if you're speaking, not reading>", "bullets": ["<key talking point>", "..."] }
  ],
  "preparation": ["<specific thing to prepare before speaking>", "..."],
  "dosAndDonts": {
    "dos": ["<specific do>", "..."],
    "donts": ["<specific don't>", "..."]
  },
  "keyPhrases": ["<memorable phrase they can use>", "..."],
  "duration": "<realistic estimate like '3-5 minutes' or '10-15 minutes'>"
}

Make it REAL and PRACTICAL:
- Write actual words they'd say, not abstract descriptions
- Include natural transitions between sections
- Add conversational openers and closers
- Consider the specific context the user provided
- Make it sound like a confident professional, not a robot reading a script`,

  rewrite: `You are an expert text rewriter. Rewrite the provided text in a specific target style while preserving ALL meaning and key information.

The user wants the text rewritten in the style: {{STYLE}}

STYLE DEFINITIONS:
- academic: Formal, scholarly, objective, cites reasoning, uses precise terminology, complex sentence structures, third person, no contractions, hedging language ("it appears that", "evidence suggests")
- business: Professional but accessible, direct, action-oriented, concise, uses business terminology appropriately, structured with clear points, confident tone
- creative: Engaging, vivid, uses metaphors and storytelling, varied rhythm, sensory details, hooks the reader, conversational but polished, unexpected word choices
- casual: Like talking to a friend — contractions, slang OK, short sentences, informal connectors ("so", "anyway", "honestly"), fragments OK, emoji-friendly, direct
- simple: ELI5 — explain like I'm 5 years old. Short words only, short sentences, no jargon, analogies from everyday life, one idea per sentence, active voice
- email: Professional email format — clear subject line, greeting, structured body with purpose stated upfront, call to action, professional sign-off, concise
- formal: Official/legal tone — precise language, no contractions, passive voice OK, structured, authoritative, no colloquialisms, third person preferred
- technical: Documentation style — clear, precise, structured with headers, code examples if relevant, assumes technical audience, uses proper terminology, step-by-step where appropriate

RULES:
- Preserve ALL facts, numbers, names, dates, and key information
- Keep the same language (Thai stays Thai, English stays English)
- Do NOT add new information or opinions
- Do NOT remove important details
- Return ONLY the rewritten text. No JSON. No explanation.

Rewrite the text now in {{STYLE}} style.`,
};

// ─── POST handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured", aiAvailable: false },
      { status: 200 }
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

  const selectedModel = model || DEFAULT_MODEL;

  // Build the user message from payload
  let userMessage: string;
  let systemContent: string;
  if (action === "script") {
    const p = payload as { role?: string; context?: string };
    systemContent = SYSTEM_PROMPTS.script
      .replace("{{ROLE}}", p.role || "presenter")
      .replace("{{CONTEXT}}", p.context || "general presentation");
    userMessage = `Generate a speaking script now. Context: ${p.context || "general"}`;
  } else if (action === "rewrite") {
    const p = payload as { text?: string; style?: string };
    const style = p.style || "casual";
    systemContent = SYSTEM_PROMPTS.rewrite.replace(/\{\{STYLE\}\}/g, style);
    userMessage = p.text || "";
  } else {
    systemContent = SYSTEM_PROMPTS[action];
    userMessage = JSON.stringify(payload);
  }

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
        model: selectedModel,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userMessage },
        ],
        temperature: action === "humanize" ? 0.85 : action === "script" ? 0.7 : action === "rewrite" ? 0.75 : 0.4,
        max_tokens: (action === "humanize" || action === "rewrite") ? 4096 : action === "script" ? 3000 : 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[OpenRouter] ${response.status}: ${errText}`);
      return NextResponse.json(
        { error: `OpenRouter error ${response.status}`, aiAvailable: false },
        { status: 200 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty AI response", aiAvailable: false },
        { status: 200 }
      );
    }

    // Humanize returns plain text
    if (action === "humanize") {
      return NextResponse.json({
        aiAvailable: true,
        action,
        model: selectedModel,
        result: content,
      });
    }

    // Parse JSON from AI response
    const parsed = extractJSON(content);
    if (parsed) {
      return NextResponse.json({
        aiAvailable: true,
        action,
        model: selectedModel,
        result: parsed,
      });
    }

    return NextResponse.json(
      { error: "AI returned invalid JSON", aiAvailable: false },
      { status: 200 }
    );
  } catch (err) {
    console.error("[OpenRouter] Network error:", err);
    return NextResponse.json(
      { error: "Network error", aiAvailable: false },
      { status: 200 }
    );
  }
}

// ─── JSON extraction helper ────────────────────────────────────────────

function extractJSON(text: string): unknown | null {
  // Try direct parse
  try { return JSON.parse(text); } catch { /* continue */ }

  // Try extracting from markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }

  // Try finding JSON object in text
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)); } catch { /* continue */ }
  }

  // Try finding JSON array
  const bracketStart = text.indexOf("[");
  const bracketEnd = text.lastIndexOf("]");
  if (bracketStart !== -1 && bracketEnd > bracketStart) {
    try { return JSON.parse(text.slice(bracketStart, bracketEnd + 1)); } catch { /* continue */ }
  }

  return null;
}
