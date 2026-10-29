<!-- spell-checker: ignore gcd inlines unprefixed HINTREQUEST SOLREQUEST -->
# Suggested QTI Spec Corrections

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl

Places where cutie diverges from the QTI 3.0 spec: mostly cutie-core's
template/response processing, plus a few interaction behaviors in
cutie-client. Items keep their numbers when they're fixed or new ones are
added, so the numbering isn't an order of importance. Line references are as
of cutie-core 2.2.1.

---

## 1. Template-driven visibility matches the wrong attribute

**Status:** Fixed. `processTemplateConditionals` (`lib/visibility.ts`)
looks up the template variable `template-identifier` names and compares its
value with the element's `identifier`, following the QTI 3 Information Model
(TemplateBlock §5.145, TemplateInline §5.155, SimpleChoice §5.132). The 1EdTech
`template_image.xml` example is in the example app
(`cutie-example/src/example-items/spec-template-image.ts`) and covered by tests.

## 2. Outcome variables are not reset between submissions

**File:** `packages/cutie-core/src/lib/responseProcessing.ts:84`

**Spec:** For **non-adaptive** items (`adaptive="false"`), outcome variables
are reset to their defaults before each response processing run. Adaptive
items (`adaptive="true"`) keep their outcomes across submissions. That's how
adaptive items such as the spec's Monty Hall example track their state from
one turn to the next.

**Cutie:** `processResponse` always starts from `{ ...currentState.variables }`,
with no reset. Most resubmissions are covered elsewhere:

- A non-adaptive item is set to `completed` after any submission
  (`responseProcessing.ts:118`), so it can't put itself back into an
  unfinished state.
- With `maxTries`, starting the next try resets outcomes with
  `resetOutcomeVariables` (`tries.ts`, `beginNextTry`).

**When this matters:** A completed attempt can be submitted again while it
awaits manual scoring (`index.ts:125`, `pendingManualScoring`). That
submission runs response processing on the previous submission's outcomes, so
outcomes that should be worked out again from scratch, such as `FEEDBACK`, can
build up.

**Suggested fix:** When `adaptive` isn't `true`, reset outcomes before running
the rules, reusing `resetOutcomeVariables` (`initializeState.ts:112`).
Adaptive items must keep the current behavior.

## 3. Missing default values and built-in variables

**File:** `packages/cutie-core/src/lib/initializeState.ts:190` (`initialVariables`)

**Spec:**
- Template variables start at their `qti-default-value` before template
  processing runs.
- Response variables start at their `qti-default-value`, or NULL if none.
- The built-in response variables `numAttempts` and `duration` exist.
  `numAttempts` goes up by one on each submission.
- The built-in outcome `completionStatus` starts as `not_attempted`.

**Cutie:** Only outcome defaults are loaded. Template and response defaults
are ignored. `duration` isn't maintained, so rules that read it get NULL.
`completionStatus` exists only on `AttemptState`, not as a variable, until
response processing sets it. (`numAttempts` is maintained: it starts at 0, goes
up by one on each submission, and starts over with each try.)

**Suggested fix:** Load template and response defaults in `initializeState`,
and seed `completionStatus`.

## 4. NULL propagation: operators throw instead of returning NULL

**Files:** `packages/cutie-core/src/lib/expressionEvaluator/*.ts`

**Spec:** Most operators return NULL when any sub-expression is NULL (for
example `qti-sum`, `qti-lt`, `qti-gt`, `qti-and`, `qti-or`, `qti-not`,
`qti-match`, `qti-equal`). A condition that evaluates to NULL counts as false
in `qti-response-if` and `qti-template-if`.

**Cutie:** Operators handle NULL in three different ways:

- **Throw:** `qti-lt`, `qti-gt`, `qti-lte`, `qti-gte`, `qti-subtract`, `qti-and`,
  `qti-or` and `qti-not` type-check their operands and throw on NULL. So an
  unanswered response inside `qti-lt` breaks processing completely.
