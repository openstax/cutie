---
name: Inline Choice Interaction
route: /
tags: [inline-choice, interaction, dropdown, input-width, data-prompt, validation]
examples:
  - Inline Choice
  - Inline Choice - Multiple
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
