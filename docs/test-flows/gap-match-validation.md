---
name: Gap Match — Validation
route: /
tags: [gap-match, interaction, validation, accessibility]
examples:
  - Gap Match
---

# Gap Match — Validation

Covers `min-associations` constraint validation on a gap-match interaction, and verifies
that constraint errors are announced to screen readers (not just shown visually).

## Initial Display

**Setup:** Load "Gap Match" from the Supported Examples group in the example dropdown.

1. Observe the rendered item.
   - [ ] A prompt is visible: "Drag the words to fill in the blanks in the sentence below."
   - [ ] Four draggable words are available (word A, word B, word C, plus one unused word)
   - [ ] Three gaps are present in the sentence, all empty
   - [ ] Constraint text reads "Fill at least 3 gaps."
   - [ ] The constraint text is in its default (non-error) state — no warning icon
   - [ ] The interaction container's `aria-describedby` references the constraint text

## Incomplete Submission (min-associations error)

1. Without filling any gaps, click "Submit".
   - [ ] Submission is blocked — no score appears, item stays interactive
   - [ ] Constraint text enters error state (warning icon appears, text turns error color)
   - [ ] The interaction container has `aria-invalid="true"`

## Dynamic Error Repetition

2. Click "Submit" again (still no gaps filled — same error as step 1).
   - [ ] Submission is still blocked, error state unchanged

3. Fill one gap, then remove it (drag the word back or use the appropriate control), then click "Submit".
   - [ ] The same min-associations error reappears

## Valid Submission

4. Fill all three gaps, then click "Submit".
   - [ ] Submission succeeds — a score is displayed
   - [ ] Constraint text exits error state (warning icon disappears)
   - [ ] The interaction container no longer has `aria-invalid`
   - [ ] Draggable choices become disabled

## Accessibility (VoiceOver required — manual, macOS)

**Setup:** Reset state. Turn on VoiceOver (Cmd+F5).

1. Take an accessibility snapshot before interacting.
   - [ ] The interaction container has an accessible name/label (from the prompt)
   - [ ] The constraint message element is linked via `aria-describedby`

2. Without filling any gaps, activate "Submit".
   - [ ] VoiceOver announces the specific constraint message ("Fill at least 3 gaps.") — not
     just a generic "problem with submission" summary
   - [ ] `aria-invalid="true"` is present on the interaction container

3. Activate "Submit" again without changing anything (repeats the identical error from step 2).
   - [ ] VoiceOver announces the message again — confirms identical repeated errors are not
     silently dropped

4. Fill one gap, remove it, and re-submit to trigger the error a third time.
   - [ ] VoiceOver announces each time, with no double-speaking or garbled overlap between the
     per-field message and the generic submission summary

5. Navigate away from the interaction, then back onto it while still in an error state.
   - [ ] VoiceOver reads "invalid" plus the constraint description text as part of the normal
     focus announcement (confirms description-on-focus works independent of live announcements)
