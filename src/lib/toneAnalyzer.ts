/**
 * Tone Analyzer — Client-side heuristic tone detection.
 *
 * Detects 7 tones with confidence scores:
 *   Formal, Casual, Persuasive, Friendly, Urgent, Analytical, Empathetic
 *
 * Uses word lists, punctuation patterns, sentence structure,
 * pronoun usage, and sentiment heuristics.
 *
 * No server calls. No API keys. Pure pattern matching.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type ToneType =
  | "formal"
  | "casual"
  | "persuasive"
  | "friendly"
  | "urgent"
  | "analytical"
  | "empathetic";

export interface ToneResult {
  /** 0-100 confidence for each detected tone, sorted by score desc */
  tones: ToneScore[];
  /** Primary tone (highest score) */
  primary: ToneScore;
  /** Overall emotional intensity 0-100 */
  emotionalIntensity: number;
  /** Tips for adjusting tone */
  tips: string[];
  /** Per-sentence tone breakdown */
  sentenceTones: SentenceTone[];
  /** Text statistics relevant to tone */
  stats: ToneStats;
}

export interface ToneScore {
  tone: ToneType;
  score: number;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export interface SentenceTone {
  index: number;
  text: string;
  tone: ToneType;
  confidence: number;
}

export interface ToneStats {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  questionCount: number;
  exclamationCount: number;
  firstPersonCount: number;
  secondPersonCount: number;
  passiveVoiceCount: number;
}

// ─── Tone Metadata ───────────────────────────────────────────────────

export const TONE_META: Record<ToneType, Omit<ToneScore, "score">> = {
  formal: {
    tone: "formal",
    label: "Formal",
    emoji: "🎩",
    description: "Professional, structured, and objective language",
    color: "#6366f1",
  },
  casual: {
    tone: "casual",
    label: "Casual",
    emoji: "☕",
    description: "Relaxed, conversational, and informal language",
    color: "#f59e0b",
  },
  persuasive: {
    tone: "persuasive",
    label: "Persuasive",
    emoji: "🎯",
    description: "Convincing, action-oriented, and compelling language",
    color: "#ef4444",
  },
  friendly: {
    tone: "friendly",
    label: "Friendly",
    emoji: "😊",
    description: "Warm, welcoming, and approachable language",
    color: "#10b981",
  },
  urgent: {
    tone: "urgent",
    label: "Urgent",
    emoji: "⚡",
    description: "Time-sensitive, pressing, and action-demanding language",
    color: "#f97316",
  },
  analytical: {
    tone: "analytical",
    label: "Analytical",
    emoji: "🔬",
    description: "Data-driven, logical, and evidence-based language",
    color: "#3b82f6",
  },
  empathetic: {
    tone: "empathetic",
    label: "Empathetic",
    emoji: "💚",
    description: "Understanding, compassionate, and emotionally aware language",
    color: "#ec4899",
  },
};

// ─── Word Lists ──────────────────────────────────────────────────────

const FORMAL_WORDS = new Set([
  "therefore", "furthermore", "consequently", "moreover", "nevertheless",
  "accordingly", "thus", "hence", "hereby", "wherein", "hereafter",
  "notwithstanding", "pursuant", "regarding", "respectively", "subsequently",
  "aforementioned", "herein", "thereof", "whereby", "shall", "commence",
  "facilitate", "implement", "constitutes", "demonstrates", "indicates",
  "signifies", "pertaining", "encompassing", "methodology", "comprehensive",
  "substantial", "predominantly", "in accordance", "in lieu", "as follows",
  "in addition", "on behalf", "with regard", "prior to", "in order to",
  "it is evident", "it should be noted", "in conclusion", "to summarize",
]);

const CASUAL_WORDS = new Set([
  "hey", "hi", "yo", "sup", "gonna", "wanna", "gotta", "kinda", "sorta",
  "dunno", "yeah", "nah", "cool", "awesome", "sweet", "nice", "great",
  "lol", "haha", "omg", "btw", "tbh", "imo", "imho", "fyi", "tbh",
  "literally", "basically", "actually", "honestly", "seriously", "totally",
  "obviously", "definitely", "absolutely", "pretty much", "stuff", "thing",
  "things", "like", "right", "okay", "ok", "anyway", "though", "plus",
  "pretty", "super", "really", "quite", "bit", "bunch", "guy", "guys",
]);

const PERSUASIVE_WORDS = new Set([
  "must", "should", "need", "imagine", "discover", "proven", "guaranteed",
  "exclusive", "limited", "breakthrough", "secret", "revealed", "unlock",
  "transform", "essential", "critical", "vital", "crucial", "undeniable",
  "compelling", "remarkable", "extraordinary", "unprecedented", "revolutionary",
  "don't miss", "act now", "take action", "join", "start", "get",
  "because", "therefore", "consequently", "clearly", "obviously",
  "you deserve", "you owe", "imagine if", "what if", "consider this",
  "the truth is", "the fact is", "without a doubt", "it's time to",
]);

const FRIENDLY_WORDS = new Set([
  "welcome", "glad", "happy", "pleased", "excited", "thrilled", "delighted",
  "wonderful", "amazing", "fantastic", "brilliant", "lovely", "enjoy",
  "appreciate", "thank", "thanks", "grateful", "pleasure", "cheers",
  "warmly", "kindly", "dear", "friend", "buddy", "pal", "together",
  "celebrate", "congratulate", "proud", "honored", "blessed", "fortunate",
  "hope", "looking forward", "can't wait", "so glad", "love to",
]);

const URGENT_WORDS = new Set([
  "urgent", "immediately", "now", "asap", "hurry", "rush", "critical",
  "emergency", "deadline", "last chance", "final", "closing", "expires",
  "limited time", "running out", "don't wait", "time-sensitive", "act fast",
  "before it's too late", "warning", "alert", "attention", "important",
  "priority", "overdue", "past due", "required", "mandatory", "must",
  "imperative", "crucial", "essential", "vital", "cannot wait", "delay",
  "quickly", "promptly", "swiftly", "tonight", "today only", "ends soon",
]);

const ANALYTICAL_WORDS = new Set([
  "analysis", "data", "evidence", "research", "study", "findings",
  "statistics", "percentage", "correlation", "trend", "pattern", "metric",
  "benchmark", "comparison", "evaluation", "assessment", "measurement",
  "quantitative", "qualitative", "empirical", "hypothesis", "variable",
  "significant", "insignificant", "correlation", "causation", "probability",
  "according to", "based on", "results show", "data suggests", "indicates",
  "demonstrates", "confirms", "supports", "consistent with", "in contrast",
  "furthermore", "moreover", "specifically", "notably", "approximately",
]);

const EMPATHETIC_WORDS = new Set([
  "understand", "feel", "sorry", "apologize", "empathize", "care",
  "support", "listen", "here for you", "been there", "know how",
  "can imagine", "must be", "difficult", "challenging", "struggle",
  "pain", "hurt", "grief", "loss", "tough", "hard time", "going through",
  "never easy", "completely understandable", "valid", "feelings",
  "emotional", "compassion", "gentle", "warm", "comfort", "safe space",
  "not alone", "together", "we can", "healing", "growth", "resilience",
]);

// ─── Sentence Splitter ───────────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。？！])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

// ─── Scoring Helpers ─────────────────────────────────────────────────

/** Count how many words from a set appear in text */
function countSetMatches(words: string[], set: Set<string>): number {
  let count = 0;
  for (const word of words) {
    if (set.has(word)) count++;
  }
  // Also check bigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (set.has(bigram)) count++;
  }
  // Also check trigrams
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (set.has(trigram)) count++;
  }
  return count;
}

