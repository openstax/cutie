# Formula Interaction -- QTI v3 Conformance Audit

**Conformance level:** Non-standard extension (not a QTI interaction type)
**Date:** 2026-02-12

## Files Audited

- `packages/cutie-client/src/transformer/handlers/formulaInteraction.ts`
- `packages/cutie-client/src/transformer/handlers/mathFieldLoader.ts`
- `packages/cutie-client/src/transformer/handlers/responseUtils.ts`
- `packages/cutie-client/src/transformer/handlers/extendedTextInteraction.ts`
- `packages/cutie-core/src/lib/responseProcessing.ts`
- `packages/cutie-core/src/lib/expressionEvaluator/comparison.ts`
- `packages/cutie-core/src/lib/expressionEvaluator/math.ts`

## What Is This?

The "formula interaction" is **not a standard QTI 3.0 interaction type**. There is no `<qti-formula-interaction>` element in the QTI v3 specification. This is a proprietary rendering enhancement built on top of `<qti-extended-text-interaction>`.

The mechanism:
1. Item XML uses a standard `<qti-extended-text-interaction>` in the item body.
2. The `<qti-response-declaration>` carries non-standard `data-*` attributes: `data-response-type="formula"` and `data-comparison-mode="strict|canonical|algebraic"`.
3. Client-side: the formula handler (priority 40) intercepts the element before the generic extended-text handler (priority 50), detects the flag, and renders a MathLive `<math-field>` web component instead of a `<textarea>`.
4. Server-side: the same `data-*` attributes cause `<qti-match>` to route through Cortex.js Compute Engine for mathematical equivalence checking.

## Gaps

### 1. Altered semantics of `<qti-match>` -- items are NOT portable (CRITICAL)

The `<qti-match>` operator in QTI 3.0 is defined as exact value comparison. By intercepting it and performing mathematical equivalence based on proprietary `data-*` attributes, the implementation **changes the semantics of a standard QTI operator**.

An item where the correct answer is `x^2-1` would accept `(x+1)(x-1)` in Cutie but reject it on any other conformant QTI 3.0 platform. Items authored with formula mode are not portable.

### 2. Not implemented as PCI (MEDIUM)

The QTI spec provides `<qti-portable-custom-interaction>` specifically for non-standard interaction behavior. Using `data-*` attributes to extend standard element behavior is an ad-hoc mechanism not recognized by the spec. While not schema-violating, it creates a proprietary feature invisible to other QTI engines.

### 3. CSS namespace collision (MEDIUM)

The handler outputs elements with classes like `qti-formula-interaction`, `qti-formula-field-wrapper`, `qti-formula-loading`, etc. The `qti-` prefix is reserved by the QTI spec for standard elements. Should use a project-specific prefix like `cutie-formula-*`.

### 4. No unit tests (MEDIUM)

No test files for the formula interaction handler. The core-side math comparison has tests in `math.spec.ts`, but the client rendering path is untested.

### 5. Ignores extended-text attributes (LOW)

The formula handler ignores `expected-lines`, `expected-length`, `placeholder-text`, and `format` that the standard `extendedTextInteraction` handler supports. If an author sets `expected-lines` on a formula interaction, it will be silently ignored.

## What Works Well

| Aspect | Status |
|---|---|
| `response-identifier` binding | PASS |
| Response collection | PASS |
| Graceful degradation (MathLive failure -> textarea fallback) | PASS |
| `qti-prompt` support | PASS |
| Accessibility (`aria-labelledby`/`aria-label`) | PASS |
| Disabled state | PASS |
| Item body XML is valid QTI 3.0 | PASS |

## Recommendation

The implementation is well-engineered within its own ecosystem. However, from a QTI v3 conformance standpoint, the core issue is that it modifies the behavior of a standard operator based on proprietary metadata, making items non-portable. If cross-platform interoperability is a goal, this feature should either be re-implemented using the PCI mechanism, or the portability limitation should be explicitly documented as an extension.
