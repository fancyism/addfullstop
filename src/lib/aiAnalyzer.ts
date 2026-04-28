/**
 * AI Text Analyzer — Production-grade client-side heuristic detection.
 *
 * 10 document-level metrics + 18 sentence-level signals.
 * Multiplicative scoring when signals cluster.
 * Inspired by GPTZero, Originality.ai, and academic research on
 * Zipf's law conformity, punctuation entropy, and distributional analysis.
 *
 * Score 0-100 (higher = more likely AI-generated)
 * No server calls. No API keys. Pure math + pattern matching.
 */

export interface AIScore {
  overall: number;
  label: string;
  color: "green" | "yellow" | "red";
  metrics: {
    zipfConformity: MetricResult;
    aiPhrases: MetricResult;
    punctuationEntropy: MetricResult;
    sentenceVariance: MetricResult;
    sentenceSkewness: MetricResult;
    starterRepetition: MetricResult;
    hapaxRatio: MetricResult;
    paragraphUniformity: MetricResult;
    vocabularyRichness: MetricResult;
    burstiness: MetricResult;
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

// ─── Phrase & Word Lists ─────────────────────────────────────────────

/** ChatGPT/GPT-4/Claude fingerprint phrases */
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
  /\b(?:here(?:'s| is) (?:what|why|how|the thing))\b/i,
  /\b(?:it goes without saying|needless to say|as you might expect)\b/i,
  /\b(?:paint(?:s|ed) a (?:picture|vivid))\b/i,
  /\b(?:the (?:bottom line|takeaway|key takeaway) is)\b/i,
  /\b(?:we (?:can|must|should|need to) (?:also|now|first|keep in mind))\b/i,
  /\b(?:has (?:never been|become increasingly|proven to be))\b/i,
  /\b(?:driving (?:force|factor|change|innovation|growth))\b/i,
];

/** AI-overused vocabulary — these words appear far more in LLM output */
const AI_OVERUSED_WORDS = new Set([
  "leverage", "comprehensive", "facilitate", "utilize", "implement",
  "streamline", "innovative", "holistic", "robust", "synergy",
  "stakeholder", "paradigm", "optimize", "scalable", "seamless",
  "transformative", "dynamic", "agile", "disrupt", "empower",
  "foster", "cultivate", "navigate", "underscore", "spearhead",
  "bolster", "multifaceted", "nuanced", "pivotal", "proactive",
  "actionable", "best practice", "deep dive", "growth mindset",
]);

/** Transition words AI overuses */
const TRANSITION_WORDS = new Set([
  "furthermore", "moreover", "additionally", "consequently", "nevertheless",
  "nonetheless", "subsequently", "henceforth", "therefore", "thus", "hence",
  "accordingly", "conversely", "alternatively", "specifically",
  "notably", "significantly", "essentially", "fundamentally", "ultimately",
  "moreover", "indeed", "arguably", "importantly",
]);

/** Passive voice patterns */
const PASSIVE_PATTERNS = [
  /\b(?:was|were|is|are|been|being)\s+\w+(?:ed|en|wn)\b/i,
  /\b(?:was|were|is|are|been|being)\s+(?:made|done|taken|given|known|seen|found|thought|considered|regarded|viewed|perceived|understood|expected|assumed|believed|developed|designed|created|established|implemented)\b/i,
];

/** Contraction pattern */
const HAS_CONTRACTION = /\b(?:don't|won't|can't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|doesn't|didn't|couldn't|shouldn't|wouldn't|mustn't|let's|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|that's|who's|what's|where's|when's|why's|how's|there's|here's|gonna|wanna|gotta)\b/i;

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

/** Fisher-Pearson coefficient of skewness */
function skewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const s = stdDev(arr);
  if (s === 0) return 0;
  const n = arr.length;
  return (n / ((n - 1) * (n - 2))) * arr.reduce((sum, v) => sum + ((v - m) / s) ** 3, 0);
}

/** Shannon entropy of inter-punctuation distances */
function shannonEntropy(text: string): number {
  const punctPositions: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[.!?;:,\-—–]/.test(text[i])) {
      punctPositions.push(i);
    }
  }
  if (punctPositions.length < 4) return 0;

  const distances: number[] = [];
  for (let i = 1; i < punctPositions.length; i++) {
    distances.push(punctPositions[i] - punctPositions[i - 1]);
  }

  const freq = new Map<number, number>();
  for (const d of distances) freq.set(d, (freq.get(d) ?? 0) + 1);

  const total = distances.length;
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

/** Zipf's law conformity — R² of log(rank) vs log(frequency) */
function zipfRSquared(words: string[]): number {
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const counts = [...freq.values()].sort((a, b) => b - a);
  if (counts.length < 15) return 0;

  // Use top 80% of ranks to avoid noise from long-tail hapax legomena
  const cutoff = Math.min(counts.length, Math.max(30, Math.floor(counts.length * 0.8)));
  const ranks = counts.slice(0, cutoff);

  const logRanks = ranks.map((_, i) => Math.log(i + 1));
  const logFreqs = ranks.map((c) => Math.log(c));

  const n = logRanks.length;
  const sumX = logRanks.reduce((a, b) => a + b, 0);
  const sumY = logFreqs.reduce((a, b) => a + b, 0);
  const sumXY = logRanks.reduce((s, x, i) => s + x * logFreqs[i], 0);
  const sumX2 = logRanks.reduce((s, x) => s + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;

  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;

  const yMean = sumY / n;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = a + b * logRanks[i];
    ssRes += (logFreqs[i] - yPred) ** 2;
    ssTot += (logFreqs[i] - yMean) ** 2;
  }

  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

/** Hapax legomena ratio — fraction of words appearing exactly once */
function hapaxLegomenaRatio(words: string[]): number {
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const hapaxCount = [...freq.values()].filter((c) => c === 1).length;
  const uniqueCount = freq.size;
  return uniqueCount === 0 ? 0 : hapaxCount / uniqueCount;
}

function normalizeToScore(value: number, lowGood: number, highBad: number): number {
  if (value <= lowGood) return 0;
  if (value >= highBad) return 100;
  return Math.round(((value - lowGood) / (highBad - lowGood)) * 100);
}

/** Inverse: high value = GOOD (human-like) → low AI score */
function normalizeHighIsGood(value: number, lowBad: number, highGood: number): number {
  return 100 - normalizeToScore(value, lowBad, highGood);
}

function scoreLabel(score: number, low: string, mid: string, high: string): string {
  if (score < 33) return low;
  if (score < 66) return mid;
  return high;
}

// ─── Metric 1: Zipf's Law Conformity ────────────────────────────────

function analyzeZipfConformity(words: string[]): MetricResult {
  if (words.length < 100) {
    return { score: 0, label: "Too short to analyze", description: "Zipf's law conformity — AI follows Zipf almost perfectly" };
  }
  const r2 = zipfRSquared(words);
  // AI text: R² > 0.97 (follows Zipf perfectly). Human: R² < 0.93 (deviates)
  const score = Math.min(100, Math.max(0, normalizeToScore(r2, 0.92, 0.97)));
  return {
    score,
    label: r2 > 0.96 ? "Follows Zipf perfectly — AI-like" : r2 > 0.93 ? "Close to Zipf distribution" : "Deviates from Zipf — human-like",
    description: "Does word frequency follow Zipf's law perfectly? AI produces near-perfect Zipfian distributions; humans deviate.",
  };
}

// ─── Metric 2: AI Phrase Detection ────────────────────────────────────

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
  const score = Math.min(100, Math.max(0, normalizeToScore(density, 5, 25)));
  let label: string;
  if (matchCount === 0) label = "No AI clichés found";
  else if (score < 30) label = `${matchCount} minor pattern${matchCount > 1 ? "s" : ""} — acceptable`;
  else if (score < 60) label = `Found ${matchCount} AI-typical phrase${matchCount > 1 ? "s" : ""}`;
  else label = `Heavy AI phrasing — ${matchCount} cliché${matchCount > 1 ? "s" : ""} detected`;
  return {
    score,
    label,
    description: "ChatGPT fingerprints like 'In today's world', 'It's worth noting', 'Furthermore', etc.",
  };
}

// ─── Metric 3: Punctuation Entropy ────────────────────────────────

function analyzePunctuationEntropy(text: string): MetricResult {
  if (text.length < 100) {
    return { score: 0, label: "Too short to analyze", description: "Punctuation placement regularity" };
  }
  const entropy = shannonEntropy(text);
  // AI: low entropy (regular). Human: high entropy (chaotic).
  // Typical ranges: AI ~2.0-3.5, Human ~3.5-5.5
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(entropy, 2.5, 4.5)));
  return {
    score,
    label: entropy < 2.8 ? "Very regular punctuation — AI-like" : entropy < 3.8 ? "Moderate punctuation variety" : "Varied punctuation — human-like",
    description: "Are punctuation marks placed at regular or chaotic intervals? AI is regular; humans are chaotic.",
  };
}

