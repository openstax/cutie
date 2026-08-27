---
name: Choice Interaction — Multiple Select Validation
route: /
tags: [choice, interaction, multi-select, validation, accessibility]
examples:
  - Multiple Choice
---

# Choice Interaction — Multiple Select Validation

Covers min/max-choices constraint validation on a multi-select choice interaction, and
verifies that constraint errors are announced to screen readers (not just shown visually).

## Initial Display

**Setup:** Load "Multiple Choice" from the Supported Examples group in the example dropdown.

1. Observe the rendered item.
   - [ ] A prompt is visible: "Question prompt goes here. Select all that apply."
   - [ ] Four checkboxes are displayed (Choice A–D)
   - [ ] No choice is pre-selected
   - [ ] Constraint text reads "Select at least 1 choice."
   - [ ] The constraint text is in its default (non-error) state — no warning icon
   - [ ] The fieldset's `aria-describedby` references the constraint text

## Empty Submission (min-choices error)

1. Without selecting anything, click "Submit".
   - [ ] Submission is blocked — no score appears, item stays interactive
   - [ ] Constraint text enters error state (warning icon appears, text turns error color)
   - [ ] The fieldset has `aria-invalid="true"`

## Dynamic Error Repetition

2. Click "Submit" again (still nothing selected — same error as step 1).
   - [ ] Submission is still blocked
   - [ ] Constraint text and error state remain visually unchanged

3. Select one choice, then immediately deselect it, then click "Submit".
   - [ ] The same min-choices error reappears

## Valid Submission

4. Select at least one choice, then click "Submit".
   - [ ] Submission succeeds — a score is displayed
   - [ ] Constraint text exits error state (warning icon disappears)
   - [ ] The fieldset no longer has `aria-invalid`
   - [ ] All checkboxes become disabled

## Accessibility (VoiceOver required — manual, macOS)

**Setup:** Reset state. Turn on VoiceOver (Cmd+F5).

1. Take an accessibility snapshot before interacting.
   - [ ] The fieldset has an accessible name (from the legend/prompt)
   - [ ] The constraint message element is linked via `aria-describedby`

2. Without selecting anything, activate "Submit".
   - [ ] VoiceOver announces the specific constraint message ("Select at least 1 choice.") —
     not just a generic "problem with submission" summary
   - [ ] `aria-invalid="true"` is present on the fieldset

3. Activate "Submit" again without changing the selection (repeats the identical error from step 2).
   - [ ] VoiceOver announces the message again — confirms identical repeated errors are not silently dropped

4. Select more choices than reasonable, or select then clear a choice, and re-submit to trigger the
   error a third time.
   - [ ] VoiceOver announces each time, with no double-speaking or garbled overlap between the
     per-field message and the generic submission summary

5. Tab away from the group, then tab back onto a checkbox while the item is still in an error state.
   - [ ] VoiceOver reads "invalid" plus the constraint description text as part of the normal
     focus announcement (confirms description-on-focus works independent of live announcements)
