# Extended Text Interaction -- QTI v3 Conformance Audit

**Conformance level:** BASIC (Required)
**Date:** 2026-02-12

## Files Audited

- `packages/cutie-client/src/transformer/handlers/extendedTextInteraction.ts`
- `packages/cutie-client/src/transformer/handlers/responseUtils.ts`
- `packages/cutie-client/src/state/itemState.ts`
- `packages/cutie-core/src/lib/renderTemplate.ts`

## Summary

The extended text interaction covers core conformance requirements -- response binding, collection, re-presentation, and graceful degradation all work correctly. The architecture with `renderTemplate` injecting `qti-default-value` on the server side and `getDefaultValue()` reading it on the client side is well-designed. The gaps are around test coverage, one missed attribute (`placeholder-text`), and CSS accessibility concerns.

## Gaps

### 1. No unit tests (HIGH)

Zero test files exist for the extended text interaction handler. Tests should cover:
- Missing `response-identifier` produces error display
- Textarea renders with correct attributes and classes
- `qti-prompt` is rendered and linked via `aria-labelledby`
- `expected-lines` sizing hint is applied
- Default value pre-fill from response declaration
- Response accessor returns correct value / `null` for empty
- Disabled state toggling
- Graceful handling of unknown attributes

### 2. `placeholder-text` attribute not honored (MEDIUM)

The QTI spec defines `placeholder-text` to provide hint text inside the input area. The handler does not read this attribute. Other handlers in the codebase (e.g., `formulaInteraction.ts`) do set placeholders.

**Fix:** Read the attribute and set `textarea.placeholder`. Trivial.

### 3. Hardcoded `font-size: 14px` (MEDIUM)

Line 125 sets `font-size: 14px` on the textarea. This overrides the user's configured font size and can interfere with browser zoom and OS-level magnification. The very next line correctly uses `font-family: inherit`, making the inconsistency obvious.

**Fix:** Change to `font-size: inherit`.

### 4. `expected-length` attribute not honored (LOW)

The handler reads `expected-lines` for vertical sizing but ignores `expected-length`. The sibling `textEntryInteraction.ts` handler does honor `expected-length` for width sizing. Inconsistent between the two text-based interactions.

### 5. Custom `data-*` attributes not forwarded (LOW)

If the source `qti-extended-text-interaction` element carries additional `data-*` attributes or extra CSS classes, they are not copied to the rendered container.

### 6. Pixel-based `minHeight` calculation (LOW)

Line 78 calculates `minHeight` using `lines * 20` pixels. This does not scale with user font size or magnification settings. Using relative units like `em` or `lh` would be better.

## What Passes

| Requirement | Status |
|---|---|
| `response-identifier` (required) | PASS |
| Response binding | PASS |
| Response collection (trimmed, empty -> null) | PASS |
| Response re-presentation via `qti-default-value` | PASS |
| `expected-lines` sizing hint | PASS |
| `qti-prompt` rendering with `aria-labelledby` | PASS |
| Graceful degradation on unsupported attributes | PASS |
| `qti-*` CSS classes applied | PASS |
| Disabled state management | PASS |
| No hardcoded `color` on active textarea | PASS |