// ─── Metric 4: Sentence Length Variance ───────────────────────────────

function analyzeSentenceVariance(sentences: string[]): MetricResult {
  if (sentences.length < 3) {
    return { score: 0, label: "Too short to analyze", description: "Sentence length uniformity" };
  }
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const cv = coefficientOfVariation(lengths);
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(cv, 0.2, 0.55)));
  return {
    score,
    label: score < 33 ? "Varied — human-like" : score < 66 ? "Somewhat uniform" : "Very uniform — typical of AI",
    description: "How varied are sentence lengths? AI writes uniform sentences; humans vary short and long.",
  };
}

// ─── Metric 5: Sentence Length Skewness ────────────────────────────────

function analyzeSentenceSkewness(sentences: string[]): MetricResult {
  if (sentences.length < 5) {
    return { score: 0, label: "Too short to analyze", description: "Sentence length distribution shape" };
  }
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const sk = skewness(lengths);
  // AI: skewness near 0 (symmetric bell curve). Human: positive skew (many short, occasional monster).
  // Typical: AI ~(-0.3 to 0.3), Human ~(0.3 to 1.5)
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(sk, -0.1, 0.6)));
  return {
    score,
    label: sk < 0.1 ? "Symmetric distribution — AI-like" : sk < 0.4 ? "Mild skew" : "Right-skewed — human-like (many short, some long)",
    description: "Is the sentence length distribution bell-shaped or skewed? AI produces bell curves; humans skew toward many short sentences.",
  };
}

