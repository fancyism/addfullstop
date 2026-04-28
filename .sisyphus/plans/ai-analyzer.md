# Plan: AI Text Analyzer Feature

## TL;DR

> **Quick Summary**: Add a client-side AI text detection analyzer to AddFullStop — users paste text and get an instant "AI probability score" with per-line highlighting and actionable tips. Pure math, no server, no API keys.
> 
> **Deliverables**:
> - `src/lib/aiAnalyzer.ts` — analysis engine (6 heuristics)
> - Updated `src/app/page.tsx` — tab UI (Fix Text | AI Analyzer)
> - CSS animations for score display
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (engine) → Task 2 (UI) → Task 3 (integration)

---

## Context

### Original Request
User wants a "killer feature" for their micro SaaS niche targeting writers/content creators who use AI. The #1 pain point is fear of being "caught" using AI. An AI text analyzer gives them a score they can measure and share — creating viral loops.

### Design Decisions
- **100% client-side** — no server, no API keys, privacy-first (matches existing product)
- **Heuristic-based** — not ML model. Uses: sentence variance, TTR, burstiness, AI phrase detection, starter repetition, paragraph uniformity
- **Score 0-100** — intuitive, shareable number
- **Per-line highlighting** — shows exactly which lines look AI-like
- **Actionable tips** — tells user HOW to fix, not just "this looks AI"

### Emotional Design (from article)
- **Visceral**: Big animated score circle — green/yellow/red — instant emotional reaction
- **Behavioral**: Paste = instant score. Zero clicks. Zero decisions.
- **Reflective**: "My text is only 12% AI! I'm sharing this with my writing group."
- **Peak**: Score animation + confetti/celebration for low scores
- **Hook**: Variable reward — every text gives different score, people test multiple texts

---

## Work Objectives

### Core Objective
Add an AI text analyzer tab to AddFullStop that scores text 0-100 for AI-likeness using 6 client-side heuristics.

### Concrete Deliverables
- `src/lib/aiAnalyzer.ts` — analysis engine
- Updated `src/app/page.tsx` — tab system with analyzer view
- Updated `src/app/globals.css` — score animation keyframes

### Definition of Done
- [ ] User can paste text → see instant AI score
- [ ] Score breakdown shows all 6 metrics
- [ ] Per-line highlighting shows which lines are flagged
- [ ] Tips section gives actionable advice
- [ ] Build passes: `npm run build` → zero errors
- [ ] Both tabs (Fix Text | AI Analyzer) work independently

### Must Have
- Auto-analyze on paste (zero clicks)
- Big score display with color coding (green/yellow/red)
- Per-line highlighting
- 6 heuristic metrics with individual scores
- Actionable tips based on which metrics scored high
- Stats: word count, sentence count, reading time

### Must NOT Have (Guardrails)
- No API calls to external services (OpenAI, HuggingFace, etc.)
- No ML model inference (too heavy for client)
- No "humanize" button yet (Phase 2 — separate plan)
- No data storage or tracking
- Must not break existing Fix Text tab functionality

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (no test framework configured)
- **Automated tests**: NO — skip for now
- **Agent-Executed QA**: ALWAYS (mandatory)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: Create AI analyzer engine (src/lib/aiAnalyzer.ts) [deep]
└── Task 2: Add CSS animations for score display [quick]

Wave 2 (After Wave 1 — UI + integration):
├── Task 3: Update page.tsx with tab system + analyzer UI [visual-engineering]
└── Task 4: Build, test, commit, push [quick]

