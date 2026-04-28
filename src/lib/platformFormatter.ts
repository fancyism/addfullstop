// Platform Formatter — reformats humanized text for specific social platforms
// Each platform has unique best practices for spacing, line breaks, tone, and structure.

export type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "lemon8"
  | "medium"
  | "x";

export interface PlatformFormatResult {
  text: string;
  platform: Platform;
  charCount: number;
  charLimit: number | null; // null = no hard limit
  isOverLimit: boolean;
  tips: string[];
}

const PLATFORM_META: Record<Platform, { label: string; icon: string; charLimit: number | null }> = {
  instagram: { label: "Instagram", icon: "📸", charLimit: 2200 },
  facebook: { label: "Facebook", icon: "📘", charLimit: 63206 },
  tiktok: { label: "TikTok", icon: "🎵", charLimit: 2200 },
  lemon8: { label: "Lemon8", icon: "🍋", charLimit: 5000 },
  medium: { label: "Medium", icon: "✍️", charLimit: null },
  x: { label: "X / Twitter", icon: "𝕏", charLimit: 280 },
};

export { PLATFORM_META };

// ─── Helpers ──────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function groupSentences(sentences: string[], perGroup: number): string[] {
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += perGroup) {
    groups.push(sentences.slice(i, i + perGroup).join(" "));
  }
  return groups;
}

function extractHashtags(text: string): { clean: string; hashtags: string[] } {
  const hashtagRegex = /#\w+/g;
  const hashtags = text.match(hashtagRegex) ?? [];
  const clean = text.replace(hashtagRegex, "").replace(/\s{2,}/g, " ").trim();
  return { clean, hashtags };
}

// ─── Platform Formatters ──────────────────────────────────────────────

function formatInstagram(text: string): PlatformFormatResult {
  const { clean, hashtags } = extractHashtags(text);
  const sentences = splitSentences(clean);
  const tips: string[] = [];

  // First line = hook (first 1-2 sentences)
  const hook = sentences.slice(0, 2).join(" ");
  const body = sentences.slice(2);

  // Group remaining sentences into short 1-2 sentence paragraphs
  const paragraphs = [hook, ...groupSentences(body, 2)];

  // Add decorative line breaks between paragraphs
  let formatted = paragraphs.join("\n\n");

  // Add emoji bullets for list-like content
  formatted = formatted.replace(/^[-•]\s+/gm, "✦ ");

  // Append hashtag block
  if (hashtags.length > 0) {
    formatted += "\n\n" + hashtags.join(" ");
  }

  const charCount = [...formatted].length;
  if (charCount > 125) {
    tips.push("First 125 chars show before 'more' — make sure your hook is compelling.");
  }
  if (hashtags.length < 5) {
    tips.push("Consider adding 5-15 relevant hashtags for discoverability.");
  }
  tips.push("Use line breaks to create breathing room — each idea gets its own space.");

  return {
    text: formatted,
    platform: "instagram",
    charCount,
    charLimit: 2200,
    isOverLimit: charCount > 2200,
    tips,
  };
}

function formatFacebook(text: string): PlatformFormatResult {
  const { clean, hashtags } = extractHashtags(text);
  const sentences = splitSentences(clean);
  const tips: string[] = [];

  // Group into 2-3 sentence paragraphs
  const paragraphs = groupSentences(sentences, 3);

  let formatted = paragraphs.join("\n\n");

  // Hashtags at end (optional on FB)
  if (hashtags.length > 0) {
    formatted += "\n\n" + hashtags.join(" ");
  }

  const charCount = [...formatted].length;
  tips.push("Facebook favors conversational, personal-sounding posts.");
  tips.push("Ask a question at the end to boost engagement.");

  return {
    text: formatted,
    platform: "facebook",
    charCount,
    charLimit: 63206,
    isOverLimit: charCount > 63206,
    tips,
  };
}

function formatTikTok(text: string): PlatformFormatResult {
  const { clean, hashtags } = extractHashtags(text);
  const sentences = splitSentences(clean);
  const tips: string[] = [];

  // TikTok = short, punchy, line-by-line
  let formatted: string[];

  if (sentences.length <= 3) {
    // Short text: each sentence on its own line
    formatted = sentences;
  } else {
    // Hook (first sentence) + body grouped 2 per line
    const hook = sentences[0];
    const bodyLines = groupSentences(sentences.slice(1), 2);
    formatted = [hook, "", ...bodyLines];
  }

  let result = formatted.join("\n");

  // Hashtags at the end
  if (hashtags.length > 0) {
    result += "\n\n" + hashtags.join(" ");
  }

  const charCount = [...result].length;
  if (charCount > 150) {
    tips.push("TikTok captions beyond ~150 chars get truncated. Keep it punchy.");
  }
  tips.push("First line = the hook. Make it stop the scroll.");

  return {
    text: result,
    platform: "tiktok",
    charCount,
    charLimit: 2200,
    isOverLimit: charCount > 2200,
    tips,
  };
}