// ─── Metric 6: Sentence Starter Repetition ────────────────────────────

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

// ─── Metric 7: Hapax Legomena Ratio ────────────────────────────────────

function analyzeHapaxRatio(words: string[]): MetricResult {
  if (words.length < 30) {
    return { score: 0, label: "Too short to analyze", description: "One-time word usage" };
  }
  const ratio = hapaxLegomenaRatio(words);
  // AI: lower ratio (~0.35-0.45), reuses words evenly. Human: higher (~0.45-0.65), more unique one-time words.
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(ratio, 0.38, 0.55)));
  return {
    score,
    label: ratio < 0.4 ? "Low unique words — AI-like" : ratio < 0.5 ? "Moderate uniqueness" : "Many one-time words — human-like",
    description: "What fraction of words appear exactly once? Humans use more specific, contextual vocabulary; AI reuses evenly.",
  };
}

// ─── Metric 8: Paragraph Uniformity ────────────────────────────────────

function analyzeParagraphUniformity(paragraphs: string[]): MetricResult {
  if (paragraphs.length < 3) {
    return { score: 0, label: "Too short to analyze", description: "Paragraph length variety" };
  }
  const lengths = paragraphs.map((p) => p.split(/\s+/).length);
  const cv = coefficientOfVariation(lengths);
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(cv, 0.15, 0.4)));
  return {
    score,
    label: score < 33 ? "Varied paragraphs — human-like" : score < 66 ? "Somewhat uniform" : "Uniform paragraphs — AI-like",
    description: "Are paragraphs similar in size? AI produces uniform blocks; humans vary.",
  };
}

