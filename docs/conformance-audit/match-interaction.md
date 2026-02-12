# Match Interaction -- QTI v3 Conformance Audit

**Conformance level:** Optional (not required at Basic)
**Date:** 2026-02-12

## Files Audited

- `packages/cutie-client/src/transformer/handlers/matchInteraction/index.ts`
- `packages/cutie-client/src/transformer/handlers/matchInteraction/matchInteractionHandler.ts`
- `packages/cutie-client/src/transformer/handlers/matchInteraction/controller.ts`
- `packages/cutie-client/src/transformer/handlers/matchInteraction/styles.ts`
- `packages/cutie-client/src/transformer/handlers/responseUtils.ts`
- `packages/cutie-core/src/lib/initializeState.ts`
- `packages/cutie-core/src/lib/renderTemplate.ts`
- `packages/cutie-core/src/lib/responseProcessing.ts`

## Summary

The match interaction has genuine strengths: three interaction modes (click-to-connect, drag-and-drop, keyboard), chip-based association display, screen reader announcements, and correct `match-max` enforcement. Server-side processing (shuffle, scoring, default injection) is solid. The main gaps cluster around missing tests, rich content flattening, a memory leak, missing validation, and the absence of `qti-match-tabular` support.

## Gaps

### 1. No unit tests (HIGH)

Zero test files exist for the match interaction. No `matchInteraction.spec.ts` or similar.

### 2. QTI standardized CSS classes not supported -- especially `qti-match-tabular` (MEDIUM)

The handler never reads the `class` attribute from the source element. Line 88 of `matchInteractionHandler.ts` hardcodes the layout:

```typescript
layoutContainer.className = 'qti-match-layout qti-match-source-left';
```

A comment even acknowledges this: `// Default to source-left orientation; later we can read this from QTI class attribute`

Missing classes include `qti-match-tabular` (matrix rendering), `qti-orientation-horizontal`/`vertical`, `qti-labels-*`, and `qti-labels-suffix-*`. Items authored with `qti-match-tabular` will render as a two-column layout instead of the expected matrix/table.

### 3. `min-associations` not read, no response validation (MEDIUM)

`min-associations` is never read. The response accessor always returns `valid: true`. Compare with `choiceInteraction.ts` which validates `min-choices`, shows constraint text, and sets `aria-invalid`.

### 4. Rich content in choices flattened to plain text (MEDIUM)

Choice content is extracted via `textContent` only. The handler does not call `context.transformChildren()` for choices (it does for the prompt). The `choiceInteraction` handler correctly uses `transformChildren()` for its choices. HTML, images, or MathML within match choices will be stripped.

### 5. Document click listener never cleaned up -- memory leak (MEDIUM)

The controller registers `document.addEventListener('click', this.documentClickHandler)` but never removes it. No `destroy()` method, no `context.onCleanup` registration. Every re-render adds a new global listener.

### 6. ARIA `listbox`/`option` roles don't match interaction model (MEDIUM)

Each match set uses `role="listbox"` and each choice uses `role="option"`. Listbox semantics imply selection from a list, but the actual interaction is "connect items between two groups." `aria-selected` is never set on options (expected by the ARIA spec for `role="option"`).

### 7. Hardcoded colors (LOW-MEDIUM)

Many values hardcoded in `styles.ts`: `color: #333`, `background-color: #fff`, `color: #666`, `background-color: #f5f5f5`. Only border colors use CSS custom properties.

### 8. `data-min/max-associations-message` not read (LOW)

Custom constraint messages from the spec are ignored.

### 9. `match-min` per-choice attribute not supported (LOW)

Only `match-max` is parsed. `match-min` (minimum associations per choice) is never read.

## What Passes

| Requirement | Status |
|---|---|
| `response-identifier` (required) | PASS |
| Response collection (directed pairs) | PASS |
| Response re-presentation via defaults | PASS |
| `match_correct` template (server-side) | PASS |
| `map_response` template (server-side) | PASS |
| `directedPair` with `multiple` cardinality (unordered comparison) | PASS |
| `match-max` enforcement (per-choice and overall) | PASS |
| Shuffle (server-side, both match sets, `fixed` respected) | PASS |
| Three interaction modes (click, drag, keyboard) | PASS |
| Screen reader announcements via `announce()` | PASS |
| Magnification (relative units) | PASS |
| Enable/disable state | PASS |

## Core Package (cutie-core) Assessment

No gaps found in server-side processing. Shuffle, scoring, comparison, and default injection all pass.
