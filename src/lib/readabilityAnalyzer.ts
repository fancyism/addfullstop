/**
 * Readability & Content Quality Analyzer — Production client-side analysis.
 *
 * 6 established readability formulas + content quality metrics.
 * All pure math. No API. Runs in browser.
 *
 * Formulas:
 * 1. Flesch Reading Ease (0-100, higher = easier)
 * 2. Flesch-Kincaid Grade Level (US school grade)
 * 3. Gunning Fog Index (years of education)
 * 4. Coleman-Liau Index (grade level, character-based)
 * 5. Automated Readability Index (grade level)
 * 6. SMOG Index (years of education)
 */

export interface ReadabilityResult {
  /** Flesch Reading Ease 0-100 */
  fleschScore: number;
  /** Letter grade A-F */
  grade: string;
  /** Color for grade display */
  gradeColor: "green" | "yellow" | "orange" | "red";
  /** Human-readable description */
  readingLevel: string;
  /** Target audience description */
  audience: string;
  metrics: {
    fleschKincaidGrade: MetricValue;
    gunningFog: MetricValue;
    colemanLiau: MetricValue;
    ari: MetricValue;
    smog: MetricValue;
  };
  stats: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    avgWordLength: number;
    complexWordCount: number; // 3+ syllables
    complexWordRatio: number;
    longSentenceCount: number; // 25+ words
    longSentenceRatio: number;
    readingTimeMin: number;
    speakingTimeMin: number;
  };
  tips: string[];
  sentenceAnalysis: SentenceAnalysis[];
}

export interface MetricValue {
  value: number;
  label: string;
  description: string;
  grade: string;
}

export interface SentenceAnalysis {
  index: number;
  text: string;
  wordCount: number;
  isLong: boolean;
  complexWords: string[];
}

// ─── Syllable Counter ────────────────────────────────────────────────

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 2) return 1;

  // Exception: common short words
  const exceptions: Record<string, number> = {
    the: 1, and: 1, for: 1, but: 1, not: 1, you: 1, all: 1, can: 1,
    had: 1, her: 1, was: 1, one: 1, our: 1, out: 1, are: 1, been: 1,
    some: 1, them: 1, then: 1, when: 1, give: 1, live: 1, have: 1,
    make: 1, name: 1, time: 1, very: 2, every: 3, anything: 3,
    everything: 4, business: 2, something: 2,
  };
  if (w in exceptions) return exceptions[w];

  // Count vowel groups
  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Silent 'e' at end (except after 'le' like "table")
  if (count > 1 && w.endsWith("e") && !w.endsWith("le")) {
    count--;
  }

  // 'le' at end adds a syllable only if preceded by consonant
  if (w.endsWith("le") && w.length > 2 && !vowels.includes(w[w.length - 3])) {
    // Already counted by vowel group
  }

  return Math.max(1, count);
}

function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3;
}

// ─── Text Helpers ─────────────────────────────────────────────────────

