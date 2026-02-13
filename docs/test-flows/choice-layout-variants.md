---
name: Choice Interaction — Layout & Orientation Variants
route: /
tags: [choice, interaction, layout, orientation, stacking, hidden]
examples:
  - Choice Layout & Orientation
---

# Choice Interaction — Layout & Orientation Variants

Visual verification that orientation, stacking, and hidden input control vocabulary classes render correctly, including combinations with label classes.

## Setup

Load "Choice Layout & Orientation" from the Variant Testing group in the example dropdown.

Take a full-page screenshot, then verify each interaction:

## Orientation — Standard (no labels)

1. **Plain horizontal** (`qti-orientation-horizontal`, no labels)
   - [ ] Choices flow left to right
   - [ ] Radio buttons visible
   - [ ] No prefix labels

2. **Horizontal + stacking-3** (`qti-orientation-horizontal qti-choices-stacking-3`, no labels)
   - [ ] 3-column grid, row-major order
   - [ ] Radio buttons visible
   - [ ] No prefix labels

## Orientation — With Labels

3. **Horizontal via vocab class + labels** (`qti-orientation-horizontal` + `qti-labels-upper-alpha qti-labels-suffix-period`)
   - [ ] Choices flow left to right (horizontal)
   - [ ] Upper-alpha labels with period suffix visible (A., B., C., D.)

4. **Horizontal via deprecated attribute + labels** (`orientation="horizontal"` + `qti-labels-decimal`)
   - [ ] Choices flow left to right (same as vocab class)
   - [ ] Decimal labels visible (1, 2, 3)

## Stacking (Grid Layout) — With Labels

5. **Vertical + stacking-2** (`qti-choices-stacking-2` + `qti-labels-lower-alpha qti-labels-suffix-parenthesis`)
   - [ ] Choices arranged in 2-column grid
   - [ ] Column-major order: a), b), c) down the left column, then d), e), f) down the right
   - [ ] Prompt spans full width above the grid
   - [ ] Labels increment in column-major order (a,b,c left; d,e,f right)

6. **Horizontal + stacking-3 + labels** (`qti-orientation-horizontal qti-choices-stacking-3` + `qti-labels-decimal qti-labels-suffix-period`)
   - [ ] Choices arranged in 3-column grid
   - [ ] Row-major order: 1., 2., 3. across the top row, then 4., 5., 6. across the bottom
   - [ ] Prompt spans full width above the grid

7. **Vertical + stacking-3 + labels** (`qti-choices-stacking-3` + `qti-labels-upper-alpha`)
   - [ ] Choices arranged in 3-column grid
   - [ ] Column-major order: A, B down left; C, D middle; E, F right

## Hidden Input Control

8. **Hidden input + labels** (`qti-input-control-hidden` + `qti-labels-decimal qti-labels-suffix-period`)
   - [ ] Radio buttons are NOT visible
   - [ ] Decimal labels still visible (1., 2., 3.)
   - [ ] Clicking a choice still selects it (border highlight changes)
   - [ ] Keyboard Tab + arrow keys still work

9. **Hidden input + horizontal, no labels** (`qti-input-control-hidden qti-orientation-horizontal`)
   - [ ] No radio buttons visible
   - [ ] Choices flow left to right
   - [ ] Selection works via click and keyboard

10. **Hidden input + stacking-2 + labels** (`qti-input-control-hidden qti-choices-stacking-2` + `qti-labels-lower-alpha`)
    - [ ] No radio buttons visible
    - [ ] 2-column grid, column-major order
    - [ ] Lower-alpha labels visible (a, b, c, d)

## Edge Cases

11. **Stacking-1** (`qti-choices-stacking-1` + `qti-labels-decimal`)
    - [ ] Looks identical to default vertical layout (single column, no grid)
    - [ ] Decimal labels visible (1, 2, 3)

12. **Everything combined** (`qti-orientation-horizontal qti-choices-stacking-2 qti-input-control-hidden` + `qti-labels-upper-alpha qti-labels-suffix-parenthesis`)
    - [ ] 2-column grid, row-major order (horizontal)
    - [ ] No radio buttons visible
    - [ ] Upper-alpha labels with parenthesis (A), B), C), D))
    - [ ] Selection and keyboard navigation still work
