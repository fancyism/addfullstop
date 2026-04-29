/**
 * Paraphraser — Client-side heuristic rewrite engine (fallback when no AI).
 *
 * 8 target styles with rule-based transformations.
 * When AI is available, LLM handles rewriting. This is the offline fallback.
 */

// ─── Types ─────────────────────────────────────────────────────────────

export type RewriteStyle =
  | "academic"
  | "business"
  | "creative"
  | "casual"
  | "simple"
  | "email"
  | "formal"
  | "technical";

export interface RewriteStyleMeta {
  style: RewriteStyle;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  style: RewriteStyle;
  changes: RewriteChange[];
}

export interface RewriteChange {
  type: string;
  original: string;
  replacement: string;
}

// ─── Style Metadata ────────────────────────────────────────────────────

export const REWRITE_STYLES: RewriteStyleMeta[] = [
  { style: "academic", label: "Academic", emoji: "🎓", description: "Scholarly, formal, precise — for papers and research", color: "#6366f1" },
  { style: "business", label: "Business", emoji: "💼", description: "Professional, concise, action-oriented", color: "#0891b2" },
  { style: "creative", label: "Creative", emoji: "🎨", description: "Vivid, engaging, storytelling flair", color: "#d946ef" },
  { style: "casual", label: "Casual", emoji: "☕", description: "Like talking to a friend — relaxed and natural", color: "#f97316" },
  { style: "simple", label: "Simple / ELI5", emoji: "💡", description: "Explain like I'm 5 — short words, clear ideas", color: "#22c55e" },
  { style: "email", label: "Professional Email", emoji: "📧", description: "Clear, structured, with greeting and sign-off", color: "#3b82f6" },
  { style: "formal", label: "Formal / Legal", emoji: "⚖️", description: "Official, precise, authoritative", color: "#64748b" },
  { style: "technical", label: "Technical", emoji: "⚙️", description: "Documentation style — structured and precise", color: "#ef4444" },
];

// ─── Heuristic Rewrite Engine ──────────────────────────────────────────

export function rewriteText(text: string, style: RewriteStyle): RewriteResult {
  let rewritten = text;
  const changes: RewriteChange[] = [];

  // Split into sentences for per-sentence transformations
  const sentences = rewritten.split(/(?<=[.!?])\s+/);

  switch (style) {
    case "casual":
      rewritten = applyCasual(rewritten, changes);
      break;
    case "academic":
      rewritten = applyAcademic(rewritten, changes);
      break;
    case "business":
      rewritten = applyBusiness(rewritten, changes);
      break;
    case "simple":
      rewritten = applySimple(rewritten, sentences, changes);
      break;
    case "email":
      rewritten = applyEmail(rewritten, changes);
      break;
    case "formal":
      rewritten = applyFormal(rewritten, changes);
      break;
    case "creative":
      rewritten = applyCreative(rewritten, changes);
      break;
    case "technical":
      rewritten = applyTechnical(rewritten, changes);
      break;
  }

  return { original: text, rewritten, style, changes: changes.slice(0, 20) };
}

// ─── Style Transformers ────────────────────────────────────────────────

