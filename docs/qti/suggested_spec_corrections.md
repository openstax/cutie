<!-- spell-checker: ignore gcd inlines unprefixed -->
# Suggested QTI Spec Corrections

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl

Places where cutie-core's template/response processing diverges from the
QTI 3.0 spec. Ordered roughly by how likely they are to change the behavior
of a real item. Line references are as of cutie-core 1.0.2.

---

## 1. Template-driven visibility matches the wrong attribute

**File:** `packages/cutie-core/src/lib/renderTemplate.ts:165` (`processTemplateConditionals`)

**Spec:** On `qti-template-block`, `qti-template-inline`, and templated
choices (`qti-simple-choice`, `qti-inline-choice`, `qti-gap-text`, etc.),
`template-identifier` is the **name of a template variable**. For blocks and
inlines, the element's `identifier` is the value compared against that
variable. For choices, the choice's own `identifier` is compared. Visibility
depends on whether the variable matches (single) or contains (multiple) that
value.

**Cutie:** Treats `template-identifier` as the **value**, and shows or hides
the element if *any* variable in state holds it. It ignores the element's
`identifier`, and doesn't limit the check to template variables. The existing
tests in `renderTemplate.spec.ts` encode this behavior.

**Suggested fix:** Look up `variables[templateIdentifier]`. Compare it with the
element's `identifier` using match for single cardinality or contains for
multiple. Update the tests.

## 2. Outcome variables are not reset between submissions

**File:** `packages/cutie-core/src/lib/responseProcessing.ts:157`

**Spec:** For **non-adaptive** items (`adaptive="false"`), outcome variables
are reset to their defaults before each response processing run. Adaptive
items (`adaptive="true"`) keep their outcomes across submissions. That's how
adaptive items such as the spec's Monty Hall example track their state from
one turn to the next.

**Cutie:** Always starts from `{ ...currentState.variables }`, so outcomes
carry over between submissions for every item. This behavior was built around
adaptive items, which are the only items cutie currently lets a learner submit
more than once. A non-adaptive item is finished after its first submission,
so its outcomes are never reused.

**When this matters:** Only when an item accepts another submission instead of
finishing. That means an item that puts itself in a non-terminal state after
the first submission (for example, by setting `completionStatus` to
`incomplete`) without being adaptive. In that case, outcomes that should be
worked out again from scratch, such as `FEEDBACK`, would build up from earlier
submissions.

**Suggested fix:** When `adaptive` isn't `true`, re-apply outcome defaults
(reusing `initializeOutcomeVariables`) before running the rules. Adaptive
items must keep the current behavior.

## 3. Missing default values and built-in variables

**File:** `packages/cutie-core/src/lib/initializeState.ts:87`

**Spec:**
- Template variables start at their `qti-default-value` before template
  processing runs.
- Response variables start at their `qti-default-value`, or NULL if none.
- The built-in response variables `numAttempts` and `duration` exist.
  `numAttempts` goes up by one on each submission.
- The built-in outcome `completionStatus` starts as `not_attempted`.

**Cutie:** Only outcome defaults are loaded. Template and response defaults
are ignored. `numAttempts` and `duration` aren't maintained, so rules that read
them get NULL. `completionStatus` exists only on `AttemptState`, not as a
variable, until response processing sets it.

**Suggested fix:** Load template and response defaults in `initializeState`,
seed `completionStatus`, and increment `numAttempts` in `processResponse`.

## 4. NULL propagation: operators throw instead of returning NULL

**Files:** `packages/cutie-core/src/lib/expressionEvaluator/*.ts`

**Spec:** Most operators return NULL when any sub-expression is NULL (for
example `qti-sum`, `qti-lt`, `qti-gt`, `qti-and`, `qti-or`, `qti-not`,
`qti-match`, `qti-equal`). A condition that evaluates to NULL counts as false
in `qti-response-if` and `qti-template-if`.

**Cutie:** Type checks throw on non-number or non-boolean values, including
NULL. So an unanswered response inside `qti-sum` or `qti-lt` breaks processing
completely. `qti-match` with a NULL operand returns `false`, not NULL. The
`if` / `else-if` evaluators also throw on non-boolean conditions instead of
treating NULL as false.

**Suggested fix:** Return NULL from operators when any operand is NULL.
Treat NULL conditions as false in the condition evaluators.

### 4a. `qti-multiple` / `qti-ordered` keep NULL values

**File:** `packages/cutie-core/src/lib/expressionEvaluator/containers.ts` (`evaluateMultiple`, which `evaluateOrdered` also uses)

**Spec:** Sub-expressions that are NULL are left out of the container. If
there are no sub-expressions, or they're all NULL, the result is NULL.

**Cutie:** NULL sub-expressions are added to the container as `null`, and an
empty container comes back as `[]` instead of NULL.

**Example:** The common "append to feedback" pattern
`FEEDBACK = multiple(FEEDBACK, INCORRECT)`, with `FEEDBACK` starting out NULL,
gives `[null, 'INCORRECT']` instead of `['INCORRECT']`. Feedback visibility
still works because it only checks what the container includes. But
`qti-container-size`, `qti-match` against a literal container, and
`qti-is-null` all give the wrong answer.