// ─── Metric 9: Vocabulary Richness (TTR) ────────────────────────────────

function analyzeVocabularyRichness(words: string[]): MetricResult {
  if (words.length < 20) {
    return { score: 0, label: "Too short to analyze", description: "Vocabulary diversity" };
  }
  const uniqueWords = new Set(words);
  const ttr = uniqueWords.size / words.length;
  const lengthAdjustment = Math.max(0, 1 - words.length / 2000);
  const adjustedTTR = ttr + lengthAdjustment * 0.1;
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(adjustedTTR, 0.35, 0.55)));
  return {
    score,
    label: score < 33 ? "Rich vocabulary — human-like" : score < 66 ? "Moderate diversity" : "Low diversity — AI-like",
    description: "How diverse is the vocabulary? AI reuses common words; humans use richer language.",
  };
}

// ─── Metric 10: Burstiness ─────────────────────────────────────────────

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
  const score = Math.min(100, Math.max(0, normalizeHighIsGood(burstiness, 2, 6)));
  let label: string;
  if (score < 25) label = "Dynamic rhythm — human-like";
  else if (score < 50) label = "Good rhythm variation";
  else if (score < 75) label = "Somewhat flat rhythm";
  else label = "Flat rhythm — AI-like";
  return {
    score,
    label,
    description: "Does the text alternate between short punchy and long complex sentences? AI is flat; humans are dynamic.",
  };
}

// ─── Per-line Scoring (18 signals, multiplicative) ───────────────────

interface SignalResult {
  detected: boolean;
  reason: string;
}

