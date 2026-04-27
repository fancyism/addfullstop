"""
AddFullStop CLI — Fix trailing-space lines and remove emojis from ChatGPT output.

Usage:
  # From clipboard (fix spaces + remove emojis):
  python addfullstop.py --clipboard --emoji

  # From file:
  python addfullstop.py -i input.txt -o output.txt

  # From file, remove emojis only:
  python addfullstop.py -i input.txt --emoji --no-fix-spaces

  # Pipe:
  cat input.txt | python addfullstop.py --stdin --emoji
"""

import argparse
import re
import sys
from pathlib import Path

# Comprehensive emoji regex — matches Unicode emoji ranges
EMOJI_REGEX = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U00002600-\U000026FF"  # misc symbols
    "\U00002700-\U000027BF"  # dingbats
    "\U0000FE00-\U0000FE0F"  # variation selectors
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA00-\U0001FA6F"  # chess symbols
    "\U0001FA70-\U0001FAFF"  # symbols extended-A
    "\U0000200D"             # zero width joiner
    "\U000020E3"             # combining enclosing keycap
    "\U0000FE0F"             # variation selector-16
    "\U000E0020-\U000E007F"  # tags
    "\U00002300-\U000023FF"  # misc technical
    "\U00002B50"             # star
    "\U00002B55"             # circle
    "\U000025AA-\U000025FE"  # geometric shapes
    "\U0001F004"             # mahjong
    "\U0001F0CF"             # playing card joker
    "\U0001F170-\U0001F251"  # enclosed supplemental
    "\U00003030"             # wavy dash
    "\U0000303D"             # part alternation
    "\U00003297-\U00003299"  # enclosed CJK
    "\U000000A9"             # copyright
    "\U000000AE"             # registered
    "\U00002122"             # trademark
    "\U000023E9-\U000023F3"  # transport signs
    "\U000023F8-\U000023FA"  # transport signs
    "\U00002614-\U00002615"  # umbrella, hot beverage
    "\U00002648-\U00002653"  # zodiac
    "\U0000267F"             # wheelchair
    "\U00002693"             # anchor
    "\U000026A1"             # high voltage
    "\U000026AA-\U000026AB"  # circles
    "\U000026BD-\U000026BE"  # sports
    "\U000026C4-\U000026C5"  # weather
    "\U000026CE"             # Ophiuchus
    "\U000026D4"             # no entry
    "\U000026EA"             # church
    "\U000026F2-\U000026F3"  # fountain, golf
    "\U000026F5"             # sailboat
    "\U000026FA"             # tent
    "\U000026FD"             # fuel pump
    "\U00002702"             # scissors
    "\U00002705"             # check mark
    "\U00002708-\U0000270D"  # transport
    "\U0000270F"             # pencil
    "\U00002712"             # black nib
    "\U00002714"             # check mark
    "\U00002716"             # multiplication X
    "\U0000271D"             # latin cross
    "\U00002721"             # star of david
    "\U00002728"             # sparkles
    "\U00002733-\U00002734"  # eight-spoked asterisk
    "\U00002744"             # snowflake
    "\U00002747"             # sparkle
    "\U0000274C"             # cross mark
    "\U0000274E"             # cross mark
    "\U00002753-\U00002755"  # question marks
    "\U00002757"             # exclamation
    "\U00002763-\U00002764"  # heart exclamation, hearts
    "\U00002795-\U00002797"  # math symbols
    "\U000027A1"             # right arrow
    "\U000027B0"             # curly loop
    "\U000027BF"             # double curly loop
    "\U00002B05-\U00002B07"  # arrows
    "\U00002B1B-\U00002B1C"  # squares
    "\U0000231A-\U0000231B"  # watch, hourglass
    "]+",
    flags=re.UNICODE,
)


def remove_emojis(text: str) -> tuple[str, int]:
    """Remove all emoji characters from text. Returns (cleaned_text, count)."""
    matches = EMOJI_REGEX.findall(text)
    count = len(matches)
    result = EMOJI_REGEX.sub("", text)
    # Clean up double spaces left by emoji removal
    result = re.sub(r"  +", " ", result)
    # Trim trailing spaces on each line
    result = "\n".join(line.rstrip() for line in result.split("\n"))
    return result, count


def fix_trailing_spaces(text: str) -> tuple[str, int]:
    """Process text: lines with trailing whitespace get stripped + period added.

    Returns (processed_text, number_of_lines_fixed).
    """
    lines = text.split("\n")
    fixed_count = 0
    result = []

    for line in lines:
        if line != line.rstrip():
            trimmed = line.rstrip()
            # Don't add period if already ends with punctuation
            if re.search(r"[.!?。？！]$", trimmed):
                result.append(trimmed)
            else:
                result.append(trimmed + ".")
                fixed_count += 1
        else:
            result.append(line)

    return "\n".join(result), fixed_count


def read_clipboard() -> str:
    """Read text from clipboard. Requires pyperclip."""
    try:
        import pyperclip
        return pyperclip.paste()
    except ImportError:
        print("Error: pyperclip not installed. Run: pip install pyperclip", file=sys.stderr)
        sys.exit(1)


def write_clipboard(text: str) -> None:
    """Write text to clipboard. Requires pyperclip."""
    try:
        import pyperclip
        pyperclip.copy(text)
    except ImportError:
        print("Error: pyperclip not installed. Run: pip install pyperclip", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Clean up ChatGPT text: fix trailing spaces, add periods, remove emojis."
    )
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("-i", "--input", type=Path, help="Input text file")
    input_group.add_argument("--clipboard", action="store_true", help="Read from clipboard")
    input_group.add_argument("--stdin", action="store_true", help="Read from stdin (pipe)")

    output_group = parser.add_argument_group("Output options")
    output_group.add_argument("-o", "--output", type=Path, help="Output file path")
    output_group.add_argument("--clipboard-out", action="store_true", help="Copy result to clipboard")

    feature_group = parser.add_argument_group("Features (enabled by default: fix-spaces)")
    feature_group.add_argument("--emoji", action="store_true", help="Remove emojis from text")
    feature_group.add_argument("--no-fix-spaces", action="store_true", help="Disable trailing-space fix")

    args = parser.parse_args()

    # Read input
    if args.clipboard:
        text = read_clipboard()
        if not text:
            print("Error: Clipboard is empty.", file=sys.stderr)
            sys.exit(1)
    elif args.stdin:
        text = sys.stdin.read()
    else:
        if not args.input.exists():
            print(f"Error: File not found: {args.input}", file=sys.stderr)
            sys.exit(1)
        text = args.input.read_text(encoding="utf-8")

    if not text.strip():
        print("Error: No text to process.", file=sys.stderr)
        sys.exit(1)

    # Process
    result = text
    fixed_count = 0
    emoji_count = 0
    messages = []

    if args.emoji:
        result, emoji_count = remove_emojis(result)
        messages.append(f"Removed {emoji_count} emoji(s)")

    if not args.no_fix_spaces:
        result, fixed_count = fix_trailing_spaces(result)
        messages.append(f"Fixed {fixed_count} line(s)")

    # Output
    summary = ". ".join(messages) if messages else "No changes made"

    if args.output:
        args.output.write_text(result, encoding="utf-8")
        print(f"Done. {summary}. Saved to {args.output}")
    elif args.clipboard_out:
        write_clipboard(result)
        print(f"Done. {summary}. Copied to clipboard.")
    else:
        print(result)
        print(f"\n--- {summary} ---", file=sys.stderr)


if __name__ == "__main__":
    main()
