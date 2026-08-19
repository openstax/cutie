---
name: Inline Choice Interaction
route: /
tags: [inline-choice, interaction, dropdown, input-width, data-prompt, validation, rationale, partial-credit]
examples:
  - Inline Choice
  - Inline Choice - Multiple
  - Inline Choice - Rationale (Dyad)
  - Inline Choice - Rationale (Triad)
---

# Inline Choice Interaction

Covers inline-choice dropdown rendering, selection behavior, validation,
scoring, feedback, input-width sizing, and custom prompt text.

## Basic Display, Validation & Submission

**Setup:** Load "Inline Choice" from the Supported Examples group.

1. Observe the rendered item.
   - [ ] A sentence is displayed with a dropdown (`<select>`) inline in the text
   - [ ] The dropdown shows placeholder text "Select\u2026"
   - [ ] The dropdown has a visible border and is styled inline with surrounding text
   - [ ] A required indicator (`*`) is visible next to the dropdown
   - [ ] The select has `aria-required="true"`

2. Without selecting a choice, click "Submit".
   - [ ] Submission is blocked — no score appears, item stays interactive
   - [ ] The required indicator enters an error state
   - [ ] The select has `aria-invalid="true"`

3. Click the dropdown and select an option.
   - [ ] The selected option text replaces the placeholder
   - [ ] The validation error clears (`aria-invalid` removed)

4. Click "Submit".
   - [ ] A score is displayed
   - [ ] The dropdown becomes disabled
   - [ ] Feedback appears explaining correctness

## Keyboard Navigation

**Setup:** Load "Inline Choice" (or reset state if already loaded).

1. Press Tab to move focus to the dropdown.
   - [ ] A visible focus indicator appears on the select

2. Press Space or Enter to open the dropdown.
   - [ ] The options list opens

3. Use Up/Down arrow keys to navigate options.
   - [ ] Focus moves between options

4. Press Enter or Space to select an option.
   - [ ] The option is selected and the dropdown closes

5. Press Tab to leave the dropdown.
   - [ ] Focus moves to the next focusable element (e.g., Submit button)

## Input Width, Custom Prompt & Constraints (Multiple Dropdowns)

**Setup:** Load "Inline Choice - Multiple" from the Supported Examples group.

1. Observe the three dropdowns in the paragraph.
   - [ ] **First dropdown** (RESPONSE): shows custom placeholder "Choose process\u2026" (not "Select\u2026")
   - [ ] **First dropdown**: is visually wider than the others (~24ch wide from `qti-input-width-20`)
   - [ ] **Second dropdown** (RESPONSE\_2): shows default placeholder "Select\u2026"
   - [ ] **Second dropdown**: is visually narrower than default (~10ch wide from `qti-input-width-6`)
   - [ ] **Third dropdown** (RESPONSE\_3): shows default placeholder "Select\u2026"
   - [ ] **Third dropdown**: uses the default CSS min-width (8ch), no inline width style
   - [ ] All three dropdowns have a required indicator (`*`) next to them
   - [ ] All three selects have `aria-required="true"`

2. Hover over the required indicators and check tooltip text.
   - [ ] **First dropdown**: tooltip reads "Selection required" (default message)
   - [ ] **Second dropdown**: tooltip reads "Please select an energy source" (custom `data-min-selections-message`)
   - [ ] **Third dropdown**: tooltip reads "Selection required" (default message)

3. Without selecting any choices, click "Submit".
   - [ ] Submission is blocked — no score appears, item stays interactive
   - [ ] All three required indicators enter an error state
   - [ ] All three selects have `aria-invalid="true"`

4. Select an option in just the first dropdown, then click "Submit" again.
   - [ ] Submission is still blocked (two dropdowns remain empty)
   - [ ] First dropdown's error clears (`aria-invalid` removed)
   - [ ] Second and third dropdowns still show error state

5. Select options in all three dropdowns and click "Submit".
   - [ ] A score out of 3 is displayed
   - [ ] All three dropdowns become disabled
   - [ ] Per-part feedback appears for each response

## Rationale Scoring: All-or-Nothing (Dyad)

**Setup:** Load "Inline Choice - Rationale (Dyad)" from the Supported Examples group. This is a
Drop-down: Rationale dyad (1 cause + 1 effect) worth 1 point: both parts must be correct for
any credit (all-or-nothing; no partial credit).

The correct answers are: event = **warm front**, reading = **a rising temperature**.

1. Observe the rendered item.
   - [ ] A sentence displays two dropdowns: an event, then a reading
   - [ ] The event dropdown shows placeholder "Choose event…"
   - [ ] The reading dropdown shows placeholder "Choose reading…"
   - [ ] Both dropdowns show a required indicator (`*`)

2. Select **warm front** and **a rising temperature**, then click "Submit".
   - [ ] Score displayed is **1 / 1**
   - [ ] Correct-style feedback appears for the event and the reading

3. Reset. Select **warm front** but the wrong reading (e.g. a falling temperature), then click
   "Submit".
   - [ ] Score displayed is **0 / 1** (no partial credit — both parts required)
   - [ ] Reading shows incorrect-style feedback; event shows correct

4. Reset. Select the wrong event (e.g. cold front) but the correct reading, then click "Submit".
   - [ ] Score displayed is **0 / 1**
   - [ ] Event shows incorrect-style feedback; reading shows correct

5. After any submission.
   - [ ] Both dropdowns become disabled

## Rationale Scoring: Cause Gate & Partial Credit (Triad)

**Setup:** Load "Inline Choice - Rationale (Triad)" from the Supported Examples group. This is a
Drop-down: Rationale triad (1 cause + 2 effects) worth 2 points: the cause must be correct
for any credit, with partial credit (1 point) for a single correct effect.

The correct answers are: event = **cold front**, reading 1 = **a falling temperature**,
reading 2 = **gusting winds**.

1. Observe the rendered item.
   - [ ] A sentence displays three dropdowns: an event, then two readings
   - [ ] The event dropdown shows placeholder "Choose event…"
   - [ ] Both reading dropdowns show placeholder "Choose reading…"
   - [ ] All three dropdowns show a required indicator (`*`)

2. Select **cold front**, **a falling temperature**, and **gusting winds**, then click "Submit".
   - [ ] Score displayed is **2 / 2**
   - [ ] Correct-style feedback appears for the event and both readings

3. Reset. Select **cold front** and **a falling temperature**, but the wrong second reading
   (e.g. calm winds), then click "Submit".
   - [ ] Score displayed is **1 / 2** (partial credit)
   - [ ] Reading 2 shows incorrect-style feedback; event and reading 1 show correct

4. Reset. Select the wrong event (e.g. warm front) but both correct readings, then click
   "Submit".
   - [ ] Score displayed is **0 / 2** (cause gate — no credit without the correct event)
   - [ ] Event shows incorrect-style feedback

5. After any submission.
   - [ ] All three dropdowns become disabled