**Suggested fix:** Leave out NULL values in `evaluateMultiple`, and return NULL
when the result is empty.

## 5. `qti-equal` ignores `tolerance-mode`

**File:** `packages/cutie-core/src/lib/expressionEvaluator/comparison.ts:175`

**Spec:** `tolerance-mode` accepts `exact`, `absolute`, or `relative`, using
the `tolerance`, `include-lower-bound`, and `include-upper-bound` attributes.

**Cutie:** Always compares exactly (there's a TODO in the code).

**Suggested fix:** Implement absolute and relative tolerance.

## 6. `qti-printed-variable` ignores formatting attributes

**File:** `packages/cutie-core/src/lib/renderTemplate.ts:84`

**Spec:** Supports `format` (printf-style), `base`, `index`, `power-form`,
`field`, and `delimiter`. Container values are printed using the delimiter
(default `;`).

**Cutie:** Prints `String(value)`, so arrays come out comma-joined and no
formatting is applied.

**Suggested fix:** Implement at least `format`, `index`, and `delimiter`.

## 7. MathML variable substitution is too broad and misses unprefixed MathML

**File:** `packages/cutie-core/src/lib/renderTemplate.ts:260`

**Spec:** Only template variables declared with `math-variable="true"` are
substituted into `mi` / `mn` elements.

**Cutie:**
- Substitutes **any** variable whose name matches the element's text,
  including outcome and response variables. Since outcomes are otherwise
  hidden from the client, this could leak values.
- Only finds elements with the `m:` prefix. MathML that uses a default
  namespace (`<math xmlns="...">` with bare `<mi>`) is skipped.

**Suggested fix:** Limit substitution to template declarations with
`math-variable="true"`. Match MathML elements by namespace instead of by
prefix.

## 8. `pair` / `directedPair` / `point` values are stored differently in different places

**File:** `packages/cutie-core/src/utils/typeParser.ts:23`, `:65`

**Spec:** A pair is an unordered pair of identifiers. A directedPair is
ordered. A point is two integers. How a value is stored shouldn't depend on
where it came from.

**Cutie:** `parseValue`, used for `qti-base-value` and template or outcome
defaults, returns arrays. `parseResponseValue`, used for correct responses and
submissions, keeps strings. Comparing a `qti-base-value` pair with a response
in `qti-match` or `qti-member` can therefore fail. Pairs are also compared by
order, so `"A B"` doesn't equal `"B A"`.

**Suggested fix:** Store each base-type one way everywhere, and compare
`pair` values without regard to order.

## 9. `map_response` / `qti-map-response` details

**File:** `packages/cutie-core/src/lib/responseProcessing.ts:258`, `:386`, `:414`

**Spec:**
- For multiple cardinality, each distinct value is mapped once. Duplicates
  aren't counted twice.
- Keys for `pair` responses should match without regard to order.
- `case-sensitive` on `qti-map-entry`: *needs verification*. The QTI 3
  default may be `true`, and cutie treats it as `false`.

**Cutie:** Adds up every array element, duplicates included. Compares keys as
raw strings. Matches case-insensitively unless `case-sensitive="true"`.

**Suggested fix:** Remove duplicates before mapping. Normalize pair keys.
Check the case-sensitivity default against the spec and XSD.

## 10. Template variables are deleted when constraint retries run out

**File:** `packages/cutie-core/src/lib/initializeState.ts:29`

**Spec:** If `qti-template-constraint` still fails after the maximum number of
retries (the spec suggests 100), processing continues with the **last
generated values**.

**Cutie:** Loops up to 1000 times. Each failure clears the template
variables, so if every attempt fails they're left deleted and the item
renders with nothing filled in.

**Suggested fix:** On the last attempt, keep the values instead of resetting
them. Consider lowering the cap to match the spec's guidance.

## 11. Unimplemented operators

**File:** `packages/cutie-core/src/lib/expressionEvaluator/index.ts:174`

Any unrecognized expression throws `Unsupported expression type`. Notable
gaps include `qti-lookup-outcome-value`, `qti-default`, `qti-inside`,
`qti-min`, `qti-max`, `qti-gcd`, `qti-lcm`, `qti-math-operator`,
`qti-math-constant`, `qti-equal-rounded`, `qti-stats-operator`,
`qti-duration-lt`, `qti-duration-gte`, and `qti-custom-operator`. The
response processing rule `qti-response-processing-fragment` isn't supported,
and response processing silently skips any other rule it doesn't recognize.

Related: attributes like `min` and `max` on `qti-random-integer` can't take
template variable references (`{VAR}`), which the spec allows.

## 12. Correct responses set during template processing are stored in state

**File:** `packages/cutie-core/src/lib/initializeState.ts:310`

**Not a spec violation, but a security consideration.** `qti-set-correct-response`
stores its value as `state.variables.__correct_<ID>`. The template sent to the
client is sanitized properly, but anyone with the `AttemptState` can read the
correct answer. Hosts must never send the state to the client, or this value
should be kept somewhere else.
