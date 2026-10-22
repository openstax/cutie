---
name: Inline Interactions in Table Cells — Labels
route: /
tags: [inline-choice, text-entry, interaction, table, accessibility, labels]
examples:
  - Drop-Down: Table
  - Inline Choice (Drop-down)
---

# Inline Interactions in Table Cells — Labels

Covers accessible names for inline interactions that are the only content of a table cell.
Such an interaction is labelled by its row header, then its column header, via
`aria-labelledby`. Text in the same cell still takes priority, and an interaction with no text
or headers falls back to `aria-label="blank"`.

## Table Header Labels

**Setup:** Load "Drop-Down: Table" from the NCLEX group.

1. Take an accessibility snapshot.
   - [ ] Each drop-down in the Status column has an accessible name of its row header followed
     by "Status" (e.g. "Temperature Status", "Respiratory rate Status")
   - [ ] No drop-down is named "blank"
   - [ ] Each select has `aria-labelledby` referencing the ids of its row and column `th`
     elements, and no `aria-label`

2. Select an option in the first drop-down.
   - [ ] The accessible name is unchanged (the header labels don't include the selected value)

## Text Labels Outside Tables

**Setup:** Load "Inline Choice (Drop-down)" from the Standard Samples group.

1. Take an accessibility snapshot.
   - [ ] The drop-down's accessible name comes from the sentence around it, not "blank" or a
     header

## Accessibility (VoiceOver required — manual, macOS)

**Setup:** Load "Drop-Down: Table". Turn on VoiceOver (Cmd+F5).

1. Press Tab to move focus to the first drop-down.
   - [ ] VoiceOver announces "Temperature Status" (or the first row's header) as the name, not
     "blank"

2. Press Tab to move to the next drop-down.
   - [ ] VoiceOver announces the next row's header and "Status"

3. Open the VoiceOver rotor (VO+U) and go to Form Controls.
   - [ ] Each drop-down is listed by its row and column header, so they can be told apart