/** Count pattern matches in text */
function countPattern(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length;
}

// ─── Tone Scoring ────────────────────────────────────────────────────

interface ToneSignals {
  formal: number;
  casual: number;
  persuasive: number;
  friendly: number;
  urgent: number;
  analytical: number;
  empathetic: number;
}

function scoreToneForText(text: string, words: string[], sentences: string[]): ToneSignals {
  const wordCount = words.length || 1;
  const sentenceCount = sentences.length || 1;

  // ── Formal signals ──
  let formal = 0;
  formal += countSetMatches(words, FORMAL_WORDS) * 12;
  formal += countPattern(text, /\b(shall|hereby|pursuant|wherein|notwithstanding)\b/gi) * 15;
  formal += countPattern(text, /\b(passive|was .+ed|were .+ed|is .+ed|are .+ed|been .+ed)\b/gi) * 5;
  formal += countPattern(text, /\bin (accordance|addition|conclusion|summary|order)\b/gi) * 8;
  // Longer sentences → more formal
  const avgSentLen = words.length / sentenceCount;
  if (avgSentLen > 20) formal += 8;
  if (avgSentLen > 30) formal += 8;
  // No contractions → formal
  const contractionCount = countPattern(text, /\b\w+'\w+\b/g);
  formal += Math.max(0, 10 - contractionCount * 3);
  // No exclamation marks → formal
  const exclCount = countPattern(text, /!/g);
  formal += Math.max(0, 8 - exclCount * 4);
  // No first person → formal
  const firstPerson = countPattern(text, /\b(I|we|me|my|us|our)\b/gi);
  formal += Math.max(0, 10 - firstPerson * 2);

  // ── Casual signals ──
  let casual = 0;
  casual += countSetMatches(words, CASUAL_WORDS) * 10;
  casual += contractionCount * 5;
  casual += exclCount * 4;
  casual += countPattern(text, /[?!]{2,}/g) * 6; // multiple ?!
  // Short sentences → casual
  if (avgSentLen < 12) casual += 8;
  if (avgSentLen < 8) casual += 6;
  // Informal punctuation
  casual += countPattern(text, /\.{3}/g) * 3; // ellipsis
  // First person heavy
  casual += firstPerson * 3;
  // Second person
  const secondPerson = countPattern(text, /\b(you|your|yours)\b/gi);
  casual += secondPerson * 3;

  // ── Persuasive signals ──
  let persuasive = 0;
  persuasive += countSetMatches(words, PERSUASIVE_WORDS) * 10;
  persuasive += countPattern(text, /\b(must|should|need to|have to)\b/gi) * 6;
  persuasive += countPattern(text, /\b(imagine|picture|visualize)\b/gi) * 8;
  persuasive += countPattern(text, /\?/g) * 3; // rhetorical questions
  persuasive += secondPerson * 4; // "you" targeting
  // Strong adjectives
  persuasive += countPattern(text, /\b(amazing|incredible|unbelievable|best|worst|greatest)\b/gi) * 5;
  // Imperative sentences (starts with verb)
  const imperativeCount = sentences.filter((s) => {
    const firstWord = s.split(/\s+/)[0]?.toLowerCase() || "";
    return /^(get|start|try|use|make|take|join|discover|learn|find|create|build|don't|let's)\b/.test(firstWord);
  }).length;
  persuasive += imperativeCount * 8;

  // ── Friendly signals ──
  let friendly = 0;
  friendly += countSetMatches(words, FRIENDLY_WORDS) * 10;
  friendly += countPattern(text, /\b(thank|thanks|appreciate|welcome)\b/gi) * 6;
  friendly += countPattern(text, /[!]/g) * 3; // exclamation = enthusiasm
  friendly += countPattern(text, /\b(hope|looking forward|can't wait)\b/gi) * 7;
  // Positive sentiment words
  friendly += countPattern(text, /\b(great|wonderful|amazing|love|enjoy|happy|glad|excited)\b/gi) * 4;
  // Inclusive language
  friendly += countPattern(text, /\b(we|our|together|let's|us)\b/gi) * 4;

  // ── Urgent signals ──
  let urgent = 0;
  urgent += countSetMatches(words, URGENT_WORDS) * 12;
  urgent += countPattern(text, /\b(now|today|tonight|immediately|asap)\b/gi) * 8;
  urgent += countPattern(text, /[!]{2,}/g) * 8; // multiple !!!
  urgent += countPattern(text, /\b(don't wait|hurry|last chance|closing|expires)\b/gi) * 10;
  urgent += countPattern(text, /\b(limited|only|final|deadline)\b/gi) * 6;
  // ALL CAPS words (3+ chars)
  const capsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
  urgent += capsWords * 6;
  // Short punchy sentences
  if (avgSentLen < 8) urgent += 5;

  // ── Analytical signals ──
  let analytical = 0;
  analytical += countSetMatches(words, ANALYTICAL_WORDS) * 10;
  analytical += countPattern(text, /\d+\.?\d*%?/g) * 4; // numbers/stats
  analytical += countPattern(text, /\b(per|ratio|rate|average|median|mean)\b/gi) * 6;
  analytical += countPattern(text, /\b(compared|versus|vs|contrast|difference)\b/gi) * 5;
  analytical += countPattern(text, /\b(shows|indicates|suggests|demonstrates|confirms)\b/gi) * 5;
  // Complex sentence structure (semicolons, colons)
  analytical += countPattern(text, /[;:]/g) * 4;
  // Longer sentences → analytical
  if (avgSentLen > 18) analytical += 5;
  if (avgSentLen > 25) analytical += 5;
  // Parenthetical asides
  analytical += countPattern(text, /\([^)]+\)/g) * 3;

  // ── Empathetic signals ──
  let empathetic = 0;
  empathetic += countSetMatches(words, EMPATHETIC_WORDS) * 10;
  empathetic += countPattern(text, /\b(understand|feel|sorry|apologize)\b/gi) * 7;
  empathetic += countPattern(text, /\b(difficult|hard|tough|struggle|challenge)\b/gi) * 5;
  empathetic += countPattern(text, /\b(hear|listen|here for|not alone)\b/gi) * 6;
  // Softening phrases
  empathetic += countPattern(text, /\b(I'm sorry|I understand|I can imagine|it's okay)\b/gi) * 8;
  // First person + emotional
  empathetic += firstPerson * 2;
  // Questions showing concern
  empathetic += countPattern(text, /\b(are you okay|how are you|how do you feel|what's wrong)\b/gi) * 10;

  return { formal, casual, persuasive, friendly, urgent, analytical, empathetic };
}

// ─── Generate Tips ───────────────────────────────────────────────────

function generateTips(primary: ToneType, secondary: ToneType | null, scores: ToneSignals): string[] {
  const tips: string[] = [];

  if (primary === "formal") {
    tips.push("Your writing uses formal, professional language — great for business and academic contexts.");
    tips.push("Consider adding contractions (it's, we're) to feel more approachable for general audiences.");
    if (scores.casual < 5) tips.push("Very low casual score — readers may perceive this as stiff or impersonal.");
  }

  if (primary === "casual") {
    tips.push("Your tone is relaxed and conversational — perfect for social media and blogs.");
    tips.push("For professional contexts, try replacing slang with more precise vocabulary.");
    if (scores.formal < 5) tips.push("Almost no formal markers — may not suit business or academic settings.");
  }

  if (primary === "persuasive") {
    tips.push("Strong persuasive tone detected — you're making a compelling case.");
    tips.push("Back up claims with data or examples to increase credibility.");
    tips.push("Balance urgency with value — explain the benefit, not just the action.");
  }

  if (primary === "friendly") {
    tips.push("Warm and welcoming tone — readers will feel at ease.");
    tips.push("Great for community posts, newsletters, and customer communications.");
    if (scores.formal < 3) tips.push("Add some structure (numbered lists, clear sections) for longer content.");
  }

  if (primary === "urgent") {
    tips.push("High urgency detected — use sparingly to avoid 'alarm fatigue.'");
    tips.push("Pair urgency with a clear benefit — tell readers what they gain by acting.");
    tips.push("Overusing urgency can reduce trust. Reserve for genuine time-sensitive content.");
  }

  if (primary === "analytical") {
    tips.push("Data-driven, logical tone — excellent for reports and technical writing.");
    tips.push("Add real-world examples or analogies to make data more accessible.");
    if (scores.casual < 3) tips.push("Very analytical — consider adding a brief summary in plain language.");
  }

  if (primary === "empathetic") {
    tips.push("Compassionate, understanding tone — readers will feel heard and supported.");
    tips.push("Great for customer support, counseling, and community management.");
    tips.push("Pair empathy with clear next steps to help readers move forward.");
  }

  // Mixed tone advice
  if (secondary) {
    tips.push(`Secondary tone: ${TONE_META[secondary].label} — your writing blends ${TONE_META[primary].label} with ${TONE_META[secondary].label} elements.`);
  }

  return tips.slice(0, 5);
}

// ─── Main Analyzer ───────────────────────────────────────────────────

export function analyzeTone(text: string): ToneResult | null {
  if (!text || text.trim().length < 20) return null;

  const trimmed = text.trim();
  const words = getWords(trimmed);
  const sentences = splitSentences(trimmed);

  if (words.length < 5 || sentences.length < 1) return null;

  // Score the full text
  const rawScores = scoreToneForText(trimmed, words, sentences);

  // Normalize scores to 0-100
  const maxPossible = Math.max(...Object.values(rawScores), 30);
  const normalize = (raw: number) => Math.min(100, Math.round((raw / maxPossible) * 100));

  const tones: ToneScore[] = (Object.keys(rawScores) as ToneType[])
    .map((tone) => ({
      ...TONE_META[tone],
      tone,
      score: normalize(rawScores[tone]),
    }))
    .sort((a, b) => b.score - a.score);

  // Boost the top tone slightly for clarity
  if (tones[0]) tones[0].score = Math.min(100, tones[0].score + 5);

  const primary = tones[0];
  const secondary = tones[1]?.score > 25 ? tones[1].tone : null;

  // Emotional intensity = average of non-dominant tones' scores
  const nonPrimaryScores = tones.slice(1).map((t) => t.score);
  const emotionalIntensity = Math.round(
    nonPrimaryScores.reduce((a, b) => a + b, 0) / Math.max(nonPrimaryScores.length, 1)
  );

  // Per-sentence analysis
  const sentenceTones: SentenceTone[] = sentences.map((sentence, idx) => {
    const sWords = getWords(sentence);
    const sScores = scoreToneForText(sentence, sWords, [sentence]);
    const sMax = Math.max(...Object.values(sScores), 1);
    const topTone = (Object.keys(sScores) as ToneType[]).sort(
      (a, b) => sScores[b] - sScores[a]
    )[0] as ToneType;
    const confidence = Math.min(100, Math.round((sScores[topTone] / sMax) * 100));
    return {
      index: idx + 1,
      text: sentence.length > 120 ? sentence.slice(0, 117) + "..." : sentence,
      tone: topTone,
      confidence,
    };
  });

  // Stats
  const stats: ToneStats = {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: Math.round(words.length / Math.max(sentences.length, 1)),
    questionCount: countPattern(trimmed, /\?/g),
    exclamationCount: countPattern(trimmed, /!/g),
    firstPersonCount: countPattern(trimmed, /\b(I|me|my|we|us|our)\b/gi),
    secondPersonCount: countPattern(trimmed, /\b(you|your|yours)\b/gi),
    passiveVoiceCount: countPattern(trimmed, /\b(was|were|is|are|been|being)\s+\w+ed\b/gi),
  };

  // Tips
  const tips = generateTips(primary.tone, secondary, rawScores);

  return {
    tones,
    primary,
    emotionalIntensity,
    tips,
    sentenceTones,
    stats,
  };
}
