# Inline Choice Interaction -- QTI v3 Conformance Audit

**Conformance level:** Optional (not required at Basic)
**Date:** 2026-02-12

## Files Audited

- `packages/cutie-client/src/transformer/handlers/inlineChoiceInteraction.ts`
- `packages/cutie-client/src/transformer/handlers/responseUtils.ts`
- `packages/cutie-client/src/transformer/handlers/inlineInteractionAnnotator.ts`
- `packages/cutie-client/src/state/itemState.ts`
- `packages/cutie-core/src/lib/initializeState.ts`
- `packages/cutie-core/src/lib/renderTemplate.ts`

## Summary

The inline choice interaction covers core functionality well -- response binding, shuffle delegation to the server, inline presentation, and accessibility annotations are all solid. The main gaps are around validation (`required` attribute), accessibility polish (placeholder label), test coverage, and hardcoded color values.

## Gaps

### 1. No unit tests (HIGH)

No `inlineChoiceInteraction.spec.ts` exists. The handler's transform logic, default value restoration, error handling, response accessor, and disabled state are entirely untested.

### 2. `required` attribute not supported (MEDIUM)

The spec defines a `required` attribute on `qti-inline-choice-interaction`. The handler ignores it. The response accessor always returns `valid: true`, so an empty selection is accepted unconditionally. Compare with `choiceInteraction.ts` which validates `min-choices` and sets `aria-invalid`.

```typescript
// Line 92-95 -- always valid, no required check
const responseAccessor = () => {
  const value = select.value;
  return { value: value === '' ? null : value, valid: true };
};
```

### 3. Hardcoded colors block user customization (MEDIUM)

The CSS hardcodes `background-color: #fff` and `background-color: #f5f5f5`. These should use CSS custom properties.

### 4. Placeholder option has no accessible label (MEDIUM)

The placeholder `<option>` has empty `value` and empty `textContent`. Screen readers announce nothing. Sighted users see a blank dropdown with no hint. Best practice is to add prompt text (e.g., "Select...") and set `disabled`/`selected` attributes on the placeholder.

### 5. Choice content limited to plain text (LOW)

The spec allows `qti-inline-choice` to contain inline content (markup). The handler reads only `textContent`, which strips formatting. Inline choice options are nearly always plain text in practice.

### 6. No `aria-required` on the select element (LOW)

When `required="true"` is set, the rendered `<select>` should carry `aria-required="true"`.

### 7. No source attribute forwarding (LOW)

Custom `class`, `id`, `dir`, `lang`, and `data-*` attributes from the source element are not forwarded.

### 8. No change event emission (LOW)

No `change` listener or custom event is emitted when the user makes a selection. Host applications cannot react in real-time to selection changes.

## What Passes

| Requirement | Status |
|---|---|
| `response-identifier` (required) | PASS |
| Response collection | PASS |
| Response re-presentation via `qti-default-value` | PASS |
| Shuffle (server-side, respects `fixed`) | PASS |
| Inline flow preservation | PASS |
| Accessibility annotations (`aria-labelledby` via annotator) | PASS |
| Enable/disable state | PASS |
| Error handling for missing attributes | PASS |
| Magnification (`font-size: inherit`) | PASS |
