/**
 * AI Text Analyzer — Client-side heuristic detection of AI-generated text.
 * No server calls. No API keys. Pure math + pattern matching.
 * Score 0-100 (higher = more likely AI-generated)
 */

export interface AIScore {
  overall: number;
  label: string;
  color: "green" | "yellow" | "red";
  metrics: {
    sentenceVariance: MetricResult;
    vocabularyRichness: MetricResult;
    burstiness: MetricResult;
    aiPhrases: MetricResult;
    starterRepetition: MetricResult;
    paragraphUniformity: MetricResult;
  };
  lineScores: LineScore[];
  tips: string[];
  stats: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    avgSentenceLength: number;
    readingTimeMin: number;
  };
}

export interface MetricResult {
  score: number;
  label: string;
  description: string;
}

export interface LineScore {
  line: number;
  text: string;
  score: number;
  reason: string;
}

// Common ChatGPT fingerprints
const AI_PHRASES: RegExp[] = [
  /\bin (?:today's|this|the modern|our|the current)\s+(?:world|era|age|digital age|landscape|society)\b/i,
  /\bit(?:'s| is) (?:important|worth|crucial|essential|worthwhile|safe) to (?:note|mention|remember|understand|point out|say|emphasize|consider)\b/i,
  /\b(?:furthermore|moreover|additionally|consequently|nevertheless|nonetheless|subsequently|henceforth)\b/i,
  /\bin (?:conclusion|summary|essence|short|other words)\b/i,
  /\b(?:it's|it is) clear (?:that|to see)\b/i,
  /\b(?:plays?|serves? as|acts? as) a (?:crucial|vital|essential|important|key|pivotal|significant) (?:role|part|component|element|factor|aspect)\b/i,
  /\b(?:let's|let us) (?:dive|explore|delve|take a (?:closer|deep(?:er)?) look|examine|unpack|break down|consider)\b/i,
  /\b(?:a testament|a prime example|a perfect example|a great example) (?:to|of)\b/i,
  /\b(?:by harnessing|by leveraging|by utilizing|through the use of)\b/i,
  /\b(?:it's|it is) not (?:just|only|merely)\b/i,
  /\b(?:the (?:key|importance|power|beauty|magic|genius) (?:of|behind|lies in))\b/i,
  /\b(?:think about|imagine|consider) (?:it|this|for a moment)\b/i,
  /\b(?:at (?:the end of|its core|its heart|the end of the day))\b/i,
  /\b(?:game.?changer|game.?changing|cutting.?edge|state.?of.?the.?art|next.?generation)\b/i,
  /\b(?:seamless(?:ly)?|robust|comprehensive|innovative|streamlined|holistic|synerg(?:y|istic))\b/i,
  /\b(?:in (?:order|an effort|a bid|attempt)) to\b/i,
  /\b(?:the reality is|the truth is|the fact (?:remains|is))\b/i,
  /\b(?:when it comes to|whether you(?:'re| are))\b/i,
  /\b(?:not only\b.*\bbut also)\b/i,
  /\b(?:one of the (?:most|key|main|primary|biggest))\b/i,
  /\b(?:sheds? light|paves? the way|opens? doors?|sets? the stage)\b/i,
];

// ─── Helpers ──────────────────────────────────────────────────────────

function getSentences(text: string): string[] {
  return text
    .split(/[.!?。？！]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
}

function coefficientOfVariation(arr: number[]): number {
  const m = mean(arr);
  if (m === 0) return 0;
  return stdDev(arr) / m;
}

function normalizeToScore(value: number, lowGood: number, highBad: number): number {
  if (value <= lowGood) return 0;
  if (value >= highBad) return 100;
  return Math.round(((value - lowGood) / (highBad - lowGood)) * 100);
}

/**
 * Inverse: high value = GOOD (human-like) → low AI score.
 * Use for metrics where higher = more human (variance, richness, variety).
 */
function normalizeHighIsGood(value: number, lowBad: number, highGood: number): number {
  return 100 - normalizeToScore(value, lowBad, highGood);
}

// ─── Metric 1: Sentence Length Variance ───────────────────────────────

function analyzeSentenceVariance(sentences: string[]): MetricResult {
  if (sentences.length < 3) {
    return { score: 0, label: "Too short to analyze", description: "Sentence length uniformity" };
  }
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const cv = coefficientOfVariation(lengths);
  // LOW cv = uniform = AI-like (high score). HIGH cv = varied = human-like (low score)
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(cv, 0.2, 0.55)));
  return {
    score,
    label: cv < 0.3 ? "Very uniform — typical of AI" : cv < 0.5 ? "Somewhat uniform" : "Varied — human-like",
    description: "How varied are sentence lengths? AI writes uniform sentences; humans vary short and long.",
  };
}

// ─── Metric 2: Vocabulary Richness ────────────────────────────────────

function analyzeVocabularyRichness(words: string[]): MetricResult {
  if (words.length < 20) {
    return { score: 0, label: "Too short to analyze", description: "Vocabulary diversity" };
  }
  const uniqueWords = new Set(words);
  const ttr = uniqueWords.size / words.length;
  const lengthAdjustment = Math.max(0, 1 - words.length / 2000);
  const adjustedTTR = ttr + lengthAdjustment * 0.1;
  // LOW TTR = repetitive = AI-like (high score). HIGH TTR = rich = human-like (low score)
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(adjustedTTR, 0.35, 0.55)));
  return {
    score,
    label: adjustedTTR < 0.4 ? "Low diversity — AI-like" : adjustedTTR < 0.5 ? "Moderate diversity" : "Rich vocabulary — human-like",
    description: "How diverse is the vocabulary? AI reuses common words; humans use richer language.",
  };
}

// ─── Metric 3: Burstiness ─────────────────────────────────────────────

function analyzeBurstiness(sentences: string[]): MetricResult {
  if (sentences.length < 4) {
    return { score: 0, label: "Too short to analyze", description: "Text rhythm variation" };
  }
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const diffs: number[] = [];
  for (let i = 1; i < lengths.length; i++) {
    diffs.push(Math.abs(lengths[i] - lengths[i - 1]));
  }
  const avgDiff = mean(diffs);
  const diffVariance = stdDev(diffs);
  const burstiness = avgDiff * (1 + diffVariance / 10);
  // LOW burstiness = flat = AI-like (high score). HIGH burstiness = dynamic = human-like (low score)
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(burstiness, 4, 12)));
  return {
    score,
    label: burstiness < 5 ? "Flat rhythm — AI-like" : burstiness < 10 ? "Moderate rhythm" : "Dynamic rhythm — human-like",
    description: "Does the text alternate between short punchy and long complex sentences? AI is flat; humans are dynamic.",
  };
}

// ─── Metric 4: AI Phrase Detection ────────────────────────────────────

function analyzeAIPhrases(text: string, wordCount: number): MetricResult {
  if (wordCount < 20) {
    return { score: 0, label: "Too short to analyze", description: "AI phrase patterns" };
  }
  let matchCount = 0;
  for (const pattern of AI_PHRASES) {
    const matches = text.match(new RegExp(pattern.source, "gi"));
    if (matches) matchCount += matches.length;
  }
  const density = (matchCount / wordCount) * 1000;
  const score = Math.min(100, Math.max(0, normalizeToScore(density, 1.5, 5)));
  return {
    score,
    label: matchCount === 0 ? "No AI clichés found" : matchCount <= 2 ? "Few AI patterns" : `Found ${matchCount} AI-typical phrases`,
    description: "Common ChatGPT phrases like 'In today's world', 'It's worth noting', 'Furthermore', etc.",
  };
}

// ─── Metric 5: Sentence Starter Repetition ────────────────────────────

function analyzeStarterRepetition(sentences: string[]): MetricResult {
  if (sentences.length < 5) {
    return { score: 0, label: "Too short to analyze", description: "Sentence opening variety" };
  }
  const starters = sentences.map((s) => {
    const words = s.trim().split(/\s+/);
    return words.length >= 2 ? (words[0] + " " + words[1]).toLowerCase() : (words[0] ?? "").toLowerCase();
  });
  const starterCounts = new Map<string, number>();
  for (const s of starters) starterCounts.set(s, (starterCounts.get(s) ?? 0) + 1);
  const maxRepeat = Math.max(...starterCounts.values());
  const uniqueStarters = starterCounts.size;
  const repetitionRatio = uniqueStarters / sentences.length;
  // LOW ratio = repetitive starters = AI-like (high score). HIGH ratio = varied = human-like (low score)
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(repetitionRatio, 0.35, 0.65)));
  const topRepeated = [...starterCounts.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topLabel = topRepeated.length > 0
    ? `Repeats: "${topRepeated[0][0]}" (${topRepeated[0][1]}x)`
    : "Varied sentence openings";
  return {
    score,
    label: maxRepeat > 3 ? `High repetition — "${topRepeated[0]?.[0]}" used ${maxRepeat}x` : topLabel,
    description: "Does the text start sentences the same way repeatedly? AI repeats patterns; humans vary.",
  };
}

// ─── Metric 6: Paragraph Uniformity ───────────────────────────────────

function analyzeParagraphUniformity(paragraphs: string[]): MetricResult {
  if (paragraphs.length < 3) {
    return { score: 0, label: "Too short to analyze", description: "Paragraph length variety" };
  }
  const lengths = paragraphs.map((p) => p.split(/\s+/).length);
  const cv = coefficientOfVariation(lengths);
  // LOW cv = uniform paragraphs = AI-like (high score). HIGH cv = varied = human-like (low score)
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(cv, 0.15, 0.4)));
  return {
    score,
    label: cv < 0.2 ? "Uniform paragraphs — AI-like" : cv < 0.4 ? "Somewhat uniform" : "Varied paragraphs — human-like",
    description: "Are paragraphs similar in size? AI produces uniform blocks; humans vary.",
  };
}

