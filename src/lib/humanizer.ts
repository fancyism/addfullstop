/**
 * Humanizer — Rule-based text transformer that reduces AI patterns.
 *
 * Makes AI-generated text sound more natural by:
 * 1. Applying contractions ("do not" → "don't")
 * 2. Replacing AI clichés with natural alternatives
 * 3. Removing excessive hedging words
 * 4. Varying sentence structure (splitting long, combining short)
 * 5. Reducing passive voice patterns
 * 6. Adding sentence variety (burstiness)
 *
 * All client-side. No API calls.
 */

export interface HumanizeResult {
  text: string;
  changes: HumanizeChange[];
  totalChanges: number;
}

export interface HumanizeChange {
  type: "contraction" | "cliché" | "hedging" | "sentence_split" | "passive" | "formal";
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

  // Verbs
  [/\bleverage(?:s|d)?\b/gi, "use"],
  [/\butilize(?:s|d)?\b/gi, "use"],
  [/\bharness(?:es|ed)?\b/gi, "use"],
  [/\bimplement(?:s|ed)?\b/gi, "set up"],
  [/\bfacilitate(?:s|d)?\b/gi, "helps with"],
  [/\bendeavor(?:s|ed)?\b/gi, "try"],
  [/\bascertain(?:s|ed)?\b/gi, "find out"],
  [/\bcommence(?:s|d)?\b/gi, "start"],
  [/\bterminate(?:s|d)?\b/gi, "end"],
  [/\bendeavor to\b/gi, "try to"],
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

  // Sentence patterns — simplified (regex can't do back-references in replacements)
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
  [/\brequire(?:s|d)?\b/gi, "need$1"],
  [/\bpossess(?:es|ed)?\b/gi, "have$1"],
  [/\bobtain(?:s|ed)?\b/gi, "get$1"],
  [/\bconstruct(?:s|ed)?\b/gi, "build$1"],
  [/\bmodify(?:s|ied)?\b/gi, "change$1"],
  [/\bconsume(?:s|d)?\b/gi, "use$1"],
  [/\bdemonstrate(?:s|d)?\b/gi, "show$1"],
  [/\bindicate(?:s|d)?\b/gi, "show$1"],
  [/\bensure(?:s|d)?\b/gi, "make sure"],
];

// ─── Sentence splitting (burstiness) ──────────────────────────────────

function splitLongSentences(text: string, changes: HumanizeChange[]): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const result: string[] = [];

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    if (words.length > 30) {
      // Find a good split point — look for ", and", ", but", ", which", ", where"
      const splitPatterns = [/, and /i, /, but /i, /, which /i, /, where /i, /, while /i, /, although /i, / — /, /; /];
      let split = false;

      for (const pattern of splitPatterns) {
        const match = sentence.match(pattern);
        if (match && match.index && match.index > 20) {
          const idx = match.index;
          const part1 = sentence.slice(0, idx).trim();
          const part2 = sentence.slice(idx + match[0].length).trim();
          // Only split if both parts are substantial
          if (part1.split(/\s+/).length > 5 && part2.split(/\s+/).length > 5) {
            const first = /[.!?]$/.test(part1) ? part1 : part1 + ".";
            result.push(first.charAt(0).toUpperCase() + first.slice(1));
            result.push(part2.charAt(0).toUpperCase() + part2);
            changes.push({
              type: "sentence_split",
              original: sentence.slice(0, 80) + "...",
              replacement: `${first.slice(0, 40)}... → ${part2.slice(0, 40)}...`,
              description: "Split long sentence into two for better rhythm",
            });
            split = true;
            break;
          }
        }
      }
      if (!split) result.push(sentence);
    } else {
      result.push(sentence);
    }
  }

  return result.join(" ");
}

// ─── Passive voice detection & simplification ─────────────────────────

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

// ─── Main humanizer ───────────────────────────────────────────────────

function applyReplacements(
  text: string,
  replacements: [RegExp, string][],
  changes: HumanizeChange[],
  type: HumanizeChange["type"],
): string {
  let result = text;
  for (const [pattern, replacement] of replacements) {
    const matches = result.match(pattern);
    if (matches) {
      // Only record first occurrence to avoid spam
      const sample = matches[0];
      result = result.replace(pattern, replacement);
      if (sample.length > 1 && sample.length < 80) {
        changes.push({
          type,
          original: sample,
          replacement,
          description: `Replaced "${sample}" → "${replacement}"`,
        });
      }
    }
  }
  return result;
}

export function humanizeText(text: string): HumanizeResult {
  const changes: HumanizeChange[] = [];
  let result = text;

  // Step 1: AI clichés (biggest impact on score)
  result = applyReplacements(result, CLICHÉ_REPLACEMENTS, changes, "cliché");

  // Step 2: Contractions (makes text feel more natural/conversational)
  result = applyReplacements(result, CONTRACTIONS, changes, "contraction");

  // Step 3: Remove hedging (reduces "AI caution" patterns)
  result = applyReplacements(result, HEDGE_REMOVALS, changes, "hedging");

  // Step 4: Formal → casual (reduces stiffness)
  result = applyReplacements(result, FORMAL_CASUAL, changes, "formal");

  // Step 5: Passive voice simplification
  result = applyReplacements(result, PASSIVE_SIMPLIFY, changes, "passive");

  // Step 6: Split long sentences (increases burstiness)
  result = splitLongSentences(result, changes);

  // Clean up artifacts
  result = result
    .replace(/\s{2,}/g, " ")      // double spaces
    .replace(/\.\./g, ".")          // double periods
    .replace(/\.,/g, ",")           // period-comma
    .replace(/,\./g, ".")           // comma-period
    .replace(/\s+\./g, ".")         // space before period
    .replace(/\.\s*\./g, ".")       // consecutive periods
    .replace(/^\s+/gm, "")          // leading spaces on lines
    .replace(/\s+$/gm, "")          // trailing spaces on lines
    .trim();

  // Cap changes for display
  const displayChanges = changes.slice(0, 50);

  return {
    text: result,
    changes: displayChanges,
    totalChanges: changes.length,
  };
}
