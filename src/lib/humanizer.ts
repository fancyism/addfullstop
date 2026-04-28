/**
 * Humanizer — Rule-based text transformer that reduces AI patterns.
 *
 * Targets ALL 6 metrics the analyzer measures:
 * 1. AI Phrases — replace clichés, hedging, formal words
 * 2. Sentence Variance — inject short punchy sentences between long ones
 * 3. Burstiness — create alternating short/long rhythm
 * 4. Vocabulary Richness — replace generic words with specific ones
 * 5. Starter Repetition — rewrite repeated sentence beginnings
 * 6. Paragraph Uniformity — vary paragraph sizes
 *
 * All client-side. No API calls.
 */

export interface HumanizeResult {
  text: string;
  changes: HumanizeChange[];
  totalChanges: number;
}

export interface HumanizeChange {
  type: "contraction" | "cliché" | "hedging" | "sentence_split" | "passive" | "formal" | "burstiness" | "starter_fix" | "paragraph_fix" | "synonym";
  original: string;
  replacement: string;
  description: string;
}

// ─── Contraction map ──────────────────────────────────────────────────

const CONTRACTIONS: [RegExp, string][] = [
  [/\bI am\b/g, "I'm"],
  [/\bI have\b/g, "I've"],
  [/\bI will\b/g, "I'll"],
  [/\bI would\b/g, "I'd"],
  [/\bI had\b/g, "I'd"],
  [/\byou are\b/gi, "you're"],
  [/\byou have\b/gi, "you've"],
  [/\byou will\b/gi, "you'll"],
  [/\byou would\b/gi, "you'd"],
  [/\bhe is\b/g, "he's"],
  [/\bhe has\b/g, "he's"],
  [/\bhe will\b/g, "he'll"],
  [/\bhe would\b/g, "he'd"],
  [/\bshe is\b/g, "she's"],
  [/\bshe has\b/g, "she's"],
  [/\bshe will\b/g, "she'll"],
  [/\bshe would\b/g, "she'd"],
  [/\bit is\b/g, "it's"],
  [/\bit has\b/g, "it's"],
  [/\bit will\b/g, "it'll"],
  [/\bwe are\b/gi, "we're"],
  [/\bwe have\b/gi, "we've"],
  [/\bwe will\b/gi, "we'll"],
  [/\bwe would\b/gi, "we'd"],
  [/\bthey are\b/gi, "they're"],
  [/\bthey have\b/gi, "they've"],
  [/\bthey will\b/gi, "they'll"],
  [/\bthey would\b/gi, "they'd"],
  [/\bthat is\b/g, "that's"],
  [/\bthat has\b/g, "that's"],
  [/\bwho is\b/g, "who's"],
  [/\bwho has\b/g, "who's"],
  [/\bwhat is\b/g, "what's"],
  [/\bwhat has\b/g, "what's"],
  [/\bwhere is\b/g, "where's"],
  [/\bwhere has\b/g, "where's"],
  [/\bwhen is\b/g, "when's"],
  [/\bthere is\b/g, "there's"],
  [/\bthere has\b/g, "there's"],
  [/\bhere is\b/g, "here's"],
  [/\bdo not\b/gi, "don't"],
  [/\bdoes not\b/gi, "doesn't"],
  [/\bdid not\b/gi, "didn't"],
  [/\bhave not\b/gi, "haven't"],
  [/\bhas not\b/gi, "hasn't"],
  [/\bhad not\b/gi, "hadn't"],
  [/\bwill not\b/gi, "won't"],
  [/\bwould not\b/gi, "wouldn't"],
  [/\bcannot\b/gi, "can't"],
  [/\bcan not\b/gi, "can't"],
  [/\bcould not\b/gi, "couldn't"],
  [/\bshould not\b/gi, "shouldn't"],
  [/\bmust not\b/gi, "mustn't"],
  [/\bis not\b/gi, "isn't"],
  [/\bare not\b/gi, "aren't"],
  [/\bwas not\b/gi, "wasn't"],
  [/\bwere not\b/gi, "weren't"],
  [/\blet us\b/gi, "let's"],
];

// ─── AI cliché replacements ───────────────────────────────────────────

