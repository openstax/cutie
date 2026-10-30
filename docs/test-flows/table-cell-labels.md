---
name: Interactions in Table Cells — Labels
route: /
tags: [inline-choice, text-entry, choice, interaction, table, accessibility, labels]
examples:
  - Drop-Down: Table
  - Inline Choice (Drop-down)
  - Multiple Response: Grouping
---

# Interactions in Table Cells — Labels

Covers accessible names for interactions in table cells that have no label of their own.

- An inline interaction that is the only content of a cell is labelled by its row header, then
  its column header, via `aria-labelledby`. Text in the same cell still takes priority, and an
  interaction with no text or headers falls back to `aria-label="blank"`.
- A choice interaction with no `qti-prompt` in a cell has its fieldset labelled the same way.
  A prompt still takes priority, and one with no prompt or headers has no name.

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

## Choice Group Labels

**Setup:** Load "Multiple Response: Grouping" from the NCLEX group.

1. Take an accessibility snapshot.
   - [ ] Each checkbox group has an accessible name of its row header followed by "Findings"
     (e.g. "Cardiovascular Findings", "Respiratory Findings")
   - [ ] Each group's description is its constraint text ("Select at least 1 choice.")
   - [ ] Each checkbox is named by its option text
   - [ ] Each fieldset has `aria-labelledby` referencing the ids of its row and column `th`
     elements, and no `legend`

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

**Setup:** Load "Multiple Response: Grouping". Turn on VoiceOver (Cmd+F5).

4. Press Tab to move focus to the first checkbox.
   - [ ] VoiceOver announces the group as "Cardiovascular Findings" along with the checkbox's
     option text