function formatLemon8(text: string): PlatformFormatResult {
  const { clean, hashtags } = extractHashtags(text);
  const sentences = splitSentences(clean);
  const tips: string[] = [];

  // Title from first sentence
  const title = sentences[0];
  const body = sentences.slice(1);

  // Lemon8 loves bullet-point aesthetic with emoji markers
  const bulletEmoji = ["📌", "✨", "💡", "🌿", "☕", "🤍", "🌸"];
  const bodyParagraphs = groupSentences(body, 2).map((p, i) => {
    const emoji = bulletEmoji[i % bulletEmoji.length];
    return `${emoji} ${p}`;
  });

  let formatted = `${title}\n\n${bodyParagraphs.join("\n\n")}`;

  // Hashtags spread naturally at end
  if (hashtags.length > 0) {
    formatted += "\n\n" + hashtags.join(" ");
  }

  const charCount = [...formatted].length;
  tips.push("Lemon8 favors aesthetic, lifestyle-style formatting.");
  tips.push("Use emoji bullets and generous whitespace.");
  tips.push("A strong title/first line acts like a headline.");

  return {
    text: formatted,
    platform: "lemon8",
    charCount,
    charLimit: 5000,
    isOverLimit: charCount > 5000,
    tips,
  };
}

function formatMedium(text: string): PlatformFormatResult {
  const paragraphs = splitParagraphs(text);
  const sentences = splitSentences(text);
  const tips: string[] = [];

  // Medium = professional, clean, heading every 3-4 paragraphs
  const groups: string[] = [];
  const headingInterval = 4;

  paragraphs.forEach((p, i) => {
    if (i > 0 && i % headingInterval === 0) {
      // Insert a subheading from the first sentence of this paragraph
      const firstSentence = p.split(/(?<=[.!?。])\s+/)[0];
      groups.push(`\n## ${firstSentence.replace(/[.!?]+$/, "")}\n`);
    }
    groups.push(p);
  });

  let formatted = groups.join("\n\n");

  // Add a title from the first sentence if not already a heading
  if (!formatted.startsWith("#")) {
    const titleLine = sentences[0].replace(/[.!?]+$/, "");
    formatted = `# ${titleLine}\n\n${formatted}`;
  }

  const charCount = [...formatted].length;
  tips.push("Medium readers prefer 3-5 sentence paragraphs with subheadings.");
  tips.push("Use ## subheadings every 3-4 paragraphs to break up long reads.");
  tips.push("Minimal emojis — let the writing speak.");

  return {
    text: formatted,
    platform: "medium",
    charCount,
    charLimit: null,
    isOverLimit: false,
    tips,
  };
}

function formatX(text: string): PlatformFormatResult {
  const { clean, hashtags } = extractHashtags(text);
  const tips: string[] = [];

  // For X: try to fit in 280 chars, or split into thread
  let formatted = clean;

  // Reattach hashtags inline if short enough
  if (hashtags.length > 0) {
    formatted += "\n" + hashtags.join(" ");
  }

  const charCount = [...formatted].length;

  if (charCount <= 280) {
    // Fits in single tweet
    tips.push("Single tweet — nice and punchy!");
  } else {
    // Suggest thread format
    tips.push("Over 280 chars — consider splitting into a thread (🧵).");
    tips.push("Start with a hook tweet, then 1 idea per tweet.");

    // Create thread preview
    const allSentences = splitSentences(formatted);
    const tweets: string[] = [];
    let currentTweet = "";

    for (const sentence of allSentences) {
      const candidate = currentTweet ? `${currentTweet} ${sentence}` : sentence;
      if ([...candidate].length <= 270) {
        currentTweet = candidate;
      } else {
        if (currentTweet) tweets.push(currentTweet);
        currentTweet = sentence;
      }
    }
    if (currentTweet) tweets.push(currentTweet);

    if (tweets.length > 1) {
      formatted = tweets
        .map((t, i) => `${i + 1}/${tweets.length} ${t}`)
        .join("\n\n---\n\n");
      tips.unshift(`Thread: ${tweets.length} tweets`);
    }
  }

  const totalChars = [...formatted].length;

  return {
    text: formatted,
    platform: "x",
    charCount: totalChars,
    charLimit: 280,
    isOverLimit: [...clean].length > 280,
    tips,
  };
}

// ─── Main Export ───────────────────────────────────────────────────────

const FORMATTERS: Record<Platform, (text: string) => PlatformFormatResult> = {
  instagram: formatInstagram,
  facebook: formatFacebook,
  tiktok: formatTikTok,
  lemon8: formatLemon8,
  medium: formatMedium,
  x: formatX,
};

export function formatForPlatform(text: string, platform: Platform): PlatformFormatResult {
  const formatter = FORMATTERS[platform];
  return formatter(text);
}