function applyCasual(text: string, changes: RewriteChange[]): string {
  let result = text;
  const replacements: [RegExp, string][] = [
    [/\bfurthermore\b/gi, "plus"],
    [/\bmoreover\b/gi, "also"],
    [/\bconsequently\b/gi, "so"],
    [/\btherefore\b/gi, "so"],
    [/\bhowever\b/gi, "but"],
    [/\bnevertheless\b/gi, "still"],
    [/\bin addition\b/gi, "and also"],
    [/\bin conclusion\b/gi, "so basically"],
    [/\bit is worth noting\b/gi, "worth mentioning"],
    [/\bIt is important to\b/gi, "It's key to"],
    [/\bI am\b/g, "I'm"],
    [/\bI have\b/g, "I've"],
    [/\bI will\b/g, "I'll"],
    [/\bdo not\b/gi, "don't"],
    [/\bcannot\b/gi, "can't"],
    [/\bwill not\b/gi, "won't"],
    [/\bshould not\b/gi, "shouldn't"],
    [/\bwould not\b/gi, "wouldn't"],
    [/\bIt is\b/g, "It's"],
    [/\bThat is\b/g, "That's"],
    [/\bThere is\b/g, "There's"],
    [/\bThey are\b/g, "They're"],
    [/\bWe are\b/g, "We're"],
    [/\bYou are\b/g, "You're"],
    [/\bdemonstrates\b/gi, "shows"],
    [/\butilize\b/gi, "use"],
    [/\bimplement\b/gi, "do"],
    [/\bfacilitate\b/gi, "help with"],
    [/\bcommence\b/gi, "start"],
    [/\bsubsequent\b/gi, "next"],
    [/\bsufficient\b/gi, "enough"],
    [/\bnumerous\b/gi, "a lot of"],
    [/\bendeavor\b/gi, "try"],
  ];
  for (const [pattern, replacement] of replacements) {
    const newResult = result.replace(pattern, replacement);
    if (newResult !== result) {
      changes.push({ type: "casual", original: result.match(pattern)?.[0] || "", replacement });
      result = newResult;
    }
  }
  return result;
}

