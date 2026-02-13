<!-- spell-checker: ignore basetype -->
# QTI 3.0 Delivery Certification — Non-Interaction Features

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl
- conf: https://www.imsglobal.org/spec/qti/v3p0/conf

This document covers certification requirements **outside** of the individual
interaction types. Interaction-specific coverage is tracked in interaction docs.

## Interactions

| interaction | ID | cert | cutie | doc |
|---|---|---|---|---|
| choice | Q2 | basic | :white_check_mark: | [interactions/choice.md](interactions/choice.md) |
| extended text | Q5 | basic | :white_check_mark: | [interactions/extended-text.md](interactions/extended-text.md) |
| text entry | Q20 | basic | :white_check_mark: | [interactions/text-entry.md](interactions/text-entry.md) |
| gap match | Q6 | advanced | :white_check_mark: | [interactions/gap-match.md](interactions/gap-match.md) |
| graphic gap match | Q8 | advanced | :x: | |
| hotspot | Q10 | advanced | :x: | |
| hot text | Q11 | advanced | :x: | |
| inline choice | Q12 | advanced | :white_check_mark: | [interactions/inline-choice.md](interactions/inline-choice.md) |
| match | Q13 | advanced | :white_check_mark: | [interactions/match.md](interactions/match.md) |
| associate | Q1 | elective | :x: | |
| drawing | Q3 | elective | :x: | |
| end attempt | Q4 | elective | :x: | |
| graphic associate | Q7 | elective | :x: | |
| graphic order | Q9 | elective | :x: | |
| media | Q14 | elective | :x: | |
| order | Q15 | elective | :x: | |
| portable custom (PCI) | Q16 | elective | :x: | |
| position object | Q17 | elective | :x: | |
| select point | Q18 | elective | :x: | |
| slider | Q19 | elective | :x: | |
| upload | Q21 | elective | :x: | |
| custom (proprietary) | Q31 | elective | :x: | |
| custom (LTI) | Q32 | elective | :x: | |

Note: cutie is an **item-level** renderer and processor. Test-level delivery
features (test parts, sections, navigation, time limits) are out of scope.

---

## Item features — basic cert

| feature | ID | cutie | notes |
|---|---|---|---|
| assessment item root | I0 | :white_check_mark: | `qti-assessment-item` attributes parsed |
| response declaration | I1 | :white_check_mark: | all cardinalities and base-types |
| outcome declaration | I2 | :white_check_mark: | default values, multiple/single/ordered |
| item body | I7 | :white_check_mark: | recursive transform of block + inline content |
| HTML5 subset | I8 | :white_check_mark: | passthrough handler preserves standard HTML |
| response processing — fixed templates | I9b | :white_check_mark: | `match_correct`, `map_response`, `map_response_point` |
| alt text for graphics | A1 | :white_check_mark: | `alt` attributes pass through on `<img>` |

## Item features — advanced cert

| feature | ID | cutie | notes |
|---|---|---|---|
| response processing — full | I9a | :white_check_mark: | conditions, expressions, custom rules |
| composite items | I17 | :white_check_mark: | multiple interactions per item body |
| MathML v2/v3 | I18 | :white_check_mark: | pass-through + template variable substitution in `<m:mi>`/`<m:mn>` |
| rubric block (HTML) | I11 | :white_check_mark: | server strips non-candidate views; candidate rubrics rendered |
| shared stimulus | I4 | :x: | `qti-assessment-stimulus-ref` not implemented |
| ARIA subset | A2a | :white_check_mark: | aria attributes pass through in HTML |
| captions (`<track>`) | A13b | :x: | video/audio elements pass through but no caption UI |
| glossary on-screen | A15 | :x: | requires catalog resource support |
| magnification | A30a | :white_check_mark: | UI supports browser zoom and font-size changes; doesn't provide controls |
| text appearance (color) | A42a | :x: | delivery system concern; no color-change UI |

## Item features — elective (not required for any cert level)

| feature | ID | cutie | notes |
|---|---|---|---|
| template declaration | I3 | :white_check_mark: | all cardinalities/base-types, constraint retries |
| template processing | I5 | :white_check_mark: | conditions, expressions, randomization |
| modal feedback | I10 | :white_check_mark: | native `<dialog>`, decorative icons |
| feedback block/inline | — | :white_check_mark: | show-hide visibility server-side |
| printed variable | — | :white_check_mark: | `qti-printed-variable` substitution |
| stylesheet | I6 | :x: | `qti-stylesheet` element ignored |
| include (xi:include) | I12 | :x: | not implemented |
| companion materials | I13 | :x: | `qti-companion-materials-info` not implemented |
| catalog resources | I14 | :x: | `qti-catalog-info` not implemented; blocks glossary/a11y catalog features |
| context declarations | I15 | :x: | `qti-context-declaration` not implemented |
| item time limits | I16 | :x: | `qti-time-limits` not implemented |
| adaptive items | — | :white_check_mark: | `adaptive="true"` with multi-turn response processing |

---

## Elevated accessibility (separate cert track)

These require PNP (Personal Needs and Preferences) profile support,
which cutie does not currently implement.

| feature | ID | cutie | notes |
|---|---|---|---|
| ARIA (full) | A2b | :x: | subset passes through; full set untested |
| long description | A29 | :x: | requires catalog support |
| sign language | A36 | :x: | requires catalog + video |
| tactile | A41 | :x: | requires catalog + tactile tour |
| audio description | A9 | :x: | requires catalog + alt video track |
| captions (PNP toggle) | A13 | :x: | requires PNP |
| glossary (PNP) | A15 | :x: | requires PNP + catalog |
| transcript | A44 | :x: | requires catalog |
| additional testing time | A6 | :x: | delivery system + PNP |
| answer masking | A8 | :x: | delivery system + PNP |
| breaks | A11 | :x: | delivery system + PNP |
| magnification (zoom) | A30a | :white_check_mark: | UI supports zoom; PNP-driven controls are delivery system concern |
| screen reader | A40a | :x: | delivery system + PNP |
| text-to-speech | A40b | :x: | delivery system + PNP |
| text/background color | A42a | :x: | delivery system + PNP |
