# Systemic / Non-Interaction Findings -- QTI v3 Conformance Audit

**Conformance level:** BASIC
**Date:** 2026-02-12

## Files Audited

- `packages/cutie-client/src/transformer/handlers/htmlPassthrough.ts`
- `packages/cutie-client/src/transformer/handlers/unsupported.ts`
- `packages/cutie-client/src/transformer/handlers/responseUtils.ts`
- `packages/cutie-client/src/transformer/handlers/contentBody.ts`
- `packages/cutie-client/src/transformer/elementTransformer.ts`
- `packages/cutie-client/src/transformer/types.ts`
- `packages/cutie-client/src/transformer/styleManager.ts`
- `packages/cutie-client/src/parser/xmlParser.ts`
- `packages/cutie-client/src/renderer/domRenderer.ts`
- `packages/cutie-client/src/mountItem.ts`
- `packages/cutie-client/src/styles/baseStyles.ts`
- `packages/cutie-client/src/errors/errorDisplay.ts`
- `packages/cutie-core/src/lib/responseProcessing.ts`
- `packages/cutie-core/src/lib/renderTemplate.ts`
- `packages/cutie-core/src/lib/initializeState.ts`
- `packages/cutie-core/src/lib/expressionEvaluator/index.ts`
- `packages/cutie-core/src/types.ts`

## Systemic Gaps

### 1. Unsupported `qti-*` elements show error UI instead of being silently ignored (HIGH)

The spec says: *"All QTI 3.0 certified applications must be able to operate without failure when features beyond the minimum required features are included. Applications must be able to ignore or remove the unsupported data."*

The `unsupported.ts` handler renders a visible yellow error banner with "Unsupported Element" text for any unrecognized `qti-*` element. This is the opposite of graceful degradation. A valid item with Advanced-only elements (e.g., `qti-order-interaction`, `qti-hotspot-interaction`) would show errors to candidates.

**Fix:** Replace error UI with silent removal or a non-visible placeholder.

### 2. No user-configurable text/background color mechanism (MEDIUM)

The spec requires text appearance (text and background color) to be user-configurable for delivery (A-42a). `MountItemOptions` exposes theming for `primaryColor`, `borderColor`, etc. but no `textColor` or `backgroundColor`. Many interactions hardcode:
- `color: #333`
- `background-color: #fff`
- `background-color: #f5f5f5`

This blocks high-contrast mode and forced-colors mode. A systemic solution (CSS custom properties for text/background in base styles) would fix this across all interactions.

### 3. QTI Shared Interaction Vocabulary not supported (MEDIUM)

Zero `data-qti-*` attributes found anywhere in the codebase. No interaction handler reads or forwards the `class` attribute from source QTI elements. Standardized classes like `qti-labels-decimal`, `qti-orientation-horizontal`, `qti-choices-stacking-2`, `qti-match-tabular` are all silently dropped.

### 4. Magnification concerns in error display (LOW)

`errorDisplay.ts` uses hardcoded pixel sizes (`12px 16px` padding, `14px` font-size, `8px 0` margin). Won't scale with browser zoom. Low severity since errors are development-time diagnostics, but if Gap 1 is not fixed, candidates would see these.

## What Passes

| Area | Status |
|---|---|
| Response Processing Templates (`match_correct`, `map_response`, `map_response_point`) | PASS |
| Full Custom Response Processing (30+ expression operators) | PASS |
| Template Processing (variables, conditionals, constraints, shuffle) | PASS |
| Template Rendering / Sanitization (strip sensitive, inject defaults, resolve assets) | PASS |
| Assessment Item Root (I-0) | PASS |
| Response Declaration (I-1) | PASS |
| Outcome Declaration (I-2) | PASS |
| HTML5 Passthrough (I-8) -- all non-qti elements with attributes | PASS |
| Alt text on images (A-1) -- passthrough preserves `alt` | PASS |
| Captions / track (A-13b) -- passthrough preserves `<track>` | PASS |
| Response collection & storage (`ItemState` register/collect) | PASS |
| Response re-presentation (core injects `qti-default-value`) | PASS |
| Base styles (relative `line-height`, responsive images) | PASS |
| Inline interaction accessibility annotations | PASS |