// ─── Per-line scoring ─────────────────────────────────────────────────

function analyzeLineByLine(text: string): LineScore[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines.map((line, i) => {
    let score = 0;
    const reasons: string[] = [];
    const words = getWords(line);
    const sentences = getSentences(line);

    for (const pattern of AI_PHRASES) {
      if (pattern.test(line)) {
        score += 30;
        reasons.push("AI phrase detected");
        break;
      }
    }

    if (sentences.length >= 2) {
      const lengths = sentences.map((s) => s.split(/\s+/).length);
      const cv = coefficientOfVariation(lengths);
      if (cv < 0.15) {
        score += 20;
        reasons.push("Uniform sentence length");
      }
    }

    if (/\b(?:therefore|thus|hence|wherein|accordingly|aforementioned)\b/i.test(line)) {
      score += 15;
      reasons.push("Overly formal wording");
    }

    const hedgeCount = (line.match(/\b(?:may|might|could|can|perhaps|possibly|potentially|generally|typically|usually|often|tend to|seem to)\b/gi) ?? []).length;
    if (hedgeCount >= 2) {
      score += 15;
      reasons.push("Excessive hedging");
    }

    if (words.length > 30 && !/[!?]/.test(line) && !/[—–…]/.test(line)) {
      score += 10;
      reasons.push("Long formal sentence");
    }

    return {
      line: i + 1,
      text: line,
      score: Math.min(100, score),
      reason: reasons.join(", ") || "Looks natural",
    };
  });
}