function analyzeSentenceSignals(sentence: string, words: string[], avgLen: number): SignalResult[] {
  const signals: SignalResult[] = [];

  // 1. No contractions (only flag if sentence is long enough)
  const hasContr = HAS_CONTRACTION.test(sentence);
  if (!hasContr && words.length > 8) {
    signals.push({ detected: true, reason: "No contractions" });
  } else {
    signals.push({ detected: false, reason: "" });
  }

  // 2. Transition word
  const firstFive = words.slice(0, 5).map((w) => w.toLowerCase());
  const hasTransition = firstFive.some((w) => TRANSITION_WORDS.has(w));
  if (hasTransition) {
    const found = firstFive.find((w) => TRANSITION_WORDS.has(w));
    signals.push({ detected: true, reason: `Transition: "${found}"` });
  } else {
    signals.push({ detected: false, reason: "" });
  }

  // 3. AI filler phrase
  let fillerFound = "";
  for (const pattern of AI_PHRASES) {
    const match = sentence.match(new RegExp(pattern.source, "i"));
    if (match) {
      fillerFound = match[0];
      break;
    }
  }
  signals.push({ detected: fillerFound !== "", reason: fillerFound ? `AI cliché: "${fillerFound}"` : "" });

  // 4. Overused vocabulary
  const overused = words.filter((w) => AI_OVERUSED_WORDS.has(w.toLowerCase()));
  if (overused.length > 0) {
    const unique = [...new Set(overused.map((w) => w.toLowerCase()))];
    signals.push({ detected: true, reason: `Buzzword${unique.length > 1 ? "s" : ""}: ${unique.join(", ")}` });
  } else {
    signals.push({ detected: false, reason: "" });
  }

  // 5. Passive voice
  let passiveWord = "";
  for (const p of PASSIVE_PATTERNS) {
    const m = sentence.match(p);
    if (m) {
      passiveWord = m[0];
      break;
    }
  }
  signals.push({ detected: passiveWord !== "", reason: passiveWord ? `Passive: "${passiveWord}"` : "" });

  // 6. No question or exclamation
  const hasEmphasis = /[!?]/.test(sentence);
  signals.push({ detected: !hasEmphasis && words.length > 8, reason: !hasEmphasis && words.length > 8 ? "No emphasis marks" : "" });

  // 7. Uniform length (within 25% of average)
  if (avgLen > 0) {
    const len = words.length;
    const deviation = Math.abs(len - avgLen) / avgLen;
    signals.push({ detected: deviation < 0.15 && len > 5, reason: deviation < 0.15 && len > 5 ? `~${len} words (avg ${Math.round(avgLen)})` : "" });
  } else {
    signals.push({ detected: false, reason: "" });
  }

  // 8. Repeated starter (checked externally per-line, skip here)
  signals.push({ detected: false, reason: "" });

  // 9. Formal register
  const formalMatch = sentence.match(/\b(therefore|thus|hence|wherein|accordingly|aforementioned|whilst|amongst|shall)\b/i);
  signals.push({ detected: !!formalMatch, reason: formalMatch ? `Formal: "${formalMatch[0]}"` : "" });

  // 10. Excessive hedging
  const hedgeWords = sentence.match(/\b(?:may|might|could|can|perhaps|possibly|potentially|generally|typically|usually|often|tend to|seem to)\b/gi);
  if (hedgeWords && hedgeWords.length >= 2) {
    const unique = [...new Set(hedgeWords.map((h) => h.toLowerCase()))];
    signals.push({ detected: true, reason: `Hedging: ${unique.join(", ")} (${hedgeWords.length}x)` });
  } else {
    signals.push({ detected: false, reason: "" });
  }

  // 11. No dashes or em-dashes
  const hasDash = /[—–\-]{2,}/.test(sentence) || / – | — |\-{2}/.test(sentence);
  signals.push({ detected: !hasDash && words.length > 15, reason: "" });

  // 12. No parenthetical asides
  const hasParens = /\([^)]+\)/.test(sentence);
  signals.push({ detected: !hasParens && words.length > 15, reason: "" });

  // 13. Colon ending pattern
  signals.push({ detected: /:$/.test(sentence.trim()), reason: /:$/.test(sentence.trim()) ? "Ends with colon" : "" });

  // 14. Semicolon in academic style
  signals.push({ detected: sentence.includes(";") && words.length > 20, reason: sentence.includes(";") && words.length > 20 ? "Semicolon + long sentence" : "" });

  // 15. "Here's what/why/how" hook
  const hookMatch = sentence.match(/here(?:'s| is) (?:what|why|how|the (?:thing|reason|secret|key))/i);
  signals.push({ detected: !!hookMatch, reason: hookMatch ? `Hook: "${hookMatch[0]}"` : "" });

  // 16. Proper noun density
  const properNouns = (sentence.match(/\b[A-Z][a-z]{2,}\b/g) ?? []).filter((w) => !/^(The|This|That|These|Those|It|In|On|At|To|For|With|And|But|Or|So|Yet)$/.test(w));
  if (words.length > 5) {
    const density = properNouns.length / words.length;
    signals.push({ detected: density > 0.3, reason: density > 0.3 ? `High proper nouns (${Math.round(density * 100)}%)` : "" });
  } else {
    signals.push({ detected: false, reason: "" });
  }

  // 17. No informal language
  const hasInformal = /\b(?:gonna|wanna|gotta|kinda|sorta|yeah|nope|yep|wow|hey|oh|lol|btw|tbh|imo)\b/i.test(sentence);
  signals.push({ detected: !hasInformal && words.length > 12, reason: "" });

  // 18. Conclusion pattern
  const conclusionMatch = sentence.match(/\b(?:in (?:conclusion|summary|closing|short|wrap(?:ping)? up)|to (?:sum up|summarize|conclude)|ultimately|all in all|the (?:bottom line|takeaway) is)\b/i);
  signals.push({ detected: !!conclusionMatch, reason: conclusionMatch ? `Conclusion: "${conclusionMatch[0]}"` : "" });

  return signals;
}

function analyzeLineByLine(text: string, sentences: string[]): LineScore[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const sentLengths = sentences.map((s) => s.split(/\s+/).length);
  const avgLen = mean(sentLengths);

  return lines.map((line, i) => {
    const lineSentences = getSentences(line);
    const lineWords = getWords(line);
    let baseScore = 0;
    const reasons: string[] = [];

    // Check sentence starter repetition within this line
    if (lineSentences.length >= 3) {
      const starters = lineSentences.map((s) => s.trim().split(/\s+/)[0]?.toLowerCase());
      const firstWords = new Map<string, number>();
      for (const s of starters) firstWords.set(s, (firstWords.get(s) ?? 0) + 1);
      const maxStarter = Math.max(...firstWords.values());
      if (maxStarter >= 3) {
        baseScore += 10;
        const repeated = [...firstWords.entries()].find(([, c]) => c >= 3);
        if (repeated) reasons.push(`Starts ${repeated[1]} sentences with "${repeated[0]}"`);
      }
    }

    // Run 18 signals per sentence in this line
    let totalSignals = 0;
    const uniqueReasons = new Set<string>();
    for (const sent of lineSentences) {
      const sentWords = getWords(sent);
      const signals = analyzeSentenceSignals(sent, sentWords, avgLen);
      const trueSignals = signals.filter((s) => s.detected);
      totalSignals += trueSignals.length;
      for (const s of trueSignals) {
        if (s.reason) uniqueReasons.add(s.reason);
      }
      // Base score from individual signals
      baseScore += trueSignals.length * 8;
    }

    // Multiplicative boost: 3+ signals clustering = multiply
    if (totalSignals >= 6) {
      baseScore = Math.min(100, Math.round(baseScore * 2.0));
    } else if (totalSignals >= 4) {
      baseScore = Math.min(100, Math.round(baseScore * 1.5));
    }

    // Deduplicate reasons: remove "No contractions" if it appears >1 time (keep one)
    const seen = new Set<string>();
    const dedupedReasons: string[] = [];
    for (const r of uniqueReasons) {
      const normalized = r.replace(/\(\d+x\)$/, "").trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        dedupedReasons.push(r);
      }
    }

    return {
      line: i + 1,
      text: line,
      score: Math.min(100, baseScore),
      reason: dedupedReasons.length > 0 ? dedupedReasons.join(" · ") : "Looks natural",
    };
  });
}