function applyAcademic(text: string, changes: RewriteChange[]): string {
  let result = text;
  const replacements: [RegExp, string][] = [
    [/\ba lot of\b/gi, "numerous"],
    [/\bbig\b/g, "substantial"],
    [/\bhelp\b/gi, "facilitate"],
    [/\buse\b/g, "utilize"],
    [/\bstart\b/g, "commence"],
    [/\bend\b/g, "conclude"],
    [/\bshow\b/g, "demonstrate"],
    [/\bfind\b/g, " ascertain"],
    [/\bget\b/g, "obtain"],
    [/\bneed\b/g, "necessitate"],
    [/\bgood\b/g, "favorable"],
    [/\bbad\b/g, "adverse"],
    [/\bI'm\b/g, "I am"],
    [/\bI've\b/g, "I have"],
    [/\bdon't\b/gi, "do not"],
    [/\bcan't\b/gi, "cannot"],
    [/\bwon't\b/gi, "will not"],
    [/\bshouldn't\b/gi, "should not"],
    [/\bIt's\b/g, "It is"],
    [/\bThat's\b/g, "That is"],
    [/\bThere's\b/g, "There is"],
    [/\bThey're\b/g, "They are"],
    [/\bWe're\b/g, "We are"],
    [/\bYou're\b/g, "You are"],
  ];
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function applyBusiness(text: string, changes: RewriteChange[]): string {
  let result = text;
  const replacements: [RegExp, string][] = [
    [/\bI think\b/gi, "We believe"],
    [/\bI want\b/gi, "We need"],
    [/\bmaybe\b/gi, "potentially"],
    [/\bstuff\b/gi, "items"],
    [/\bkind of\b/gi, "somewhat"],
    [/\bsort of\b/gi, "to some extent"],
    [/\ba lot\b/gi, "significantly"],
    [/\bgonna\b/gi, "going to"],
    [/\bwanna\b/gi, "want to"],
    [/\bbasically\b/gi, "essentially"],
    [/\breally\b/gi, "substantially"],
    [/\bpretty\b/g, "quite"],
  ];
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function applySimple(text: string, sentences: string[], changes: RewriteChange[]): string {
  let result = text;
  const replacements: [RegExp, string][] = [
    [/\bfurthermore\b/gi, "also"],
    [/\bmoreover\b/gi, "and"],
    [/\bconsequently\b/gi, "so"],
    [/\btherefore\b/gi, "so"],
    [/\bnevertheless\b/gi, "but"],
    [/\bsubsequently\b/gi, "then"],
    [/\bdemonstrate\b/gi, "show"],
    [/\bfacilitate\b/gi, "help"],
    [/\butilize\b/gi, "use"],
    [/\bimplement\b/gi, "do"],
    [/\bcommence\b/gi, "start"],
    [/\bterminate\b/gi, "end"],
    [/\bnecessitate\b/gi, "need"],
    [/\bsubstantial\b/gi, "big"],
    [/\bnumerous\b/gi, "many"],
    [/\bsufficient\b/gi, "enough"],
    [/\bprior to\b/gi, "before"],
    [/\bin order to\b/gi, "to"],
    [/\bdue to the fact that\b/gi, "because"],
    [/\bat this point in time\b/gi, "now"],
    [/\bin the event that\b/gi, "if"],
    [/\bwith regard to\b/gi, "about"],
    [/\bin the vicinity of\b/gi, "near"],
    [/\bapproximately\b/gi, "about"],
  ];
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  // Split long sentences
  result = result.replace(/(.{50,80}[.!?])\s+(and|but|so|because|which|that|while)\s+/gi, "$1\n$2 ");
  return result;
}

function applyEmail(text: string, changes: RewriteChange[]): string {
  const lines = text.split("\n").filter(l => l.trim());
  let body = lines.join("\n\n");

  // Remove existing greetings/sign-offs if present
  body = body.replace(/^(Dear|Hi|Hello|Hey)[^,!?.]*[,!?.]\s*/i, "");
  body = body.replace(/^(Regards|Sincerely|Best|Cheers|Thanks)[^!?.]*[.!?\n]*$/im, "");

  return `Hi there,\n\n${body.trim()}\n\nBest regards`;
}

function applyFormal(text: string, changes: RewriteChange[]): string {
  let result = text;
  const replacements: [RegExp, string][] = [
    [/\bI'm\b/g, "I am"],
    [/\bI've\b/g, "I have"],
    [/\bdon't\b/gi, "do not"],
    [/\bcan't\b/gi, "cannot"],
    [/\bwon't\b/gi, "will not"],
    [/\bshouldn't\b/gi, "should not"],
    [/\bwouldn't\b/gi, "would not"],
    [/\bcouldn't\b/gi, "could not"],
    [/\bIt's\b/g, "It is"],
    [/\bThat's\b/g, "That is"],
    [/\bThere's\b/g, "There is"],
    [/\bThey're\b/g, "They are"],
    [/\bWe're\b/g, "We are"],
    [/\bYou're\b/g, "You are"],
    [/\bget\b/g, "obtain"],
    [/\bhelp\b/g, "assist"],
    [/\buse\b/g, "utilize"],
    [/\bstart\b/g, "commence"],
    [/\bend\b/g, "conclude"],
    [/\bneed\b/g, "require"],
    [/\bbuy\b/g, "purchase"],
    [/\btry\b/g, "endeavor"],
    [/\bbig\b/g, "substantial"],
    [/\bsmall\b/g, "minimal"],
    [/\bgood\b/g, "favorable"],
    [/\bbad\b/g, "adverse"],
  ];
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function applyCreative(text: string, changes: RewriteChange[]): string {
  let result = text;
  const replacements: [RegExp, string][] = [
    [/\bvery good\b/gi, "exceptional"],
    [/\bvery bad\b/gi, "dreadful"],
    [/\bvery big\b/gi, "enormous"],
    [/\bvery small\b/gi, "tiny"],
    [/\bvery fast\b/gi, "lightning-fast"],
    [/\bvery slow\b/gi, "painstakingly slow"],
    [/\bvery important\b/gi, "absolutely crucial"],
    [/\binteresting\b/gi, "fascinating"],
    [/\bbeautiful\b/gi, "breathtaking"],
    [/\bscary\b/gi, "bone-chilling"],
    [/\bfunny\b/gi, "hilarious"],
    [/\bsad\b/g, "heartbreaking"],
    [/\bhappy\b/g, "overjoyed"],
  ];
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function applyTechnical(text: string, changes: RewriteChange[]): string {
  let result = text;
  // Add structure: convert paragraphs to bullet points if multiple sentences
  const paragraphs = result.split(/\n\n+/);
  if (paragraphs.length === 1 && paragraphs[0].split(/[.!?]+\s/).length > 3) {
    const sentences = result.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    result = sentences.map(s => `• ${s.trim()}`).join("\n");
  }
  return result;
}