function getWords(text: string): string[] {
  return text
    .replace(/[^a-zA-Z\u00C0-\u024F\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && /[a-zA-Z]/.test(w));
}

function getSentences(text: string): string[] {
  return text
    .split(/[.!?。？！]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /[a-zA-Z]/.test(s));
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
}

// ─── Readability Formulas ─────────────────────────────────────────────

function fleschReadingEase(words: number, sentences: number, syllables: number): number {
  if (sentences === 0 || words === 0) return 0;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

function fleschKincaidGrade(words: number, sentences: number, syllables: number): number {
  if (sentences === 0 || words === 0) return 0;
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

function gunningFogIndex(words: number, sentences: number, complexWords: number): number {
  if (sentences === 0 || words === 0) return 0;
  return 0.4 * (words / sentences + 100 * (complexWords / words));
}

function colemanLiauIndex(chars: number, words: number, sentences: number): number {
  if (words === 0) return 0;
  const L = (chars / words) * 100; // avg letters per 100 words
  const S = (sentences / words) * 100; // avg sentences per 100 words
  return 0.0588 * L - 0.296 * S - 15.8;
}

function automatedReadabilityIndex(chars: number, words: number, sentences: number): number {
  if (words === 0 || sentences === 0) return 0;
  return 4.71 * (chars / words) + 0.5 * (words / sentences) - 21.43;
}

function smogIndex(polySyllables: number, sentences: number): number {
  if (sentences === 0) return 0;
  // Use at least 30 sentences for SMOG, adjust for shorter texts
  const adjusted = polySyllables * (30 / Math.min(sentences, 30));
  return 1.043 * Math.sqrt(adjusted) + 3.1291;
}

// ─── Grade Helper ─────────────────────────────────────────────────────

function gradeToLetter(grade: number): string {
  if (grade <= 4) return "A+";
  if (grade <= 6) return "A";
  if (grade <= 8) return "B";
  if (grade <= 10) return "C";
  if (grade <= 12) return "D";
  return "F";
}

function gradeLevelDescription(grade: number): { readingLevel: string; audience: string } {
  if (grade <= 4) return { readingLevel: "Very Easy", audience: "Elementary school (ages 9-10)" };
  if (grade <= 6) return { readingLevel: "Easy", audience: "Middle school (ages 11-12)" };
  if (grade <= 8) return { readingLevel: "Fairly Easy", audience: "General public / Teenagers" };
  if (grade <= 10) return { readingLevel: "Standard", audience: "High school students" };
  if (grade <= 12) return { readingLevel: "Fairly Difficult", audience: "College students" };
  if (grade <= 14) return { readingLevel: "Difficult", audience: "College graduates" };
  return { readingLevel: "Very Difficult", audience: "Professionals / Academics" };
}

function metricGrade(value: number): string {
  if (value <= 5) return "Easy";
  if (value <= 8) return "Standard";
  if (value <= 10) return "Moderate";
  if (value <= 13) return "Difficult";
  return "Very Difficult";
}

function fleschToColor(score: number): "green" | "yellow" | "orange" | "red" {
  if (score >= 60) return "green";
  if (score >= 40) return "yellow";
  if (score >= 25) return "orange";
  return "red";
}

// ─── Tips Generator ───────────────────────────────────────────────────

function generateReadabilityTips(
  stats: ReadabilityResult["stats"],
  fleschScore: number,
  avgGrade: number,
): string[] {
  const tips: string[] = [];

  if (fleschScore < 30) {
    tips.push("Your text is very difficult to read. Most readers will struggle — try shortening sentences and simplifying vocabulary.");
  } else if (fleschScore < 50) {
    tips.push("Your text is fairly difficult. Consider shortening some sentences for broader readability.");
  } else if (fleschScore >= 80) {
    tips.push("Very readable! Great for general audiences and web content.");
  }

  if (stats.avgWordsPerSentence > 25) {
    tips.push(`Your average sentence is ${Math.round(stats.avgWordsPerSentence)} words — aim for 15-20. Break up long sentences with periods.`);
  }

  if (stats.longSentenceRatio > 0.3) {
    tips.push(`${Math.round(stats.longSentenceRatio * 100)}% of your sentences are 25+ words. Try splitting every third long sentence into two.`);
  }

  if (stats.complexWordRatio > 0.15) {
    tips.push(`${Math.round(stats.complexWordRatio * 100)}% of your words are 3+ syllables. Swap some for simpler alternatives (e.g. "utilize" → "use").`);
  }

  if (avgGrade > 12) {
    tips.push("Your text reads at a college+ level. If targeting a general audience, aim for grade 8-10.");
  }

  if (stats.sentenceCount < 5) {
    tips.push("Very few sentences detected. Analysis is more accurate with 10+ sentences.");
  }

  if (stats.paragraphCount === 1) {
    tips.push("Your text is one single block. Break it into 3-5 sentence paragraphs for scannability.");
  }

  if (tips.length === 0) {
    tips.push("Your text has good readability balance. No major changes needed.");
  }

  return tips;
}

// ─── Main Export ──────────────────────────────────────────────────────

export function analyzeReadability(text: string): ReadabilityResult | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 50) return null;

  const words = getWords(trimmed);
  const sentences = getSentences(trimmed);
  const paragraphs = getParagraphs(trimmed);

  if (words.length < 10 || sentences.length < 2) return null;

  // Count syllables and complex words
  let totalSyllables = 0;
  let complexWordCount = 0;
  let polySyllableCount = 0; // 3+ syllables for SMOG
  const wordSyllableMap = new Map<string, number>();

  for (const word of words) {
    const syl = countSyllables(word);
    totalSyllables += syl;
    wordSyllableMap.set(word.toLowerCase(), syl);
    if (syl >= 3) {
      complexWordCount++;
      polySyllableCount++;
    }
  }

  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  const totalWords = words.length;
  const totalSentences = sentences.length;

  // Calculate all formulas
  const flesch = fleschReadingEase(totalWords, totalSentences, totalSyllables);
  const fkGrade = fleschKincaidGrade(totalWords, totalSentences, totalSyllables);
  const fog = gunningFogIndex(totalWords, totalSentences, complexWordCount);
  const colemanLiau = colemanLiauIndex(totalChars, totalWords, totalSentences);
  const ari = automatedReadabilityIndex(totalChars, totalWords, totalSentences);
  const smog = smogIndex(polySyllableCount, totalSentences);

  const fleschRounded = Math.round(flesch * 10) / 10;
  const avgGrade = (fkGrade + fog + colemanLiau + ari + smog) / 5;

  const { readingLevel, audience } = gradeLevelDescription(avgGrade);
  const gradeColor = fleschToColor(flesch);

  // Stats
  const avgWordsPerSentence = totalWords / totalSentences;
  const longSentenceCount = sentences.filter((s) => s.split(/\s+/).length >= 25).length;

  const stats: ReadabilityResult["stats"] = {
    wordCount: totalWords,
    sentenceCount: totalSentences,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round((totalSyllables / totalWords) * 100) / 100,
    avgWordLength: Math.round((totalChars / totalWords) * 10) / 10,
    complexWordCount,
    complexWordRatio: complexWordCount / totalWords,
    longSentenceCount,
    longSentenceRatio: longSentenceCount / totalSentences,
    readingTimeMin: Math.max(1, Math.round(totalWords / 238)),
    speakingTimeMin: Math.max(1, Math.round(totalWords / 150)),
  };

  // Metrics
  const metrics: ReadabilityResult["metrics"] = {
    fleschKincaidGrade: {
      value: Math.round(fkGrade * 10) / 10,
      label: `Grade ${Math.round(fkGrade)}`,
      description: "Flesch-Kincaid Grade Level",
      grade: metricGrade(fkGrade),
    },
    gunningFog: {
      value: Math.round(fog * 10) / 10,
      label: `Grade ${Math.round(fog)}`,
      description: "Gunning Fog Index",
      grade: metricGrade(fog),
    },
    colemanLiau: {
      value: Math.round(colemanLiau * 10) / 10,
      label: `Grade ${Math.round(colemanLiau)}`,
      description: "Coleman-Liau Index",
      grade: metricGrade(colemanLiau),
    },
    ari: {
      value: Math.round(ari * 10) / 10,
      label: `Grade ${Math.round(ari)}`,
      description: "Automated Readability Index",
      grade: metricGrade(ari),
    },
    smog: {
      value: Math.round(smog * 10) / 10,
      label: `Grade ${Math.round(smog)}`,
      description: "SMOG Index",
      grade: metricGrade(smog),
    },
  };

  // Per-sentence analysis
  const sentenceAnalysis: SentenceAnalysis[] = sentences.slice(0, 50).map((s, i) => {
    const sWords = s.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
    const complexWords = sWords
      .filter((w) => isComplexWord(w.replace(/[^a-zA-Z]/g, "")))
      .map((w) => w.replace(/[^a-zA-Z]/g, "").toLowerCase());
    return {
      index: i + 1,
      text: s.length > 120 ? s.slice(0, 117) + "..." : s,
      wordCount: sWords.length,
      isLong: sWords.length >= 25,
      complexWords: [...new Set(complexWords)],
    };
  });

  const tips = generateReadabilityTips(stats, flesch, avgGrade);

  return {
    fleschScore: fleschRounded,
    grade: gradeToLetter(avgGrade),
    gradeColor,
    readingLevel,
    audience,
    metrics,
    stats,
    tips,
    sentenceAnalysis,
  };
}
