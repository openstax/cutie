# Gap Match Interaction -- QTI v3 Conformance Audit

**Conformance level:** Optional (not required at Basic)
**Date:** 2026-02-12

## Files Audited

- `packages/cutie-client/src/transformer/handlers/gapMatchInteraction/index.ts`
- `packages/cutie-client/src/transformer/handlers/gapMatchInteraction/gapMatchInteractionHandler.ts`
- `packages/cutie-client/src/transformer/handlers/gapMatchInteraction/gapHandler.ts`
- `packages/cutie-client/src/transformer/handlers/gapMatchInteraction/controller.ts`
- `packages/cutie-client/src/transformer/handlers/gapMatchInteraction/styles.ts`
- `packages/cutie-client/src/transformer/handlers/responseUtils.ts`
- `packages/cutie-core/src/lib/initializeState.ts`
- `packages/cutie-core/src/lib/renderTemplate.ts`

## Summary

The core mechanics are solid: drag-and-drop, click-to-place, response binding, directed pair format, shuffle, `match-max` enforcement, `match-group` filtering, response restoration, and accessibility (ARIA roles, live announcements, keyboard navigation with roving tabindex) are all well-implemented. The primary gaps cluster around constraint enforcement (`min-associations`, `max-associations`, `match-min`, `required`) and the validation plumbing needed to report constraints back to the delivery system.

## Gaps

### 1. `min-associations` / `max-associations` not implemented (HIGH)

The spec defines these on `qti-gap-match-interaction` to constrain the total number of gap-choice pairs. Neither attribute is read or enforced. Without `max-associations`, there is no cap on total pairings beyond individual `match-max` values. Without `min-associations`, minimum pairing counts cannot be enforced.

### 2. Response validation always returns `valid: true` (HIGH)

The response accessor unconditionally returns `valid: true`:

```typescript
return { value: response.length > 0 ? response : null, valid: true };
```

Even when `min-associations` is not met, `match-min` on choices is not satisfied, or `required` gaps are not filled, the interaction never signals an invalid response.

### 3. No client-side unit tests (HIGH)

No test files exist for the gap match interaction client handler. The handler, controller, gap handler, drag-and-drop logic, keyboard interaction, match-group filtering, response collection, and default value restoration have zero test coverage.

### 4. `required` attribute on `qti-gap` not implemented (MEDIUM)

The spec defines `required` on `qti-gap` indicating whether a gap must be filled. Neither `gapHandler.ts` nor `controller.ts` reads or enforces this.

### 5. `match-min` per-choice not implemented (MEDIUM)

The spec defines `match-min` on `qti-gap-text` and `qti-gap-img` specifying the minimum number of gaps a choice must be matched to. Not read or enforced.

### 6. Document click listener never cleaned up -- memory leak (MEDIUM)

The controller registers `document.addEventListener('click', ...)` but never removes it. No `destroy()` or cleanup method. Each re-render adds a new listener.

### 7. Hardcoded colors / `font-family` override (MEDIUM)

Multiple hardcoded colors in `styles.ts`: `#f9f9f9`, `#f0f0f0`, `#fff`, `#f5f5f5`, `#333`, `#c62828`, etc. Also `font-family: system-ui, -apple-system, sans-serif` overrides user preference. Some values use CSS custom properties but many don't.

### 8. `data-min/max-selections-message` not implemented (LOW)

Custom validation messages from the spec are ignored.

### 9. `data-choices-container-width` not implemented (LOW)

Optional width hint for the choices container. Not read or applied.

### 10. `qti-gap-img` shows alt text instead of image in filled gaps (LOW)

When an image choice is placed in a gap, the controller sets `contentSpan.textContent = content` where `content` is the alt text. The actual image is not rendered inside the gap.

## What Passes

| Requirement | Status |
|---|---|
| `response-identifier` (required) | PASS |
| `qti-gap-text` choices | PASS |
| `qti-gap-img` choices | PASS |
| `qti-gap` elements within content | PASS |
| Response collection (directed pairs) | PASS |
| Response re-presentation via defaults | PASS |
| Drag-and-drop interaction | PASS |
| Click-to-place (keyboard-accessible alternative) | PASS |
| `match-max` on choices (including unlimited) | PASS |
| `match-group` filtering (choices and gaps) | PASS |
| Shuffle (server-side, respects `fixed`) | PASS |
| `qti-prompt` handling with `aria-labelledby` | PASS |
| ARIA roles, live announcements, keyboard navigation | PASS |
| Enable/disable state | PASS |
| Magnification (relative units) | PASS |
| Graceful degradation on missing attributes | PASS |

## Core Package (cutie-core) Assessment

No gaps found. Shuffle order generation, template application, and response processing all pass.
