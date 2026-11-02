<!-- spell-checker: ignore NCSBN Wayback -->
# NCLEX samples: remaining work

The [Assignable NCLEX Epic & PRD](https://docs.google.com/document/d/1iqb1fXxcNIFB-OOv2WqlhhGo_7yxg2Rw4eez7AQEfzc/edit)
lists 14 question types. `packages/cutie-samples/src/nclex/` has canonical samples for 12 of them:

- Multiple Response: Select All That Apply
- Multiple Response: Select N
- Multiple Response: Grouping
- Matrix Multiple-Choice
- Drop-Down: Cloze
- Drop-Down: Rationale (dyad and triad)
- Drop-Down: Table
- Drag-and-Drop: Cloze
- Drag-and-Drop: Rationale (dyad only)
- Text Highlight: Passage
- Text Highlight: Table
- Bowtie

This document covers the samples that still need to be made.

A sample is only added when its type can be represented correctly. That means its response
processing passes the editor classifier (not `custom`), the client renders its interactions,
and it matches the PRD's format and scoring rule. An approximation is worse than no sample.

## Scoring rules referenced below

- **+/-**: +1 for each correct selection, -1 for each incorrect selection, minimum 0.
- **0/1**: +1 for each correct selection, blank, or pair, nothing for incorrect ones.
- **Rationale**: dyad (1 cause, 1 effect) is worth 1 point and both must be correct. Triad
  (1 cause, 2 effects) is worth 2 points, earns nothing unless the cause is correct, and earns
  1 point for each correct effect.

## Samples not made

### Drag-and-Drop: Rationale (triad)

**Requirements:** the same triad scoring as the drop-down version, with options dragged into a
cause gap and two effect gaps. The two effects can go in either order.

**Why not made:** the triad scoring itself is solved: the drop-down triad sample scores it as a
sum of mapped responses with a score offset of -2, floored at 0, which the editor recognizes as
partial credit (see `rationaleTriadScoring` in `packages/cutie-samples/src/nclex/conventions.ts`).
What's left is the drag-and-drop form: the two effects can go in either order, so a single
`qti-correct-response` can't describe every correct answer.

**Needed:** a gap match with one `directedPair` response, mapped so the correct cause in the
cause gap earns 2 and each correct effect earns 1 in either effect gap, with the same offset and
floor as the drop-down triad. Each effect option must be usable only once (`match-max="1"`), or
the same effect placed in both gaps would earn both points. cutie-core doesn't infer a maximum
score for gap match yet, so the sample needs the Maximum Score set to 2, which adds a `qti-min`
cap to the response processing. The interaction is gap match, as in
the dyad sample. The PRD's draft mentions `order`, but the client has no order interaction and
the in-progress work (CORE-2689, branch `core-2689`, not yet merged) uses gap match. That branch
also changes gap match rendering (a word bank per group) and is built on the earlier bowtie
work, so it will likely need a rebase now that the bowtie match work (CORE-2917) is merged.

### Matrix Multiple-Response

**Requirements:** a grid with a row for each finding and a column for each category (such as
the conditions a finding may support). Any number of selections per row, including none, and
at least one selection in each column. Scored +/- **per column**: each column is scored like a
select all that apply item and floored at 0 on its own, then the columns are added.

The per-column floor is NCSBN's rule. From *Next Generation NCLEX News*, Summer 2021, "NGN:
Scoring Models" (`https://www.ncsbn.org/public-files/NGN_Summer21_ENG.pdf`, now only on the
Wayback Machine):

> The +/– scoring rule is applied to each column of the Matrix MR and each row grouping of the
> MR Grouping item types individually. Scores are summed across columns (Matrix MR) or rows (MR
> Grouping) to generate the total score for the item. All negative column or row scores are
> rounded to 0 as each column or row is scored independently and therefore does not negatively
> impact surrounding rows or columns.

Its worked example has three columns scoring 0, -2 (rounded to 0), and +1, for a total of 1.
Flooring the whole item instead would give 0. The University of Maryland NGN faculty slides
(slide 37), NURSING.com, and ExamSoft's support article also floor per column. No source we
found floors the whole item; sources that only say "minimum 0" don't say at what level. The
PRD's description ("minimum score = zero") is the same wording as select all that apply and
doesn't settle it either. No NCSBN document after 2021 restates the rule, but nothing suggests
it changed.

**Why not made:** the client renders it (`qti-match-tabular`, with checkbox rows when a row
choice's `match-max` isn't 1, and `match-min="1"` on each column choice for the one-per-column
rule), but the scoring can't be represented yet. A matrix is one match interaction with one
`directedPair` response, so a single `qti-mapping` with `default-value="-1"` and
`lower-bound="0"` floors the whole item, not each column. Multiple Response: Grouping gets its
per-group floor from a separate response per group, which a single grid can't have. Clamping
each column in response processing would make it `custom` to the editor classifier.

**Needed:** a standard scoring pattern for a sum of per-group floored mapped scores within one
response, supported by cutie-core and recognized by the editor classifier, so the per-column
scores can be authored and edited. No Jira ticket yet.

### Trend

**Requirements:** case information over several time points (nurses' notes, vital signs, lab
results) shown in tabs, with the question built from one of the other types, usually
drop-downs or multiple response. Scoring follows the type used.

**Why not made:** the client has no tabbed presentation of case information. CORE-2690 covers
this, but there's no branch for it yet. The PRD's draft suggests custom JS and CSS that falls back to stacked headings in
other systems.

**Needed:** decide how tabbed case information is represented within strict QTI v3 before
building it, then implement the client support. The same tabbed layout is needed for bowtie and
the NCLEX two-panel layout generally.
