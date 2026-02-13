---
name: Choice Interaction — Label Variants
route: /
tags: [choice, interaction, labels, variants]
examples:
  - Choice Labels & Suffixes
---

# Choice Interaction — Label Variants

Visual verification that all QTI label and suffix vocabulary classes render correctly.

**IMPORTANT:** Labels are rendered via CSS `::before` pseudo-elements. They do NOT appear in raw HTML inspection but ARE exposed in the accessibility tree. You MUST verify using BOTH methods: take a full-page screenshot to visually confirm labels render correctly, AND take an accessibility snapshot to confirm labels are present in the a11y tree.

## Label & Suffix Combinations

**Setup:** Load "Choice Labels & Suffixes" from the Variant Testing group in the example dropdown.

Take a full-page screenshot, then scroll through each interaction and verify the label is visually present before the radio button:

1. `qti-labels-none` — no labels (default)
   - [ ] Choices display with no prefix label

2. `qti-labels-decimal` — no suffix
   - [ ] Choices are prefixed with 1, 2, 3

3. `qti-labels-lower-alpha` — no suffix
   - [ ] Choices are prefixed with a, b, c

4. `qti-labels-upper-alpha` — no suffix
   - [ ] Choices are prefixed with A, B, C

5. `qti-labels-decimal` + `qti-labels-suffix-period`
   - [ ] Choices are prefixed with 1., 2., 3.

6. `qti-labels-lower-alpha` + `qti-labels-suffix-period`
   - [ ] Choices are prefixed with a., b., c.

7. `qti-labels-upper-alpha` + `qti-labels-suffix-period`
   - [ ] Choices are prefixed with A., B., C.

8. `qti-labels-decimal` + `qti-labels-suffix-parenthesis`
   - [ ] Choices are prefixed with 1), 2), 3)

9. `qti-labels-lower-alpha` + `qti-labels-suffix-parenthesis`
   - [ ] Choices are prefixed with a), b), c)

10. `qti-labels-upper-alpha` + `qti-labels-suffix-parenthesis`
    - [ ] Choices are prefixed with A), B), C)