// ─── Tips generator ───────────────────────────────────────────────────

function generateTips(metrics: AIScore["metrics"], overall: number): string[] {
  const tips: string[] = [];
  if (overall < 30) {
    tips.push("Your text looks naturally written! No major changes needed.");
    return tips;
  }
  if (metrics.sentenceVariance.score > 60) tips.push("Vary your sentence lengths — mix short punchy sentences with longer ones.");
  if (metrics.vocabularyRichness.score > 60) tips.push("Use more specific, unique words instead of common generic terms.");
  if (metrics.burstiness.score > 60) tips.push("Add very short sentences (3-5 words) between long ones to create rhythm.");
  if (metrics.aiPhrases.score > 60) tips.push("Replace AI clichés like 'In today's world' and 'It's worth noting' with your own voice.");
  if (metrics.starterRepetition.score > 60) tips.push("Start sentences differently — don't repeat 'It is' or 'This is' multiple times.");
  if (metrics.paragraphUniformity.score > 60) tips.push("Vary paragraph sizes — use 1-sentence paragraphs occasionally for emphasis.");
  if (tips.length === 0 && overall >= 30) tips.push("Your text has some AI patterns. Try rewriting sections in your own voice.");
  return tips;
}

// ─── Main analyzer ────────────────────────────────────────────────────

