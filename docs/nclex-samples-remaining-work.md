# NCLEX samples: remaining work

The [Assignable NCLEX Epic & PRD](https://docs.google.com/document/d/1iqb1fXxcNIFB-OOv2WqlhhGo_7yxg2Rw4eez7AQEfzc/edit)
lists 14 question types. `packages/cutie-samples/src/nclex/` has canonical samples for 9 of them:

- Multiple Response: Select All That Apply
- Multiple Response: Select N
- Drop-Down: Cloze
- Drop-Down: Rationale (dyad only)
- Drop-Down: Table
- Drag-and-Drop: Cloze
- Drag-and-Drop: Rationale (dyad only)
- Text Highlight: Passage
- Text Highlight: Table

This document covers the client bug found while writing them and the samples that still need
to be made.

A sample is only added when its type can be represented correctly. That means its response
processing passes the editor classifier (not `custom`), the client renders its interactions,
and it matches the PRD's format and scoring rule. An approximation is worse than no sample.

## Scoring rules referenced below

- **+/-**: +1 for each correct selection, -1 for each incorrect selection, minimum 0.
- **0/1**: +1 for each correct selection, blank, or pair, nothing for incorrect ones.
- **Rationale**: dyad (1 cause, 1 effect) is worth 1 point and both must be correct. Triad
  (1 cause, 2 effects) is worth 2 points, earns nothing unless the cause is correct, and earns
  1 point for each correct effect.

## 1. Bug: drop-downs in table cells are labelled "blank"

**Issue:** an inline choice (or text entry) interaction that is the only content of a table
cell gets the accessible name "blank" instead of a name from its row and column headers.

**Where:** `packages/cutie-client/src/transformer/handlers/inlineInteractionAnnotator.ts`.
`annotateInlineInteractions` treats `td` and `th` as block containers and builds labels only
from text in the same container. A cell with no text besides the interaction falls through to
the fallback, which sets `aria-label="blank"` (or `"blank N of M"`). An `aria-label` overrides
the name a screen reader would otherwise build, so the table headers the item provides are lost
for that control.

**Affects:** the Drop-Down: Table sample (`nclex-drop-down-table`), which uses a `caption`,
`th scope="col"` headers, and a `th scope="row"` per row, all valid QTI v3 / HTML.

**Fix needed:** when an interaction sits in a table cell with no labelling text of its own,
label it from the cell's row header (`th scope="row"`) and, where useful, its column header,
instead of the "blank" fallback. Add a client spec and a test flow under `docs/test-flows/`.

This fix is also a prerequisite for the Grouping sample below.

## 2. Samples not made

### Multiple Response: Grouping

**Requirements:** a table where each row is a category (such as a body system) and holds a
select-all-that-apply group of 2 to 4 options. Each row is its own `qti-choice-interaction`
with a `multiple` response. Scored +/- per group (minimum 0 per group), summed.

**Why not made:** the NCLEX format is a table. A choice interaction in a table cell renders,
but has no accessible name unless it has a `qti-prompt`, and a prompt repeats the row header.
A version with stacked groups and prompts was written and removed, because it isn't the NCLEX
format.

**Needed:** client labelling of choice interactions from their table row header (related to
bug 1). Scoring already works (summed `qti-map-response`, classified as `sumScores`).

### Bowtie

**Requirements:** the NCLEX bowtie layout: a center condition, two actions on one side, and two
parameters to monitor on the other, each column filled from its own list of options. Scored
0/1 (+1 for each correct placement). Case information is usually shown in tabs.

**Why not made:** the item structure is changing. On `main`, bowtie renders as a gap match with
`match-group` banks (example: "Gap Match - Bowtie Layout"). CORE-2917 (branch `bowtie-match`)
is converting it to a plain match interaction. A canonical sample written now would be outdated
when that lands.

**Needed:** finish CORE-2917, then write the sample on the match structure with a `qti-mapping`
(+1 per correct pair, `lower-bound="0"`) so scoring is 0/1 and not all-or-nothing.

### Drop-Down: Rationale (triad)

**Requirements:** one sentence with a cause drop-down and two effect drop-downs. Scored with the
triad rule: 2 points, nothing unless the cause is correct, then 1 point per correct effect.

**Why not made:** the "cause must be correct" gate can't be expressed with the editor's
recognized patterns. The existing example ("Inline Choice - Rationale (Triad)" in
`cutie-example`) classifies as `custom`.

**Needed:** a new response processing mode in the editor classifier and generator
(`packages/cutie-editor/src/utils/responseProcessingClassifier.ts` and
`responseProcessingGenerator.ts`) that recognizes a gated sum. Design it once for both triad
types.

### Drag-and-Drop: Rationale (triad)

**Requirements:** the same triad scoring as the drop-down version, with options dragged into a
cause gap and two effect gaps. The two effects can go in either order.

**Why not made:** same scoring blocker as the drop-down triad. The interchangeable effects also
mean a single `qti-correct-response` can't describe every correct answer.

**Needed:** the gated scoring mode above, designed so the two effect gaps are scored without
depending on their order. The interaction is gap match, as in the dyad sample. The PRD's draft
mentions `order`, but the client has no order interaction and the in-progress work (CORE-2689,
branch `core-2689`) uses gap match.

### Matrix Multiple-Choice

**Requirements:** a grid with a row for each finding and a column for each option (such as
"Indicated" / "Not indicated"). Exactly one selection per row. Scored 0/1 per row.

**Why not made:** the client's match interaction only renders as connect-the-items (click or
drag a source onto a target). It has no grid layout with one radio button per cell.

**Needed:** a grid rendering mode for `qti-match-interaction` in
`packages/cutie-client/src/transformer/handlers/matchInteraction/`, with `match-max="1"` on each
row choice for radio-button behavior. Check the QTI v3 shared vocabulary for a class that
selects this layout (possibly `qti-match-tabular`) before adding anything. Scoring already
works (`qti-mapping` with +1 per correct pair, classified as `sumScores`). There's no Jira
ticket for this yet.

### Matrix Multiple-Response

**Requirements:** the same grid as Matrix Multiple-Choice, but any number of selections per row
(checkbox behavior). Scored +/- (mapping with `default-value="-1"`, `lower-bound="0"`).

**Why not made:** same as Matrix Multiple-Choice: no grid rendering for match.

**Needed:** the same grid mode, with checkbox behavior when a row choice's `match-max` is not 1.
No Jira ticket yet.

### Trend

**Requirements:** case information over several time points (nurses' notes, vital signs, lab
results) shown in tabs, with the question built from one of the other types, usually
drop-downs or multiple response. Scoring follows the type used.

**Why not made:** the client has no tabbed presentation of case information. CORE-2690 is in
progress. The PRD's draft suggests custom JS and CSS that falls back to stacked headings in
other systems.

**Needed:** decide how tabbed case information is represented within strict QTI v3 before
building it, then implement the client support. The same tabbed layout is needed for bowtie and
the NCLEX two-panel layout generally.
