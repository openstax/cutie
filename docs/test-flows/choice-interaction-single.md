---
name: Choice Interaction — Single Select
route: /
tags: [choice, interaction, single-select]
examples:
  - Single Choice
  - Single Choice - Partial Credit
---

# Choice Interaction — Single Select

Covers single-select choice interaction rendering, selection behavior, validation,
scoring, feedback, and accessibility.

## Basic Display, Validation & Submission

**Setup:** Load "Single Choice" from the example dropdown.

1. Observe the rendered item.
   - [ ] A question prompt is visible above the choices
   - [ ] Choices are displayed as a vertical list
   - [ ] Each choice displays a radio button
   - [ ] No choice is pre-selected
   - [ ] Constraint text reads "Select an answer."
   - [ ] The choice group is wrapped in a fieldset with the prompt as legend
   - [ ] The fieldset's `aria-describedby` references the constraint text

2. Without selecting a choice, click "Submit".
   - [ ] Submission is blocked — no score appears, item stays interactive
   - [ ] The constraint text enters an error state (warning icon appears)
   - [ ] The fieldset has `aria-invalid="true"`
   - [ ] An accessible error message is announced saying there is a problem with the submission

3. Click anywhere on the first choice.
   - [ ] The first choice becomes selected
   - [ ] The validation error clears (warning icon disappears, `aria-invalid` removed)

4. Click a different choice.
   - [ ] That choice is now selected and the previous is deselected (radio behavior)

5. Click "Submit".
   - [ ] A score is displayed
   - [ ] All choices become disabled
   - [ ] Feedback appears explaining correctness
   - [ ] Feedback is accessible to screen readers (announced on appearance)
   - [ ] Reset state and repeat submission to test both correct and incorrect answers


## Keyboard Navigation

**Setup:** Load "Single Choice" from the example dropdown (or reset state if already loaded).

1. Press Tab to move focus into the choice group.
   - [ ] Focus lands on the first radio button
   - [ ] A visible focus indicator appears

2. Use Up/Down arrow keys to move between choices.
   - [ ] Focus and selection move together (standard radio group behavior)

3. Press Tab to leave the choice group.
   - [ ] Focus moves to the next focusable element (e.g., Submit button)

## Partial Credit Scoring

**Setup:** Load "Single Choice - Partial Credit" from the example dropdown.

1. Select an answer.
   - [ ] A score is displayed
   - [ ] All choices become disabled
   - [ ] Feedback appears explaining correctness
   - [ ] Feedback is accessible to screen readers (announced on appearance)
   - [ ] Reset state and repeat submission to test correct, incorrect, and partially correct answers 