// ─── Tips Generator (context-aware) ────────────────────────────────

function generateTips(
  text: string,
  sentences: string[],
  paragraphs: string[],
  words: string[],
  metrics: AIScore["metrics"],
  overall: number,
): string[] {
  const tips: string[] = [];
  if (overall < 30) {
    tips.push("Your text reads naturally! No major AI patterns detected.");
    return tips;
  }

  // Zipf conformity — explain what's happening
  if (metrics.zipfConformity.score > 50) {
    tips.push(
      "Your word frequency follows Zipf's law too perfectly — AI produces mathematically ideal distributions. Break the pattern: repeat some unusual words, avoid others entirely.",
    );
  }

  // AI phrases — name the actual phrases found
  if (metrics.aiPhrases.score > 40) {
    const foundPhrases: string[] = [];
    for (const pattern of AI_PHRASES) {
      const matches = text.match(new RegExp(pattern.source, "gi"));
      if (matches) {
        for (const m of matches) {
          if (!foundPhrases.includes(m)) foundPhrases.push(m);
        }
      }
    }
    const display = foundPhrases.slice(0, 5);
    const suffix = foundPhrases.length > 5 ? ` and ${foundPhrases.length - 5} more` : "";
    tips.push(
      `Replace these AI clichés: ${display.map((p) => `"${p}"`).join(", ")}${suffix}. Use your own voice instead.`,
    );
  }

  // Punctuation entropy
  if (metrics.punctuationEntropy.score > 50) {
    tips.push(
      "Your punctuation is too evenly spaced — real writing clusters commas and periods chaotically. Add a run-on sentence with several commas, then follow with a short fragment.",
    );
  }

  // Sentence variance — reference actual lengths
  if (metrics.sentenceVariance.score > 50) {
    const lengths = sentences.map((s) => s.split(/\s+/).length);
    const avg = Math.round(mean(lengths));
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    tips.push(
      `Your sentences are too uniform (avg ${avg} words, range ${min}–${max}). Mix in some 3–5 word punchy lines for rhythm.`,
    );
  }

  // Sentence skewness
  if (metrics.sentenceSkewness.score > 50) {
    tips.push(
      'Your sentence lengths form a bell curve — real writing has many short sentences and the occasional very long one. Try adding fragments like "Right." or "Think about it."',
    );
  }

  // Starter repetition — name the repeated starters
  if (metrics.starterRepetition.score > 50 && sentences.length >= 5) {
    const starters = sentences.map((s) => {
      const w = s.trim().split(/\s+/);
      return w.length >= 2 ? (w[0] + " " + w[1]).toLowerCase() : (w[0] ?? "").toLowerCase();
    });
    const counts = new Map<string, number>();
    for (const s of starters) counts.set(s, (counts.get(s) ?? 0) + 1);
    const repeated = [...counts.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (repeated.length > 0) {
      const list = repeated.map(([s, c]) => `"${s}" (${c}x)`).join(", ");
      tips.push(`These sentence starters repeat: ${list}. Vary your openings — start with a question, a fact, or a transition.`);
    }
  }

  // Hapax ratio
  if (metrics.hapaxRatio.score > 50) {
    tips.push(
      "Your vocabulary is reused too evenly. Use a distinctive, specific word once (like a technical term or colloquialism) and never repeat it — that's what humans do.",
    );
  }

  // Paragraph uniformity — reference actual sizes
  if (metrics.paragraphUniformity.score > 50 && paragraphs.length >= 3) {
    const pLens = paragraphs.map((p) => p.split(/\s+/).length);
    const pAvg = Math.round(mean(pLens));
    tips.push(
      `All ${paragraphs.length} paragraphs are ~${pAvg} words — too similar. Make one paragraph just 1–2 sentences for emphasis.`,
    );
  }

  // Vocabulary richness
  if (metrics.vocabularyRichness.score > 50) {
    const wordFreq = new Map<string, number>();
    for (const w of words) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
    const topRepeated = [...wordFreq.entries()]
      .filter(([, c]) => c > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w, c]) => `"${w}" (${c}x)`);
    if (topRepeated.length > 0) {
      tips.push(`These words repeat a lot: ${topRepeated.join(", ")}. Try synonyms or rephrasing.`);
    } else {
      tips.push("Vocabulary feels repetitive. Swap some common words for more specific alternatives.");
    }
  }

  // Burstiness
  if (metrics.burstiness.score > 50) {
    tips.push(
      'The rhythm is flat — every sentence feels the same length. Break it up: after a long sentence, add a short one like "Think about it." or "Right."',
    );
  }

  // Passive voice scan
  let passiveCount = 0;
  for (const p of PASSIVE_PATTERNS) {
    const m = text.match(new RegExp(p.source, "gi"));
    if (m) passiveCount += m.length;
  }
  if (passiveCount >= 3) {
    tips.push(
      `Found ${passiveCount} passive voice constructions (e.g., "was developed", "is considered"). Rewrite in active voice: "We developed" instead of "was developed".`,
    );
  }

  // Contraction absence
  const contractionCount = (text.match(HAS_CONTRACTION) ?? []).length;
  const sentCount = sentences.length;
  if (sentCount > 5 && contractionCount === 0) {
    tips.push(
      "No contractions found (don't, won't, can't, it's). Real casual writing uses them constantly. Add some to sound more natural.",
    );
  }

  // Fallback
  if (tips.length === 0 && overall >= 30) {
    tips.push("Some AI patterns detected. Try rewriting sections in your own voice for a more natural feel.");
  }

  return tips;
}

