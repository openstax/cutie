# Text Entry Interaction -- QTI v3 Conformance Audit

**Conformance level:** BASIC (Required)
**Date:** 2026-02-12

## Files Audited

- `packages/cutie-client/src/transformer/handlers/textEntryInteraction.ts`
- `packages/cutie-client/src/transformer/handlers/responseUtils.ts`
- `packages/cutie-client/src/transformer/handlers/inlineInteractionAnnotator.ts`
- `packages/cutie-client/src/state/itemState.ts`
- `packages/cutie-core/src/lib/responseProcessing.ts`
- `packages/cutie-core/src/lib/expressionEvaluator/string.ts`

## Summary

The text entry interaction has a solid core implementation. Response binding, collection, numeric type support, sizing hints, inline accessibility annotations, and server-side scoring (including case-sensitivity semantics for `map_response`) all pass. The main gaps are missing unit tests, the `placeholder-text` attribute not being honored, and a minor hardcoded color in disabled state.

## Gaps

### 1. No response re-presentation on `update()` (MEDIUM)

When `mountItem.update()` is called (e.g., after response processing returns new XML with feedback), the old DOM is destroyed and a fresh render produces blank inputs. The `mountItem` lifecycle maintains a persistent `state` Map across `update()` calls, but the text entry handler neither writes the current value to `context.state` nor reads it back on re-render.

The handler reads from `qti-default-value` in the XML (which works for server-injected values), but any client-side input that hasn't round-tripped through the server would be lost.

**Fix direction:** On render, check `context.state` for a saved value keyed by response identifier. On input change, write the current value to `context.state`.

### 2. `placeholder-text` attribute not honored (MEDIUM)

The QTI spec defines `placeholder-text` on `qti-text-entry-interaction`. It serves as a visual hint in the empty input and as a vocalization aid in speech-based environments. The handler never reads this attribute.

**Fix:** Read the attribute and set `input.placeholder`. One-line addition.

### 3. No dedicated unit tests (MEDIUM)

No `textEntryInteraction.spec.ts` exists. Key behaviors that should be verified:
- Error display when `response-identifier` is missing
- Input type switching for `integer` / `float` base types
- `expected-length` sizing (parsed correctly, default fallback)
- Default value population from `qti-default-value`
- Response accessor: trims whitespace, maps empty to `null`
- Disabled state toggling via observer

### 4. Hardcoded disabled background color (LOW)

The disabled state uses `background-color: #f5f5f5` (hardcoded). This could conflict with user-configured background colors or high-contrast themes.

**Fix:** Replace with CSS variable (e.g., `var(--cutie-disabled-bg, #f5f5f5)`) or use `opacity` alone.

### 5. No `data-qti-*` shared vocabulary passthrough (LOW)

The handler does not copy `data-qti-*` attributes from the source QTI element onto the rendered HTML input.

## What Passes

| Requirement | Status |
|---|---|
| `response-identifier` (required) | PASS |
| Inline rendering (within text flow) | PASS |
| `expected-length` sizing hint | PASS |
| Numeric type support (`integer`/`float` via `<input type="number">`) | PASS |
| Default value population | PASS |
| Response collection (trimmed, empty -> null) | PASS |
| `match_correct` template (server-side) | PASS |
| `map_response` template with case-sensitivity | PASS |
| Custom response processing (`qti-string-match`, `qti-substring`, `qti-pattern-match`) | PASS |
| Inline accessibility labeling (`aria-labelledby` via annotator) | PASS |
| Positional info for multiple interactions ("blank N of M") | PASS |
| Focus indication | PASS |
| Disabled state communicated | PASS |
| Magnification (`font-size: inherit`, `ch` units) | PASS |
| Graceful degradation on unsupported attributes | PASS |