Wave FINAL:
├── Task F1: QA — verify both tabs work, analyzer gives meaningful scores [unspecified-high]
└── Task F2: QA — check build, mobile responsive, dark mode [unspecified-high]
```

### Dependency Matrix
- **1**: - → 3
- **2**: - → 3
- **3**: 1, 2 → 4
- **4**: 3 → F1, F2

### Agent Dispatch Summary
- **Wave 1**: 2 tasks — T1 `deep`, T2 `quick`
- **Wave 2**: 2 tasks — T3 `visual-engineering`, T4 `quick`
- **FINAL**: 2 tasks — F1 `unspecified-high`, F2 `unspecified-high`

---

## TODOs

- [ ] 1. Create AI analyzer engine (`src/lib/aiAnalyzer.ts`)

  **What to do**:
  - Create `src/lib/aiAnalyzer.ts` with the full analysis engine
  - Export `analyzeText(text: string): AIScore` as the main function
  - Export types: `AIScore`, `MetricResult`, `LineScore`
  - Implement 6 heuristics:
    1. **Sentence Length Variance** — coefficient of variation of sentence word counts. Low CV = AI-like (uniform sentences). Uses `normalizeToScore(cv, 0.55, 0.2)`
    2. **Vocabulary Richness (TTR)** — Type-Token Ratio. Low TTR = AI-like. Length-adjusted. Uses `normalizeToScore(adjustedTTR, 0.55, 0.35)`
    3. **Burstiness** — variance of consecutive sentence length differences. Low burstiness = AI-like (flat rhythm). Uses diff between adjacent sentence lengths
    4. **AI Phrase Detection** — regex matching against 20+ known ChatGPT phrases (e.g., "In today's world", "It's worth noting", "Furthermore", "plays a crucial role", etc.). Count per 1000 words
    5. **Sentence Starter Repetition** — analyze first 2 words of each sentence. Low variety = AI-like. Track repetition ratio
    6. **Paragraph Uniformity** — CV of paragraph word counts. Low CV = AI-like (uniform blocks)
  - Weighted overall score: burstiness(0.25) + sentenceVariance(0.20) + aiPhrases(0.20) + vocabularyRichness(0.15) + starterRepetition(0.10) + paragraphUniformity(0.10)
  - Color coding: 0-29 green ("Likely Human"), 30-59 yellow ("Mixed"), 60-100 red ("Likely AI-Generated")
  - Per-line scoring: check each line for AI phrases, uniform sentence length, formal wording, excessive hedging
  - Tips generator: actionable advice based on which metrics scored high
  - Stats: word count, sentence count, paragraph count, avg sentence length, reading time
  - Handle edge cases: text too short (<50 chars), empty input, single sentence

  **Must NOT do**:
  - No API calls to external services
  - No ML model inference
  - No data storage

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex algorithmic logic with multiple heuristics and statistical calculations
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/lib/processText.ts` — existing text processing module. Follow same export pattern (named function + types export)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Analyze known AI-generated text
    Tool: Bash (node)
    Preconditions: aiAnalyzer.ts exists
    Steps:
      1. Create a temp test script that imports analyzeText
      2. Pass a known ChatGPT-style text: "In today's digital landscape, artificial intelligence plays a crucial role in transforming how businesses operate. Furthermore, it is important to note that the integration of AI technologies has become increasingly prevalent. Additionally, this comprehensive guide explores the myriad ways in which AI can be leveraged to drive innovation. In conclusion, the future of AI holds immense promise for those who are willing to embrace change."
      3. Verify: overall score > 50
      4. Verify: aiPhrases metric score > 50
      5. Verify: color is "red" or "yellow"
      6. Verify: tips array has at least 1 item
    Expected Result: AI text scores > 50 with aiPhrases flagged
    Failure Indicators: Score < 30 for known AI text, or missing metrics
    Evidence: .sisyphus/evidence/task-1-ai-text-score.txt

  Scenario: Analyze known human-written text
    Tool: Bash (node)
    Preconditions: aiAnalyzer.ts exists
    Steps:
      1. Pass a personal, casual text: "Just got back from the store. Milk was $4.99! Crazy right? Anyway, dinner tonight is gonna be pasta. The kids love it. Simple and cheap. What else... oh, I need to call Mom tomorrow. She's been asking about the trip."
      2. Verify: overall score < 40
      3. Verify: color is "green"
      4. Verify: burstiness score < 40 (varied sentence lengths)
    Expected Result: Human text scores < 40 with green color
    Failure Indicators: Score > 60 for casual human text
    Evidence: .sisyphus/evidence/task-1-human-text-score.txt

  Scenario: Handle edge cases
    Tool: Bash (node)
    Steps:
      1. Call analyzeText("") — verify returns score 0, label "Too short"
      2. Call analyzeText("Hello") — verify returns score 0, tips says "paste more text"
      3. Call analyzeText("A single sentence here.") — verify doesn't crash
    Expected Result: No crashes, graceful handling
    Evidence: .sisyphus/evidence/task-1-edge-cases.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(analyzer): add AI text detection engine`
  - Files: `src/lib/aiAnalyzer.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 2. Add CSS animations for score display

  **What to do**:
  - Update `src/app/globals.css` — add keyframe animations:
    1. `@keyframes scoreCount` — animates the score number counting up from 0 to final value
    2. `@keyframes scoreRing` — animates the circular score ring (SVG stroke-dashoffset)
    3. `@keyframes fadeInUp` — fades in elements with slight upward motion (for metric cards)
    4. `@keyframes pulse` — subtle pulse for the score circle on completion
    5. `.animate-score-count` — utility class for score number animation
    6. `.animate-score-ring` — utility class for ring animation
    7. `.animate-fade-in-up` — utility class for staggered card entrance
    8. `.animate-pulse-once` — single pulse after score settles
  - Add CSS custom properties for the score colors:
    - `--score-green: #22c55e`
    - `--score-yellow: #eab308`
    - `--score-red: #ef4444`
  - Add utility for line highlighting backgrounds:
    - `.line-highlight-low` — subtle green background
    - `.line-highlight-medium` — subtle yellow background
    - `.line-highlight-high` — subtle red background

  **Must NOT do**:
  - No external animation libraries
  - No JavaScript-dependent animations (pure CSS)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple CSS additions, no complex logic
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:
  - `src/app/globals.css` — existing CSS file to append to

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: CSS classes exist and don't break existing styles
    Tool: Bash
    Steps:
      1. Grep globals.css for "scoreCount" keyframe
      2. Grep globals.css for "scoreRing" keyframe
      3. Grep globals.css for "fadeInUp" keyframe
      4. Grep globals.css for "line-highlight" classes
      5. Verify no syntax errors (build still passes)
    Expected Result: All animations and utility classes present
    Evidence: .sisyphus/evidence/task-2-css-verify.txt

  Scenario: Build passes with new CSS
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Verify zero errors
    Expected Result: Build passes clean
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: included in Task 1 commit
  - Files: `src/app/globals.css`