export function analyzeText(text: string): AIScore {
  const trimmed = text.trim();

  if (!trimmed || trimmed.length < 50) {
    return {
      overall: 0,
      label: "Too short",
      color: "green",
      metrics: {
        sentenceVariance: { score: 0, label: "Need more text", description: "Sentence length uniformity" },
        vocabularyRichness: { score: 0, label: "Need more text", description: "Vocabulary diversity" },
        burstiness: { score: 0, label: "Need more text", description: "Text rhythm variation" },
        aiPhrases: { score: 0, label: "Need more text", description: "AI phrase patterns" },
        starterRepetition: { score: 0, label: "Need more text", description: "Sentence opening variety" },
        paragraphUniformity: { score: 0, label: "Need more text", description: "Paragraph length variety" },
      },
      lineScores: [],
      tips: ["Paste at least 2-3 paragraphs for accurate analysis."],
      stats: { wordCount: 0, sentenceCount: 0, paragraphCount: 0, avgSentenceLength: 0, readingTimeMin: 0 },
    };
  }

  const words = getWords(trimmed);
  const sentences = getSentences(trimmed);
  const paragraphs = getParagraphs(trimmed);

  const metrics = {
    sentenceVariance: analyzeSentenceVariance(sentences),
    vocabularyRichness: analyzeVocabularyRichness(words),
    burstiness: analyzeBurstiness(sentences),
    aiPhrases: analyzeAIPhrases(trimmed, words.length),
    starterRepetition: analyzeStarterRepetition(sentences),
    paragraphUniformity: analyzeParagraphUniformity(paragraphs),
  };

  const weights: Record<string, number> = {
    sentenceVariance: 0.2,
    vocabularyRichness: 0.15,
    burstiness: 0.25,
    aiPhrases: 0.2,
    starterRepetition: 0.1,
    paragraphUniformity: 0.1,
  };

  let overall = 0;
  for (const [key, weight] of Object.entries(weights)) {
    overall += metrics[key as keyof typeof metrics].score * weight;
  }
  overall = Math.round(overall);

  let label: string;
  let color: "green" | "yellow" | "red";
  if (overall < 30) {
    label = "Likely Human";
    color = "green";
  } else if (overall < 60) {
    label = "Mixed — Possibly AI-Edited";
    color = "yellow";
  } else {
    label = "Likely AI-Generated";
    color = "red";
  }

  const lineScores = analyzeLineByLine(trimmed);
  const tips = generateTips(metrics, overall);
  const stats = {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgSentenceLength: Math.round(mean(sentences.map((s) => s.split(/\s+/).length))),
    readingTimeMin: Math.max(1, Math.round(words.length / 238)),
  };

  return { overall, label, color, metrics, lineScores, tips, stats };
}
