# Choice Interaction -- QTI v3 Conformance Audit

**Conformance level:** BASIC (Required)
**Date:** 2026-02-12

## Files Audited

- `packages/cutie-client/src/transformer/handlers/choiceInteraction.ts`
- `packages/cutie-client/src/transformer/handlers/choiceInteraction.spec.ts`
- `packages/cutie-client/src/transformer/handlers/responseUtils.ts`
- `packages/cutie-client/src/state/itemState.ts`
- `packages/cutie-core/src/lib/responseProcessing.ts`
- `packages/cutie-core/src/lib/renderTemplate.ts`
- `packages/cutie-core/src/lib/initializeState.ts`

## Summary

The choice interaction implementation is solid across the majority of the conformance surface. Response binding, collection, restoration, scoring (both `match_correct` and `map_response`), shuffle, and accessibility grouping all pass. One high-severity gap (`max-choices` default) causes hard rendering failure on valid QTI content.

## Gaps

### 1. `max-choices` treated as required instead of optional (HIGH)

The QTI v3 info model (Section 5.30) defines `max-choices` as **optional** with a default of `1`. The handler renders an error and aborts when the attribute is absent:

```typescript
// choiceInteraction.ts lines 49-53
const maxChoicesAttr = element.getAttribute('max-choices');
if (!maxChoicesAttr) {
  fragment.appendChild(createMissingAttributeError('qti-choice-interaction', 'max-choices'));
  return fragment;
}
```

Any spec-compliant QTI content that omits `max-choices` will fail to render entirely. The handler should default to `1` when the attribute is absent.

### 2. Hardcoded colors block user-configurable text and background (MEDIUM)

Several CSS color values are hardcoded rather than using CSS custom properties:

- `color: #333` (prompt text)
- `background-color: #fff` (choice background)
- `background-color: #f5f5f5` (hover and disabled states)
- `color: #666` (constraint text)
- `color: #d32f2f` (error state)

Some values already use custom properties (`var(--cutie-border)`, `var(--cutie-primary)`), but the text and background colors are not configurable. User stylesheets cannot change text or background colors without `!important`.

### 3. QTI shared vocabulary CSS classes not forwarded from source XML (LOW)

The handler does not read or forward the `class` attribute from `qti-choice-interaction` or `qti-simple-choice` elements. Shared vocabulary classes such as `qti-labels-none`, `qti-labels-decimal`, `qti-labels-upper-alpha`, `qti-choices-stacking-2` are silently dropped.

### 4. `orientation` attribute not supported (LOW)

The `orientation` attribute (`horizontal` | `vertical`) is not read. Choices always render vertically via `flex-direction: column`. Optional at Basic level but commonly authored.

### 5. `data-min-selections-message` / `data-max-selections-message` not supported (LOW)

These data attributes allow content authors to specify custom validation messages. The handler generates its own text via `buildConstraintText()`. Custom messages from QTI XML are ignored.

### 6. Native input focus ring suppressed (LOW)

The CSS suppresses the native focus outline on the input with `outline: none`. The parent label has `:focus-within` styling which is generally sufficient, but some assistive technology and browser combinations may not trigger `:focus-within` reliably. Using `:focus-visible` for the suppression would be more robust.

## What Passes

| Requirement | Status |
|---|---|
| `response-identifier` (required) | PASS |
| `min-choices` (optional) | PASS |
| Response collection and binding | PASS |
| Response restoration on return to item | PASS |
| `match_correct` response processing | PASS |
| `map_response` response processing | PASS |
| Shuffle (server-side, respects `fixed`) | PASS |
| `qti-simple-choice` identifier handling | PASS |
| Fieldset/Legend accessible grouping | PASS |
| `aria-describedby` on constraints | PASS |
| `aria-invalid` on validation failure | PASS |
| Screen reader alert announcements | PASS |
| Keyboard focus indication | PASS |
| Magnification support (relative units) | PASS |