- [ ] 3. Update page.tsx with tab system + AI Analyzer UI

  **What to do**:
  - Add tab state: `const [activeTab, setActiveTab] = useState<"fix" | "analyze">("fix")`
  - Add tab bar UI above the tool card — two pill buttons: "✏️ Fix Text" and "🔍 AI Analyzer"
  - **Fix Text tab**: Keep ALL existing functionality exactly as-is (input, options, process, output)
  - **AI Analyzer tab**: New UI with:
    1. **Input textarea** — paste text (reuse similar style from Fix tab)
    2. **Auto-analyze on paste** — use `onPaste` + `requestAnimationFrame` pattern (same as Fix tab)
    3. **Score circle** — large SVG circle (200x200px) showing the score:
       - Circular progress ring (SVG `stroke-dasharray`/`stroke-dashoffset`)
       - Big number in the center (e.g., "73")
       - Label below: "Likely AI-Generated" / "Mixed" / "Likely Human"
       - Color: green/yellow/red based on score
       - Animate on result (CSS animation classes from Task 2)
    4. **Stats bar** — word count, sentence count, reading time (compact, below score)
    5. **Metric breakdown** — 6 cards in 2-column grid:
       - Each card: metric name, score bar (colored), label text
       - Sentence Variance, Vocabulary Richness, Burstiness, AI Phrases, Starter Repetition, Paragraph Uniformity
       - Use `animate-fade-in-up` with staggered delay
    6. **Line-by-line view** — scrollable section showing each line:
       - Background color based on line score (green/yellow/red from CSS classes)
       - Line number + text + reason
       - Only show if lines.length > 0
    7. **Tips section** — actionable recommendations in a callout box:
       - List of tips from `generateTips()`
       - Green checkmark for good results, orange warning for issues
    8. **Share button** — "Share your score" copies a text snippet like:
       "I just tested my text on AddFullStop and got a 12% AI score! 🔒 Check yours: [URL]"
  - Import `analyzeText` from `@/lib/aiAnalyzer`
  - Add analyzer state: `analysisResult`, `analyzerInput`, `analyzerOutput`
  - Make tabs visually clear — active tab has solid background, inactive is ghost

  **Must NOT do**:
  - Must NOT break existing Fix Text functionality
  - Must NOT remove any existing features (checkboxes, process button, copy, download, clear)
  - Must NOT call any external API

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI with SVG, animations, responsive layout, dark mode
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `src/app/page.tsx` — existing page. This is the file to modify. Study the existing state management pattern (useState, useCallback) and match it exactly for the new analyzer state
  - `src/lib/aiAnalyzer.ts` — Task 1 output. Import `analyzeText`, `AIScore` type from here
  - `src/app/globals.css` — Task 2 output. Use animation classes: `animate-score-count`, `animate-score-ring`, `animate-fade-in-up`, `line-highlight-low/medium/high`

  **API/Type References**:
  - `AIScore` type from aiAnalyzer.ts — has `.overall`, `.label`, `.color`, `.metrics`, `.lineScores`, `.tips`, `.stats`
  - `MetricResult` type — has `.score`, `.label`, `.description`
  - `LineScore` type — has `.line`, `.text`, `.score`, `.reason`

  **Test References**:
  - Existing paste handler pattern: `handlePaste` using `requestAnimationFrame` + `textareaRef.current?.value`

  **WHY Each Reference Matters**:
  - `page.tsx` — must preserve ALL existing functionality while adding tabs. Don't rewrite, EXTEND.
  - `aiAnalyzer.ts` — the API contract. All types and the main function are defined here.
  - `globals.css` — animation classes to apply to score display elements.

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: AI Analyzer tab works end-to-end
    Tool: Playwright
    Preconditions: Dev server running on localhost:3000
    Steps:
      1. Navigate to http://localhost:3000
      2. Click "AI Analyzer" tab
      3. Verify textarea appears with placeholder
      4. Type or paste a known AI text (use browser_evaluate to set textarea value)
      5. Verify score circle appears with number > 0
      6. Verify 6 metric cards are visible
      7. Verify tips section has content
      8. Verify stats bar shows word count > 0
    Expected Result: Full analyzer UI renders with score
    Failure Indicators: Score shows 0 for long AI text, missing metric cards, no tips
    Evidence: .sisyphus/evidence/task-3-analyzer-e2e.png

  Scenario: Fix Text tab still works after changes
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Click "Fix Text" tab (default)
      3. Paste text with trailing spaces into input textarea
      4. Click "Process" button
      5. Verify output appears
      6. Click "Copy Output"
      7. Verify button text changes to "Copied!"
    Expected Result: All existing functionality preserved exactly
    Failure Indicators: Any missing features, broken buttons, errors
    Evidence: .sisyphus/evidence/task-3-fix-tab-preserved.png

  Scenario: Tab switching preserves state
    Tool: Playwright
    Steps:
      1. Start on Fix Text tab, type "hello world   " into input
      2. Switch to AI Analyzer tab
      3. Switch back to Fix Text tab
      4. Verify the input "hello world   " is still there
    Expected Result: State preserved across tab switches
    Evidence: .sisyphus/evidence/task-3-tab-state.png

  Scenario: Dark mode renders correctly
    Tool: Playwright
    Steps:
      1. Use browser_evaluate to set dark mode: `document.documentElement.classList.add('dark')`
      2. Check AI Analyzer tab renders with dark backgrounds
      3. Check score circle is visible
      4. Take screenshot
    Expected Result: No light-mode artifacts, everything readable
    Evidence: .sisyphus/evidence/task-3-dark-mode.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add AI Analyzer tab with score display and line highlighting`
  - Files: `src/app/page.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 4. Build verification, commit all, and push

  **What to do**:
  - Run `npm run build` — verify zero errors, all routes static
  - Run `npx tsc --noEmit` — verify zero type errors
  - Git add all changes, commit with message, push to origin/master
  - Verify on GitHub that the push succeeded

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple build + git operations
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 3)
  - **Blocks**: F1, F2
  - **Blocked By**: Task 3

  **QA Scenarios:**

  ```
  Scenario: Build passes clean
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Verify "Compiled successfully"
      3. Verify all 10 routes listed
    Expected Result: Zero errors, all routes static
    Evidence: .sisyphus/evidence/task-4-build.txt

  Scenario: Push succeeds
    Tool: Bash
    Steps:
      1. `git push origin master`
      2. Verify no errors
    Expected Result: Push succeeds
    Evidence: .sisyphus/evidence/task-4-push.txt
  ```

  **Commit**: YES
  - Message: `feat: AI Text Analyzer — client-side heuristic detection`
  - Files: all changed
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