const CLICHÉ_REPLACEMENTS: [RegExp, string][] = [
  // Openings
  [/\bIn today's (?:digital )?(?:world|era|age|landscape)\b,?\s*/gi, ""],
  [/\bIn the modern (?:world|era|age|landscape)\b,?\s*/gi, ""],
  [/\bIn our (?:modern|current|digital) (?:world|society|era)\b,?\s*/gi, ""],

  // Filler phrases
  [/\bIt is (?:important|worth|crucial|essential) to (?:note|mention|remember|understand|point out|emphasize|consider) that\b/gi, "Note that"],
  [/\bIt's (?:important|worth|crucial|essential) to (?:note|mention|remember|understand|point out|emphasize|consider) that\b/gi, "Note that"],
  [/\bIt is worth noting that\b/gi, ""],
  [/\bIt's worth noting that\b/gi, ""],
  [/\bIt is worth mentioning that\b/gi, ""],
  [/\bIt goes without saying that\b/gi, ""],
  [/\bNeedless to say,?\s*/gi, ""],
  [/\bIt(?:'s| is) clear (?:that|to see)\b/gi, "Clearly,"],

  // Transitions
  [/\bFurthermore,?\s*/gi, "Also, "],
  [/\bMoreover,?\s*/gi, "Plus, "],
  [/\bAdditionally,?\s*/gi, ""],
  [/\bConsequently,?\s*/gi, "So, "],
  [/\bNevertheless,?\s*/gi, "But "],
  [/\bNonetheless,?\s*/gi, "Still, "],
  [/\bSubsequently,?\s*/gi, "Then "],
  [/\bIn conclusion,?\s*/gi, "Bottom line: "],
  [/\bIn summary,?\s*/gi, "TL;DR: "],
  [/\bIn essence,?\s*/gi, "Basically, "],
  [/\bIn other words,?\s*/gi, "Meaning, "],

  // Flowery descriptions
  [/\bplays? a (?:crucial|vital|essential|important|key|pivotal|significant) role in\b/gi, "matters for"],
  [/\bplays? a (?:crucial|vital|essential|important|key|pivotal|significant) role\b/gi, "matters"],
  [/\bserves? as a (?:crucial|vital|essential|important|key) (?:component|element|factor)\b/gi, "helps"],
  [/\bis of paramount importance\b/gi, "really matters"],
  [/\bis a game-changer\b/gi, "changes things"],
  [/\bis a testament to\b/gi, "shows"],
  [/\bshed(?:s)? light on\b/gi, "reveals"],
  [/\bpave(?:s)? the way for\b/gi, "opens the door for"],
  [/\bopens? doors?\b/gi, "creates opportunities"],
  [/\bsets? the stage for\b/gi, "prepares for"],

  // "The key/importance/power of"
  [/\bthe (?:key|importance|power|beauty|magic|genius) (?:of|behind|lies in)\b/gi, "what matters about"],

  // "Not just... but"
  [/\bIt(?:'s| is) not (?:just|only|merely)\b/gi, "It's more than"],

  // "Think about / imagine this"
  [/\b(?:think about|imagine|consider) (?:it|this|for a moment)[,.]?\s*/gi, ""],

  // "At its core / at the end of the day"
  [/\bAt (?:the end of|its core|its heart|the end of the day)[,.]?\s*/gi, ""],

  // Verbs
  [/\bleverage(?:s|d)?\b/gi, "use"],
  [/\butilize(?:s|d)?\b/gi, "use"],
  [/\bharness(?:es|ed)?\b/gi, "use"],
  [/\bby (?:harnessing|leveraging|utilizing)\b/gi, "by using"],
  [/\bthrough the use of\b/gi, "using"],
  [/\bimplement(?:s|ed)?\b/gi, "set up"],
  [/\bfacilitate(?:s|d)?\b/gi, "helps with"],
  [/\bendeavor(?:s|ed)?\b/gi, "try"],
  [/\bascertain(?:s|ed)?\b/gi, "find out"],
  [/\bcommence(?:s|d)?\b/gi, "start"],
  [/\bterminate(?:s|d)?\b/gi, "end"],
  [/\bstrive to\b/gi, "try to"],

  // Adjectives
  [/\bseamless(?:ly)?\b/gi, "smooth"],
  [/\brobust\b/gi, "solid"],
  [/\bcomprehensive\b/gi, "full"],
  [/\binnovative\b/gi, "new"],
  [/\bstreamlined\b/gi, "simple"],
  [/\bholistic(?:ally)?\b/gi, "overall"],
  [/\bcutting-edge\b/gi, "latest"],
  [/\bstate-of-the-art\b/gi, "modern"],
  [/\bnext-generation\b/gi, "new"],
  [/\bmultifaceted\b/gi, "complex"],

  // Hedging softeners
  [/\bIn order to\b/gi, "To"],
  [/\bFor the purpose of\b/gi, "To"],
  [/\bWith regard to\b/gi, "About"],
  [/\bWith respect to\b/gi, "About"],
  [/\bIn terms of\b/gi, "For"],
  [/\bWhen it comes to\b/gi, "For"],

  // Sentence patterns
  [/\bNot only\b/gi, ""],
  [/\bbut also\b/gi, "and"],

  // Filler beginnings
  [/\bThe reality is that\b,?\s*/gi, ""],
  [/\bThe truth is that\b,?\s*/gi, ""],
  [/\bThe fact (?:remains|is) that\b,?\s*/gi, ""],
  [/\bOne of the (?:most|key|main|primary|biggest) (?:things|factors|reasons|aspects)\b/gi, "A big thing"],

  // "Let's" phrases
  [/\bLet's (?:dive into|explore|delve into|take a (?:closer|deeper) look at|examine|unpack|break down)\b/gi, "Let's look at"],
];

// ─── Hedging word removal ─────────────────────────────────────────────

const HEDGE_REMOVALS: [RegExp, string][] = [
  [/\bpotentially\b,?\s*/gi, ""],
  [/\bpossibly\b,?\s*/gi, ""],
  [/\bperhaps\b,?\s*/gi, ""],
  [/\bgenerally speaking,?\s*/gi, ""],
  [/\bgenerally\b,?\s*/gi, ""],
  [/\btypically\b,?\s*/gi, ""],
  [/\busually\b,?\s*/gi, "often"],
  [/\bin many cases,?\s*/gi, ""],
  [/\bin most cases,?\s*/gi, ""],
  [/\bin some cases,?\s*/gi, ""],
  [/\bto a certain extent,?\s*/gi, ""],
  [/\bto some extent,?\s*/gi, ""],
  [/\bto a large extent,?\s*/gi, ""],
  [/\barguably,?\s*/gi, ""],
  [/\bsome would say\b,?\s*/gi, ""],
  [/\bit could be argued that\b,?\s*/gi, ""],
  [/\bit can be said that\b,?\s*/gi, ""],
  [/\bit should be noted that\b,?\s*/gi, ""],
  [/\bas a matter of fact,?\s*/gi, ""],
  [/\bin fact,?\s*/gi, ""],
];

// ─── Formal → casual ──────────────────────────────────────────────────

const FORMAL_CASUAL: [RegExp, string][] = [
  [/\btherefore,?\s*/gi, "so "],
  [/\bthus,?\s*/gi, "so "],
  [/\bhence,?\s*/gi, "so "],
  [/\bwherein\b/gi, "where"],
  [/\baccordingly,?\s*/gi, "so "],
  [/\baforementioned\b/gi, "mentioned"],
  [/\bheretofore\b/gi, "before"],
  [/\bhenceforth\b/gi, "from now on"],
  [/\bprior to\b/gi, "before"],
  [/\bsubsequent to\b/gi, "after"],
  [/\bin the event that\b/gi, "if"],
  [/\bin the absence of\b/gi, "without"],
  [/\bby means of\b/gi, "by"],
  [/\bon the basis of\b/gi, "based on"],
  [/\bwith the exception of\b/gi, "except for"],
  [/\bnotwithstanding\b/gi, "despite"],
  [/\bpertaining to\b/gi, "about"],
  [/\bregarding\b/gi, "about"],
  [/\bnumerous\b/gi, "many"],
  [/\bsufficient\b/gi, "enough"],
  [/\bendeavor\b/gi, "try"],
  [/\bcommence\b/gi, "start"],
  [/\bterminate\b/gi, "end"],
  [/\brender\b/gi, "make"],
  [/\bassist(?:ance)?\b/gi, "help"],
  [/\brequire(?:s|d)?\b/gi, "need"],
  [/\bpossess(?:es|ed)?\b/gi, "have"],
  [/\bobtain(?:s|ed)?\b/gi, "get"],
  [/\bconstruct(?:s|ed)?\b/gi, "build"],
  [/\bmodify(?:s|ied)?\b/gi, "change"],
  [/\bconsume(?:s|d)?\b/gi, "use"],
  [/\bdemonstrate(?:s|d)?\b/gi, "show"],
  [/\bindicate(?:s|d)?\b/gi, "show"],
  [/\bensure(?:s|d)?\b/gi, "make sure"],
];

// ─── Passive voice simplification ─────────────────────────────────────

const PASSIVE_SIMPLIFY: [RegExp, string][] = [
  [/\bwas established by\b/gi, "started"],
  [/\bwas created by\b/gi, "made"],
  [/\bwas developed by\b/gi, "built"],
  [/\bwas designed by\b/gi, "designed"],
  [/\bwas implemented by\b/gi, "set up by"],
  [/\bwas discovered by\b/gi, "found"],
  [/\bwas written by\b/gi, "wrote"],
  [/\bis considered to be\b/gi, "is"],
  [/\bis believed to be\b/gi, "might be"],
  [/\bis known to be\b/gi, "is"],
  [/\bare known to be\b/gi, "are"],
  [/\bhas been shown to\b/gi, "does"],
  [/\bhave been shown to\b/gi, "do"],
  [/\bcan be seen that\b/gi, "we see that"],
  [/\bcan be observed that\b/gi, "we see that"],
  [/\bshould be noted that\b/gi, "note that"],
];

// ─── Synonym enrichment (for vocabulary richness) ─────────────────────

const SYNONYM_REPLACEMENTS: [RegExp, string][] = [
  [/\bvery good\b/gi, "excellent"],
  [/\bvery bad\b/gi, "terrible"],
  [/\bvery big\b/gi, "massive"],
  [/\bvery small\b/gi, "tiny"],
  [/\bvery important\b/gi, "critical"],
  [/\bvery fast\b/gi, "rapid"],
  [/\bvery slow\b/gi, "sluggish"],
  [/\bvery old\b/gi, "ancient"],
  [/\bvery new\b/gi, "brand-new"],
  [/\bvery hard\b/gi, "grueling"],
  [/\bvery easy\b/gi, "effortless"],
  [/\bvery clear\b/gi, "obvious"],
  [/\bvery different\b/gi, "distinct"],
  [/\bvery similar\b/gi, "nearly identical"],
  [/\ba lot of\b/gi, "tons of"],
  [/\bmake sure\b/gi, "ensure"],
  [/\blook at\b/gi, "examine"],
  [/\bfind out\b/gi, "discover"],
  [/\bcome up with\b/gi, "devise"],
  [/\bgo up\b/gi, "rise"],
  [/\bgo down\b/gi, "drop"],
  [/\bget better\b/gi, "improve"],
  [/\bget worse\b/gi, "deteriorate"],
  [/\bkeep in mind\b/gi, "remember"],
  [/\bput together\b/gi, "assemble"],
  [/\bdeal with\b/gi, "tackle"],
  [/\bcarry out\b/gi, "execute"],
  [/\bbring about\b/gi, "cause"],
  [/\bfigure out\b/gi, "determine"],
  [/\bpoint out\b/gi, "highlight"],
];

// ─── Short punchy sentences for burstiness injection ───────────────────

const FILLER_SENTENCES = [
  "Right.",
  "Think about it.",
  "Simple as that.",
  "Here's the thing.",
  "Makes sense.",
  "No joke.",
  "Seriously.",
  "That's the key.",
  "And it shows.",
  "It adds up.",
  "Fair enough.",
  "Exactly.",
  "You can see why.",
  "That matters.",
  "It's that simple.",
];

// ─── Helpers ──────────────────────────────────────────────────────────

function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function sentenceWordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

// ─── Apply replacements helper ────────────────────────────────────────

function applyReplacements(
  text: string,
  replacements: [RegExp, string][],
  changes: HumanizeChange[],
  type: HumanizeChange["type"],
): string {
  let result = text;
  for (const [pattern, replacement] of replacements) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) {
      // Find what changed by re-running on the original
      const match = before.match(pattern);
      if (match && match[0].length > 1 && match[0].length < 80) {
        changes.push({
          type,
          original: match[0],
          replacement,
          description: `"${match[0]}" → "${replacement}"`,
        });
      }
    }
  }
  return result;
}

// ─── Step 1: Word-level replacements ───────────────────────────────────

function wordLevelPass(text: string, changes: HumanizeChange[]): string {
  let result = text;
  result = applyReplacements(result, CLICHÉ_REPLACEMENTS, changes, "cliché");
  result = applyReplacements(result, CONTRACTIONS, changes, "contraction");
  result = applyReplacements(result, HEDGE_REMOVALS, changes, "hedging");
  result = applyReplacements(result, FORMAL_CASUAL, changes, "formal");
  result = applyReplacements(result, PASSIVE_SIMPLIFY, changes, "passive");
  result = applyReplacements(result, SYNONYM_REPLACEMENTS, changes, "synonym");
  return result;
}

// ─── Step 2: Sentence-level restructuring (burstiness + variance) ──────

function sentenceLevelPass(text: string, changes: HumanizeChange[]): string {
  const sentences = getSentences(text);
  if (sentences.length < 4) return text;

  const result: string[] = [];
  let fillerIdx = 0;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const wc = sentenceWordCount(s);

    // Split very long sentences (>30 words) at natural break points
    if (wc > 30) {
      const splitPatterns = [/,\s+and\s+/i, /,\s+but\s+/i, /,\s+which\s+/i, /,\s+while\s+/i, /\s+—\s+/, /;\s+/];
      let didSplit = false;

      for (const pat of splitPatterns) {
        const m = s.match(pat);
        if (m && m.index && m.index > 20 && m.index < s.length - 20) {
          const part1 = s.slice(0, m.index).trim();
          const part2 = s.slice(m.index + m[0].length).trim();
          if (sentenceWordCount(part1) > 5 && sentenceWordCount(part2) > 5) {
            const p1 = /[.!?]$/.test(part1) ? part1 : part1 + ".";
            result.push(p1.charAt(0).toUpperCase() + p1.slice(1));
            result.push(part2.charAt(0).toUpperCase() + part2);
            changes.push({
              type: "sentence_split",
              original: s.slice(0, 60) + "...",
              replacement: "Split into 2 shorter sentences",
              description: "Broke a long sentence for better rhythm",
            });
            didSplit = true;
            break;
          }
        }
      }
      if (!didSplit) result.push(s);

      // Add a short filler after the split
      if (didSplit && result.length > 0) {
        const filler = FILLER_SENTENCES[fillerIdx % FILLER_SENTENCES.length];
        fillerIdx++;
        result.push(filler);
        changes.push({
          type: "burstiness",
          original: "(long sentence block)",
          replacement: filler,
          description: "Added short sentence for rhythm variation",
        });
      }
    } else {
      result.push(s);

      // Every 3-4 sentences of similar length, inject a short one for burstiness
      if (i > 0 && i % 3 === 2 && wc > 10) {
        const prev = sentences[i - 1];
        if (prev && Math.abs(sentenceWordCount(prev) - wc) < 5) {
          // Two consecutive similar-length sentences — inject contrast
          const filler = FILLER_SENTENCES[fillerIdx % FILLER_SENTENCES.length];
          fillerIdx++;
          result.push(filler);
          changes.push({
            type: "burstiness",
            original: "(uniform rhythm)",
            replacement: filler,
            description: "Added short sentence to break uniform rhythm",
          });
        }
      }
    }
  }

  return result.join(" ");
}

// ─── Step 3: Sentence starter variation ────────────────────────────────

const STARTER_REWRITES: [RegExp, string][] = [
  [/\bIt is (?:also|important|clear|worth|evident|necessary)\b/gi, "This is"],
  [/\bThis is because\b/gi, "Because"],
  [/\bThere are (?:many|several|various|numerous)\b/gi, "You'll find"],
  [/\bThis (?:means|allows|enables|helps|ensures)\b/gi, "What this does is"],
  [/\bWe can (?:see|observe|conclude|infer)\b/gi, "Looking at this, you"],
  [/\bOne (?:of the|thing|reason|way|approach)\b/gi, "A key"],
  [/\bThese (?:include|are|consist|involve)\b/gi, "Among them:"],
];

function starterVariationPass(text: string, changes: HumanizeChange[]): string {
  const sentences = getSentences(text);
  if (sentences.length < 5) return text;

  // Detect repeated starters (first 2 words)
  const starterCounts = new Map<string, number>();
  for (const s of sentences) {
    const words = s.trim().split(/\s+/);
    const starter = words.length >= 2 ? (words[0] + " " + words[1]).toLowerCase() : (words[0] ?? "").toLowerCase();
    starterCounts.set(starter, (starterCounts.get(starter) ?? 0) + 1);
  }

  // Find starters that repeat 2+ times
  const repeatedStarters = [...starterCounts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([s]) => s);

  if (repeatedStarters.length === 0) return text;

  let result = text;

  // Apply starter rewrites only to repeated patterns
  for (const [pattern, replacement] of STARTER_REWRITES) {
    const matches = result.match(new RegExp(pattern.source, "gi"));
    if (matches && matches.length >= 2) {
      // Replace only the 2nd+ occurrence to keep some variety
      let count = 0;
      result = result.replace(new RegExp(pattern.source, "gi"), (match) => {
        count++;
        if (count >= 2) {
          changes.push({
            type: "starter_fix",
            original: match,
            replacement,
            description: `Varied repeated starter "${match}" → "${replacement}"`,
          });
          return replacement;
        }
        return match;
      });
    }
  }

  return result;
}

// ─── Step 4: Paragraph-level restructuring ─────────────────────────────

function paragraphLevelPass(text: string, changes: HumanizeChange[]): string {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  if (paragraphs.length < 2) return text;

  const lengths = paragraphs.map((p) => p.split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Check if paragraphs are too uniform (all similar size)
  const cv = standardDeviation(lengths) / avgLen;
  if (cv > 0.3) return text; // Already varied enough

  const result: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const pLen = p.split(/\s+/).length;

    // If a paragraph is much longer than average, split it
    if (pLen > avgLen * 1.5 && pLen > 40) {
      const sentences = getSentences(p);
      if (sentences.length >= 4) {
        // Take first 2 sentences as a short emphasis paragraph
        const emphasis = sentences.slice(0, 2).join(" ");
        const rest = sentences.slice(2).join(" ");
        result.push(emphasis);
        result.push(rest);
        changes.push({
          type: "paragraph_fix",
          original: `1 paragraph (${pLen} words)`,
          replacement: `Split into 2 (${sentenceWordCount(emphasis)} + ${sentenceWordCount(rest)} words)`,
          description: "Split long paragraph for size variation",
        });
        continue;
      }
    }

    result.push(p);
  }

  return result.join("\n\n");
}

function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
}

// ─── Cleanup ──────────────────────────────────────────────────────────

function cleanup(text: string): string {
  return text
    .replace(/\s{2,}/g, " ")       // double spaces
    .replace(/\.\./g, ".")          // double periods
    .replace(/\.,/g, ",")           // period-comma
    .replace(/,\./g, ".")           // comma-period
    .replace(/\s+\./g, ".")         // space before period
    .replace(/\.\s*\./g, ".")       // consecutive periods
    .replace(/^\s+/gm, "")          // leading spaces
    .replace(/\s+$/gm, "")          // trailing spaces
    .replace(/^(?:Right|Think about it|Simple as that|Here's the thing|Makes sense|No joke|Seriously|That's the key|And it shows|It adds up|Fair enough|Exactly|You can see why|That matters|It's that simple)\.\s*(?:Right|Think about it|Simple as that|Here's the thing|Makes sense|No joke|Seriously|That's the key|And it shows|It adds up|Fair enough|Exactly|You can see why|That matters|It's that simple)\./gi, (match) => match.split(/\.\s*/)[0] + ".")
    .trim();
}

// ─── Main humanizer ───────────────────────────────────────────────────

export function humanizeText(text: string): HumanizeResult {
  const changes: HumanizeChange[] = [];
  let result = text;

  // Pass 1: Word-level (AI phrases, contractions, hedging, formal, passive, synonyms)
  result = wordLevelPass(result, changes);

  // Pass 2: Sentence-level (split long, inject short for burstiness)
  result = sentenceLevelPass(result, changes);

  // Pass 3: Starter variation (fix repeated beginnings)
  result = starterVariationPass(result, changes);

  // Pass 4: Paragraph-level (split uniform paragraphs)
  result = paragraphLevelPass(result, changes);

  // Cleanup artifacts
  result = cleanup(result);

  // Deduplicate similar changes
  const seen = new Set<string>();
  const uniqueChanges = changes.filter((c) => {
    const key = `${c.type}:${c.original}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    text: result,
    changes: uniqueChanges.slice(0, 50),
    totalChanges: uniqueChanges.length,
  };
}
