---
name: Extended Text — Pattern Validation
route: /
tags: [extended-text, interaction, pattern-mask, validation, min-strings]
examples:
  - Extended Text Pattern Validation
---

# Extended Text — Pattern Validation

Covers `pattern-mask` regex validation combined with `min-strings` required input on an extended text interaction. Verifies constraint text swaps dynamically between error messages.

## Initial Display

**Setup:** Load "Extended Text Pattern Validation" from the Variant Testing group in the example dropdown.

1. Observe the rendered item.
   - [ ] A prompt is visible: "What is the answer to life, the universe, and everything?"
   - [ ] A textarea is displayed with placeholder text "Type a number..."
   - [ ] The textarea is short (~3 lines, using `qti-height-lines-3`)
   - [ ] Constraint text reads "Enter a response." (the min-strings hint)
   - [ ] The constraint text is in its default (non-error) state — no warning icon
   - [ ] The textarea's `aria-describedby` references the constraint element

## Empty Submission (min-strings error)

1. Without typing anything, click "Submit".
   - [ ] Submission is blocked — no score appears, item stays interactive
   - [ ] Constraint text still reads "Enter a response."
   - [ ] Constraint text enters error state (warning icon appears, text turns error color)
   - [ ] The textarea has `aria-invalid="true"`

## Invalid Format (pattern-mask error)

2. Type "abc" into the textarea, then click "Submit".
   - [ ] Submission is blocked
   - [ ] Constraint text changes to "Enter a whole number."
   - [ ] Constraint text is in error state (warning icon visible)
   - [ ] The textarea has `aria-invalid="true"`

## Dynamic Error Swapping

3. Clear the textarea (remove all text), then click "Submit".
   - [ ] Constraint text swaps back to "Enter a response."
   - [ ] Error state remains active

4. Type "abc" again, then click "Submit".
   - [ ] Constraint text swaps to "Enter a whole number."

## Valid Submission

5. Clear the textarea, type "42", then click "Submit".
   - [ ] Submission succeeds — a score is displayed
   - [ ] Constraint text exits error state (warning icon disappears)
   - [ ] The textarea no longer has `aria-invalid`
   - [ ] The textarea becomes disabled

## Accessibility

**Setup:** Reset state if needed.

1. Take an accessibility snapshot.
   - [ ] The textarea has an accessible label (via `aria-labelledby` linking to the prompt)
   - [ ] The constraint message element is linked via `aria-describedby`

2. Submit with empty input, then take another accessibility snapshot.
   - [ ] `aria-invalid="true"` is present on the textarea
