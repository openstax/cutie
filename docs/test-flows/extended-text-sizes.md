<!-- spell-checker: ignore textareas -->
---
name: Extended Text — Height-Lines Sizes
route: /
tags: [extended-text, interaction, sizing, variants]
examples:
  - Extended Text Sizes
---

# Extended Text — Height-Lines Sizes

Visual verification that `qti-height-lines-*` vocabulary classes and `expected-lines` attribute correctly control textarea sizing.

## Textarea Sizing

**Setup:** Load "Extended Text Sizes" from the Variant Testing group in the example dropdown.

Take a full-page screenshot, then verify each textarea's visible height:

1. Default (no sizing hints)
   - [ ] Textarea is rendered at the CSS default height (~7.5em, roughly 5 lines)

2. `qti-height-lines-3`
   - [ ] Textarea is noticeably shorter than the default (~3 lines tall)

3. `qti-height-lines-6`
   - [ ] Textarea is slightly taller than the default (~6 lines tall)

4. `qti-height-lines-15`
   - [ ] Textarea is substantially taller than all others (~15 lines tall)

5. `expected-lines="10"` with `qti-height-lines-3` class
   - [ ] Textarea is ~10 lines tall (attribute inline style overrides the height-lines class)
   - [ ] Textarea is taller than the `qti-height-lines-3` textarea above

## Resize Behavior

1. Drag the resize handle on any textarea.
   - [ ] Textarea can be resized vertically (all textareas have `resize: vertical`)
   - [ ] Textarea cannot be resized below its min-height

## Interaction

1. Type text into each textarea.
   - [ ] All textareas accept input normally
   - [ ] Click "Submit" — all responses are collected (no validation constraints on this item)