- **Skip:** `qti-sum` and `qti-product` leave NULL operands out and return a
  number, where the spec says the result is NULL.
- **Return false:** `qti-match` and `qti-equal` return `false` for a NULL
  operand, not NULL.

The `if` / `else-if` evaluators also throw on a NULL condition
(`responseProcessing.ts:299`, and the same code at `initializeState.ts:320`)
instead of treating it as false.

**Suggested fix:** Return NULL from operators when any operand is NULL.
Treat NULL conditions as false in the condition evaluators.

### 4a. `qti-multiple` / `qti-ordered` keep NULL values

**File:** `packages/cutie-core/src/lib/expressionEvaluator/containers.ts` (`evaluateMultiple`, which `evaluateOrdered` also uses)

**Spec:** Sub-expressions that are NULL are left out of the container. If
there are no sub-expressions, or they're all NULL, the result is NULL.

**Cutie:** NULL sub-expressions are added to the container as `null`, so an
all-NULL container comes back as `[null]`. An empty container comes back as
`[]`. Both should be NULL.

**Example:** The common "append to feedback" pattern
`FEEDBACK = multiple(FEEDBACK, INCORRECT)`, with `FEEDBACK` starting out NULL,
gives `[null, 'INCORRECT']` instead of `['INCORRECT']`. Feedback visibility
still works because it only checks what the container includes. But
`qti-container-size`, `qti-match` against a literal container, and
`qti-is-null` all give the wrong answer.

**Suggested fix:** Leave out NULL values in `evaluateMultiple`, and return NULL
when the result is empty.

## 5. `qti-equal` ignores `tolerance-mode`

**File:** `packages/cutie-core/src/lib/expressionEvaluator/comparison.ts:179`

**Spec:** `tolerance-mode` accepts `exact`, `absolute`, or `relative`, using
the `tolerance`, `include-lower-bound`, and `include-upper-bound` attributes.

