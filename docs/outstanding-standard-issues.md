<!-- spell-checker: ignore hottext -->
# Outstanding standard issues

Known gaps in how cutie applies the QTI standard that haven't been fixed yet,
outside the spec divergences tracked in `docs/qti/suggested_spec_corrections.md`.

## A response's maximum mapped value is worked out in more than one way

**Issue:** "the most this response's mapping can award" has three answers,
which disagree for multiple-cardinality responses.

- `inferResponseMaxScore` (`packages/cutie-core/src/lib/deriveMaxScore.ts`), used
  for the item's maximum score, only counts what the interaction allows: the
  best `max-choices` values for choice and hottext interactions, the best
  `max-choices` areas for select point interactions, and no answer (null) for
  other interactions.
- `evaluateResponse` (`packages/cutie-core/src/lib/evaluateResponses.ts`), which
  judges each response correct, partial or incorrect, uses `getMaxMappedValue`
  (`responseDeclarations.ts`). For multiple cardinality that's the sum of every
  positive map entry, whatever the interaction allows.
- The editor's generated feedback conditions
  (`packages/cutie-editor/src/utils/responseProcessingGenerator.ts`,
  `createCorrectnessCheckForId`) use the editor's own `getMaxMappedValue`
  (`utils/mappingDeclaration.ts`), which also sums every positive entry.

**Impact:** a choice interaction with `max-choices="2"` and three choices worth
1 point each has a maximum of 2, but a response worth 2 is judged "partial" and
the generated "correct" feedback (`qti-equal(qti-map-response, 3)`) can never
show. Gap match and match responses get a verdict from a maximum the item can't
reach.

**Suggested fix:** route `evaluateResponse` and the editor's correctness checks
through `inferResponseMaxScore`, and fall back to the correct response (as
`evaluateResponse` already does when there's no mapping maximum) when it gives
null.