- [ ] F1. **QA — Functional Testing** — `unspecified-high`
  Test both tabs independently. In AI Analyzer tab: paste a known ChatGPT text, verify score > 50. Paste a personal handwritten text, verify score < 30. Check per-line highlighting renders correctly. Check tips appear. Verify stats are accurate.
  Output: `Scenarios [N/N pass] | VERDICT`

- [ ] F2. **QA — Build + Visual** — `unspecified-high`
  Run `npm run build` — must pass zero errors. Check dark mode renders correctly. Check mobile responsive (narrow viewport). Check tab switching works without state loss.
  Output: `Build [PASS/FAIL] | Dark Mode [OK/BROKEN] | Mobile [OK/BROKEN] | VERDICT`

---

## Commit Strategy

- **Task 1+2**: `feat(analyzer): add AI text detection engine and animations` - src/lib/aiAnalyzer.ts, src/app/globals.css
- **Task 3**: `feat(ui): add AI Analyzer tab with score display and line highlighting` - src/app/page.tsx
- **Task 4**: `chore: build verification and push` - (no files, just verification)

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit    # Expected: zero errors
npm run build       # Expected: all routes static, zero errors
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent (no API calls, no data storage)
- [ ] Build passes clean
- [ ] AI Analyzer gives meaningful scores for test inputs
- [ ] Existing Fix Text tab still works perfectly
