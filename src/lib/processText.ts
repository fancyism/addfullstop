/**
 * Emoji regex pattern — matches all Unicode emoji characters.
 * Covers: emoticons, symbols, pictographs, flags, skin tones, ZWJ sequences.
 */
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}\u{E0020}-\u{E007F}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{25AA}-\u{25FE}\u{2600}-\u{27BF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}\u{3030}\u{303D}\u{3297}\u{3299}\u{00A9}\u{00AE}\u{2122}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{231A}-\u{231B}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}]/gu;

export interface ProcessOptions {
  fixTrailingSpaces: boolean;
  removeEmojis: boolean;
  addHorizontalRule: boolean;
}

export interface ProcessResult {
  text: string;
  periodsAdded: number;
  emojisRemoved: number;
  headingsProcessed: number;
}

/**
 * Process text with configurable options.
 *
 * ORDER:
 * 1. Fix trailing spaces (must run before emoji cleanup destroys them)
 * 2. Remove emojis
 * 3. Insert --- before # headings (runs last so it sees clean lines)
 */
export function processText(
  text: string,
  options: ProcessOptions = { fixTrailingSpaces: true, removeEmojis: false, addHorizontalRule: false },
): ProcessResult {
  let periodsAdded = 0;
  let emojisRemoved = 0;
  let headingsProcessed = 0;
  let result = text;

  // Step 1: Fix trailing whitespace FIRST (before emoji cleanup destroys them)
  // Also converts completely blank/empty lines to "."
  if (options.fixTrailingSpaces) {
    const lines = result.split("\n");
    const processed = lines.map((line) => {
      // Blank/empty line → "."
      if (line.trim() === "") {
        periodsAdded++;
        return ".";
      }
      // Line with trailing whitespace → trim + add period
      if (line !== line.trimEnd()) {
        const trimmed = line.trimEnd();
        // Don't add period if already ends with punctuation
        if (/[.!?。？！]$/.test(trimmed)) {
          return trimmed;
        }
        periodsAdded++;
        return trimmed + ".";
      }
      return line;
    });
    result = processed.join("\n");
  }

  // Step 2: Remove emojis (if enabled)
  if (options.removeEmojis) {
    const matches = result.match(EMOJI_REGEX);
    if (matches) {
      emojisRemoved = matches.length;
    }
    result = result.replace(EMOJI_REGEX, "");
    // Clean up double spaces left behind by emoji removal
    result = result.replace(/  +/g, " ");
    // Clean up trailing spaces on each line after emoji removal
    result = result
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");
  }

  // Step 3: Insert --- before # headings (if enabled)
  // Leaves 1 blank line (.) between the text above and the ---
  if (options.addHorizontalRule) {
    const lines = result.split("\n");
    const processed: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeading = /^#+\s?/.test(line.trim());

      if (isHeading) {
        headingsProcessed++;

        // Look back: ensure there's exactly 1 separator line (.) before the ---
        // Remove any existing "." lines that are right before this heading
        while (processed.length > 0 && processed[processed.length - 1] === ".") {
          processed.pop();
          // Don't count this as a "period added" since we're reorganizing
          periodsAdded = Math.max(0, periodsAdded - 1);
        }

        // Add 1 gap line (.) then ---
        processed.push(".");
        periodsAdded++;
        processed.push("---");
        processed.push(line);
      } else {
        processed.push(line);
      }
    }

    result = processed.join("\n");
  }

  return { text: result, periodsAdded, emojisRemoved, headingsProcessed };
}