**Cutie:** Always compares exactly (there's a TODO in the code).

**Suggested fix:** Implement absolute and relative tolerance.

The example item `template-simple-interest` (cutie-example) already uses
`tolerance-mode="absolute"`; it scores exact answers correctly today and will
accept near answers once this is implemented.

## 6. `qti-printed-variable` ignores formatting attributes

**File:** `packages/cutie-core/src/lib/renderTemplate.ts:395` (`substituteVariables`)

**Spec:** Supports `format` (printf-style), `base`, `index`, `power-form`,
`field`, and `delimiter`. Container values are printed using the delimiter
(default `;`).

**Cutie:** Prints `String(value)`, so arrays come out comma-joined and no
formatting is applied.

**Suggested fix:** Implement at least `format`, `index`, and `delimiter`.

## 7. MathML variable substitution is too broad and misses unprefixed MathML

**File:** `packages/cutie-core/src/lib/renderTemplate.ts` (`substituteMathVariables`)

**Spec:** QTI 3 Information Model, TemplateDeclaration `math-variable`: "If
mathVariable is set in a template variable's declaration then all instances of
'mi' and 'ci' that match the name of the template variable must be replaced by
'mn' and 'cn' respectively with the template variable's value as their content."
Only template variables are substituted, and only those that set `math-variable`.

**Cutie:**
- Substitutes **any** variable whose name matches the element's text,
  including outcome and response variables, whether or not `math-variable` is
  set. Since outcomes are otherwise hidden from the client, this could leak
  values.
- Matches `mn` as well as `mi`, and ignores `ci`.
- Replaces the element's text but keeps the element, so an `mi` stays an `mi`
  instead of becoming an `mn` (and a `ci` would stay a `ci` instead of a `cn`).
- Only finds elements with the `m:` prefix. MathML that uses a default
  namespace (`<math xmlns="...">` with bare `<mi>`) is skipped.

**Suggested fix:** Substitute only template variables whose declaration sets
`math-variable="true"`. Replace each matching `mi` with an `mn` and each `ci`
with a `cn`, holding the value, and leave `mn` alone. Match MathML elements by
namespace instead of by prefix.

## 8. `pair` / `directedPair` / `point` values are stored differently in different places

**Status:** Fixed. `parseValue` and `parseResponseValue`
(`utils/typeParser.ts:22`, `:61`) both keep `point` and `directedPair` values as
strings, and both normalize `pair` values with `normalizePair` (`:6`), so a
`pair` matches without regard to order. Submitted responses are normalized the
same way.

## 9. `map_response` / `qti-map-response` details

**File:** `packages/cutie-core/src/lib/responseDeclarations.ts:187` (`mapResponse`),
`:151` (`getMappedValue`), `:128` (`case-sensitive`)

**Spec:**
- For multiple cardinality, each distinct value is mapped once. Duplicates
  aren't counted twice.
- `case-sensitive` on `qti-map-entry`: *needs verification*. The QTI 3
  default may be `true`, and cutie treats it as `false`.

**Cutie:** Adds up every array element, duplicates included. Matches
case-insensitively unless `case-sensitive="true"`. (Keys for `pair` responses
already match without regard to order.)

**Suggested fix:** Remove duplicates before mapping. Check the
case-sensitivity default against the spec and XSD.

## 10. Template variables are deleted when constraint retries run out

**File:** `packages/cutie-core/src/lib/initializeState.ts:36`

**Spec:** If `qti-template-constraint` still fails after the maximum number of
retries (the spec suggests 100), processing continues with the **last
generated values**.

**Cutie:** Loops up to 1000 times. Each failure clears the template
variables, so if every attempt fails they're left deleted and the item
renders with nothing filled in.

**Suggested fix:** On the last attempt, keep the values instead of resetting
them. Consider lowering the cap to match the spec's guidance.

## 11. Unimplemented operators

**File:** `packages/cutie-core/src/lib/expressionEvaluator/index.ts:175`

Any unrecognized expression throws `Unsupported expression type`. Notable
gaps include `qti-lookup-outcome-value`, `qti-default`, `qti-inside`,
`qti-gcd`, `qti-lcm`, `qti-math-operator`,
`qti-math-constant`, `qti-equal-rounded`, `qti-round-to`, `qti-stats-operator`,
`qti-duration-lt`, `qti-duration-gte`, and `qti-custom-operator`. The
response processing rule `qti-response-processing-fragment` isn't supported,
and response processing silently skips any other rule it doesn't recognize.

`qti-min` and `qti-max` are implemented (`expressionEvaluator/arithmetic.ts`),
following the QTI 3 Information Model §2.11.3.13 and §2.11.3.14: values of
multiple and ordered containers are included, and the result is NULL when any
sub-expression is NULL or not numeric.

**Spec example these block:** the 1EdTech
[`Example04-feedbackBlock-templateBlock.xml`](https://github.com/1EdTech/qti-examples/blob/master/qtiv3-examples/packaging/items/Example04-feedbackBlock-templateBlock.xml)
("Find side, directly or sine rule - with solution"), an adaptive item that
uses template blocks to show one of two worked solutions. Beginning an attempt
fails with `Unsupported expression type: qti-math-constant`. To support it,
cutie-core needs:

- `qti-math-constant` (pi) and `qti-math-operator` (sin), in template processing
- `qti-round-to`, in template processing
- `qti-equal-rounded`, in response processing

and cutie-client needs `qti-end-attempt-interaction`, which the item uses for
its hint and solution requests (`HINTREQUEST`, `SOLREQUEST`). With those, it
belongs with the spec examples in the example app, next to `template_image.xml`.

Related: attributes like `min` and `max` on `qti-random-integer` can't take
variable references, which the spec allows. In QTI 3 these are bare
identifiers, not the `{VAR}` syntax of QTI 2.x.

## 12. Correct responses set during template processing are stored in state

**File:** `packages/cutie-core/src/lib/initializeState.ts` (`executeSetCorrectResponse`)

**Not a spec violation, but a security consideration.** `qti-set-correct-response`
stores its value in `state.correctResponses` (kept apart from the item's
variables). The template sent to the client is sanitized properly, but anyone
with the `AttemptState` can read the correct answer. Hosts must never send the
state to the client.

## 13. Record-cardinality correct responses are not supported

**Files:** `packages/cutie-core/src/lib/responseDeclarations.ts` (`getCorrectResponse`),
`packages/cutie-core/src/utils/valueContainer.ts` (`createValueContainer`)

**Spec:** A response declaration may have record cardinality, with a
`qti-correct-response` of `qti-field-value` entries. Template processing may set
one with `qti-set-correct-response` and a `qti-record` expression.

**Cutie:** `getCorrectResponse` reads single, multiple and ordered correct
responses only, so a record correct response (authored or set by template
processing) is never read. A record set by template processing is also written
into the attempt's declaration as a single `qti-value` (`[object Object]`),
since `createValueContainer` doesn't write `qti-field-value` entries.

**When this matters:** Record responses come from custom interactions and PCIs,
which cutie doesn't support, so no supported interaction produces one today.

**Suggested fix:** Read and write `qti-field-value` entries (with each field's
base type) for record cardinality in both places.

## 14. `qti-index` and `qti-repeat` ignore a variable `n` / `number-repeats`

**Status:** Fixed. Both attributes can be an integer or a variable identifier,
resolved by `resolveIntOrIdentifier` (`lib/expressionEvaluator/base.ts`).
`qti-index` also returns NULL for a NULL container, and `qti-repeat` returns
NULL for fewer than 1 repeat.

**Still open:** `qti-repeat` should accept several sub-expressions, add the
values of ordered ones individually, and ignore NULL ones. It currently takes
exactly one and adds its value as is.

## 15. `qti-exit-response` crashes submission

**File:** `packages/cutie-core/src/lib/responseProcessing.ts:232`

**Spec:** QTI 3 Information Model, ResponseRuleGroup §6.39.5: "The exit
response rule terminates response processing immediately (for this
invocation)." It ends processing; it isn't an error.

**Cutie:** It throws `ExitResponseError`, and nothing in cutie-core catches
it, so `submitResponse` fails with "Exit response". Template processing handles
the matching rule correctly: `qti-exit-template` throws `ExitTemplateError`,
which `initializeState.ts:217` catches.

**Suggested fix:** Catch `ExitResponseError` where response processing runs
its rules, the same way template processing catches `ExitTemplateError`.

## 16. Gap match treats `match-group` as shared group names

**Files:** `packages/cutie-client/src/transformer/handlers/gapMatchInteraction/controller.ts`
(`matchGroupsAllow`), `gapHandler.ts` (reads a gap's `match-group`)

**Spec:** QTI 3 Information Model, GapText §5.58.4 and Gap §5.55.4:
`match-group` is an `IdentifierList`, "a list of the identifiers for the
objects that can be matched with" this gap text or gap. A gap text lists the
gaps it may fill, and a gap lists the gap texts it accepts. Either side can
restrict the pairing on its own; a side with no `match-group` adds no
restriction.

**Cutie:** `matchGroupsAllow` treats each `match-group` as a set of shared
group names. A gap text and a gap may pair only if their lists have a name in
common, and a pairing is refused when only one of them has a `match-group`.
So spec-conforming content breaks. Per the spec, a gap text with
`match-group="G1"` may go only in gap `G1`; cutie refuses it there unless gap
`G1` happens to have a `match-group` of its own that contains the word `G1`.
And content written for cutie, such as `match-group="actions"` on both the gap
texts and the gaps (as in the old gap-match bowtie example), isn't conforming
QTI.

`qti-match-interaction` already reads `match-group` as identifiers (see
`MatchController.groupsAllow` in `matchInteraction/controller.ts`, from PR #25).

**Suggested fix:** Check each side separately, as match does: when the gap
text has a `match-group`, it must include the gap's identifier; when the gap
has one, it must include the gap text's identifier. Anything authored with
shared group names needs converting to identifier lists.
