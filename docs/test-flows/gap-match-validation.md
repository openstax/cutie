---
name: Gap Match — Validation
route: /
tags: [gap-match, interaction, validation, accessibility, rationale, partial-credit]
examples:
  - Gap Match
  - Gap Match - Rationale (Dyad)
  - "Drag-and-Drop: Rationale (Triad)"
---

# Gap Match — Validation

Covers `min-associations` constraint validation on a gap-match interaction, verifies that
constraint errors are announced to screen readers (not just shown visually), and covers
gap-match's cause/effect rationale scoring pattern (an all-or-nothing dyad and a cause-gated
partial-credit triad).

## Initial Display

**Setup:** Load "Gap Match" from the Standard Samples group in the example dropdown.

1. Observe the rendered item.
   - [ ] A prompt is visible: "Drag the correct term into each blank to complete the description of photosynthesis."
   - [ ] Four draggable words are available (carbon dioxide, water, oxygen, plus the distractor nitrogen)
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

## Rationale Scoring: All-or-Nothing (Dyad)

**Setup:** Load "Gap Match - Rationale (Dyad)" from the Supported Examples group. This item is a
single gap-match interaction whose sentence has two gaps (cause, effect), fed by two separate
word-bank boxes side by side — one for cause words, one for effect words. `match-group` scoping
keeps each box's words restricted to its own gap. Worth 1 point: both gaps must be correct for
any credit (all-or-nothing; no partial credit).

The correct answers are: cause gap = **warm front**, effect gap = **a rising temperature**.

1. Observe the rendered item.
   - [ ] One interaction is visible: a single sentence with two gaps (cause, then effect), and
     two bordered word-bank boxes below/beside it, side by side
   - [ ] The first box has the heading "Event" (also its screen-reader name) and shows the
     cause words: "warm front", "cold front", "stationary front"
   - [ ] The second box has the heading "Reading" and shows the effect words: "a rising
     temperature", "a falling temperature", "a steady temperature"
   - [ ] The headings appear only over the boxes, not in the sentence area
   - [ ] The constraint text reads "Fill at least 2 gaps."

2. Try to drag an effect word (e.g. a rising temperature) into the cause gap, and a cause word
   (e.g. warm front) into the effect gap.
   - [ ] Neither placement is accepted (the gap does not highlight as a valid drop target while
     dragging, and the word is not placed) — `match-group` keeps cause words out of the effect
     gap and vice versa
   - [ ] An announcement is made confirming the placement was rejected (e.g. "... cannot be
     placed in this gap.")

3. Drag **warm front** into the cause gap and **a rising temperature** into the effect gap, then
   click "Submit".
   - [ ] Score displayed is **1 / 1**
   - [ ] Correct-style feedback appears for both the cause and the effect

4. Reset. Fill the cause gap correctly but the effect gap with the wrong word (e.g. a falling
   temperature), then click "Submit".
   - [ ] Score displayed is **0 / 1** (no partial credit — both gaps required)
   - [ ] Effect shows incorrect-style feedback; cause shows correct

5. Reset. Fill the effect gap correctly but the cause gap with the wrong word (e.g. cold front),
   then click "Submit".
   - [ ] Score displayed is **0 / 1**
   - [ ] Cause shows incorrect-style feedback; effect shows correct

6. Reset. Drag a word into a gap, then drag it back out (or remove it via the appropriate
   control).
   - [ ] The word becomes available in the word bank again; the gap returns to empty

7. After any submission.
   - [ ] The interaction becomes disabled

## Rationale Scoring: Cause Gate & Partial Credit (Triad)

**Setup:** Load "Drag-and-Drop: Rationale (Triad)" from the NCLEX Samples group. This item is a
single gap-match interaction whose sentence has three gaps (a cause, then two findings), fed by
two word banks side by side: one for the causes, one shared by both finding gaps. `match-group`
scoping keeps each bank's options restricted to its own gaps. Worth 2 points: the cause must be
correct for any credit, then each correct finding earns 1 point, in either order.

The correct answers are: cause = **hypoglycemia**, findings = **a capillary blood glucose of
52 mg/dL** and **trembling and diaphoresis** (either finding in either finding gap).

1. Observe the rendered item.
   - [ ] One interaction is visible: a single sentence with three gaps (a cause, then two
     findings), and two bordered word banks side by side
   - [ ] One bank has the heading "Condition" (also its screen-reader name) and shows the
     causes: "hypoglycemia", "hyperglycemia", "deficient fluid volume"
   - [ ] The other bank has the heading "Findings" and shows all five findings: "a capillary
     blood glucose of 52 mg/dL", "trembling and diaphoresis", "a respiratory rate of 16/min",
     "moist mucous membranes", "a blood pressure of 126/78 mm Hg"
   - [ ] The headings appear only over the banks, not in the sentence area
   - [ ] The constraint text reads "Fill at least 3 gaps."

2. Try to drag a finding (e.g. trembling and diaphoresis) into the cause gap, and a cause (e.g.
   hypoglycemia) into either finding gap.
   - [ ] Neither placement is accepted (the gap does not highlight as a valid drop target while
     dragging) — `match-group` keeps causes out of the finding gaps and vice versa
   - [ ] An announcement is made confirming the placement was rejected (e.g. "... cannot be
     placed in this gap.")

3. Fill the cause gap with **hypoglycemia**, the first finding gap with **a capillary blood
   glucose of 52 mg/dL**, and the second with **trembling and diaphoresis**, then click "Submit".
   - [ ] Score displayed is **2 / 2**
   - [ ] The worked solution appears below the sentence

4. Reset. Fill the same answers with the two findings swapped, then click "Submit".
   - [ ] Score displayed is **2 / 2** (the findings can go in either order)

5. Reset. Fill the cause gap and one finding gap correctly, but put a wrong finding in the other
   (e.g. a blood pressure of 126/78 mm Hg), then click "Submit".
   - [ ] Score displayed is **1 / 2** (partial credit)

6. Reset. Fill the cause gap with the wrong cause (e.g. hyperglycemia) but both finding gaps
   correctly, then click "Submit".
   - [ ] Score displayed is **0 / 2** (cause gate — no credit without the correct cause)
   - [ ] The worked solution appears below the sentence

7. Verify the findings bank enforces one use per option: drag **trembling and diaphoresis** into
   the first finding gap.
   - [ ] The option becomes disabled/unavailable in its bank (`match-max="1"`) and cannot be
     dragged into the second finding gap as well

8. After any submission.
   - [ ] The interaction becomes disabled