// ─── Main Analyzer ────────────────────────────────────────────────────

export function analyzeText(text: string): AIScore {
  const trimmed = text.trim();

  if (!trimmed || trimmed.length < 50) {
    return {
      overall: 0,
      label: "Too short",
      color: "green",
      metrics: {
        zipfConformity: { score: 0, label: "Need more text", description: "Zipf's law conformity" },
        aiPhrases: { score: 0, label: "Need more text", description: "AI phrase patterns" },
        punctuationEntropy: { score: 0, label: "Need more text", description: "Punctuation placement regularity" },
        sentenceVariance: { score: 0, label: "Need more text", description: "Sentence length uniformity" },
        sentenceSkewness: { score: 0, label: "Need more text", description: "Sentence length distribution shape" },
        starterRepetition: { score: 0, label: "Need more text", description: "Sentence opening variety" },
        hapaxRatio: { score: 0, label: "Need more text", description: "One-time word usage" },
        paragraphUniformity: { score: 0, label: "Need more text", description: "Paragraph length variety" },
        vocabularyRichness: { score: 0, label: "Need more text", description: "Vocabulary diversity" },
        burstiness: { score: 0, label: "Need more text", description: "Text rhythm variation" },
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
    zipfConformity: analyzeZipfConformity(words),
    aiPhrases: analyzeAIPhrases(trimmed, words.length),
    punctuationEntropy: analyzePunctuationEntropy(trimmed),
    sentenceVariance: analyzeSentenceVariance(sentences),
    sentenceSkewness: analyzeSentenceSkewness(sentences),
    starterRepetition: analyzeStarterRepetition(sentences),
    hapaxRatio: analyzeHapaxRatio(words),
    paragraphUniformity: analyzeParagraphUniformity(paragraphs),
    vocabularyRichness: analyzeVocabularyRichness(words),
    burstiness: analyzeBurstiness(sentences),
  };

  const weights: Record<string, number> = {
    zipfConformity: 0.15,
    aiPhrases: 0.15,
    punctuationEntropy: 0.08,
    sentenceVariance: 0.12,
    sentenceSkewness: 0.12,
    starterRepetition: 0.08,
    hapaxRatio: 0.06,
    paragraphUniformity: 0.10,
    vocabularyRichness: 0.06,
    burstiness: 0.08,
  };

  let overall = 0;
  for (const [key, weight] of Object.entries(weights)) {
    overall += metrics[key as keyof typeof metrics].score * weight;
  }
  overall = Math.round(overall);

  let label: string;
  let color: "green" | "yellow" | "red";
  if (overall < 25) {
    label = "Likely Human";
    color = "green";
  } else if (overall < 50) {
    label = "Mixed — Possibly AI-Edited";
    color = "yellow";
  } else {
    label = "Likely AI-Generated";
    color = "red";
  }

  const lineScores = analyzeLineByLine(trimmed, sentences);
  const tips = generateTips(trimmed, sentences, paragraphs, words, metrics, overall);
  const stats = {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgSentenceLength: Math.round(mean(sentences.map((s) => s.split(/\s+/).length))),
    readingTimeMin: Math.max(1, Math.round(words.length / 238)),
  };

  return { overall, label, color, metrics, lineScores, tips, stats };
}
