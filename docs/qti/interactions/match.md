<!-- spell-checker: ignore tabular -->
# qti-match-interaction

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.be4ll1tm4t99
- vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab#match-interaction
- conf: https://www.imsglobal.org/spec/qti/v3p0/conf

Note: match is entirely **advanced** cert (Q13 is Level 2).

## match interaction attributes

| attribute | cert | cutie | notes |
|---|---|---|---|
| response-identifier | advanced | :white_check_mark: | |
| shuffle | advanced | :white_check_mark: | per match-set, server-side |
| max-associations | advanced | :warning: | a missing max-associations is treated as 0 (no limit); the spec's default is 1 (see docs/outstanding-client-issues.md) |
| min-associations | advanced | :white_check_mark: | client-side constraint messages |

## simple-associable-choice attributes (qti-simple-associable-choice)

| attribute | cert | cutie | notes |
|---|---|---|---|
| identifier | advanced | :white_check_mark: | |
| match-max | advanced | :white_check_mark: | limits associations per choice |
| fixed | advanced | :white_check_mark: | respected during shuffle |
| match-min | not in checklist | :white_check_mark: | client-side validity and constraint text; pre-allocates a target column's slots |
| match-group | not in checklist | :white_check_mark: | restricts pairing; when every source names exactly one target and every target is named, each target column gets its own bank (bowtie) |
| template-identifier | not in checklist | :white_check_mark: | processed in processTemplateConditionals |
| show-hide | not in checklist | :white_check_mark: | processed in processTemplateConditionals |

## vocabulary classes

### choices positioning — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-choices-top | :white_check_mark: | bank(s) above the target columns (cutie's default; the spec names none) |
| qti-choices-bottom | :white_check_mark: | bank(s) below the target columns |
| qti-choices-left | :white_check_mark: | bank(s) left of the target columns |
| qti-choices-right | :white_check_mark: | bank(s) right of the target columns |

The bank always precedes its slots in the DOM, whatever the visual placement: the vocab asks for choices to be presented before targets to assistive technology.

### cutie presentation

Sources sit in word banks; each target is a column: a header over slots that sources are dragged or placed into (source → target only). Every source shares one bank, unless the sources' match-groups partition them by target, in which case each column gets its own bank (a bowtie). A column pre-allocates one slot per unit of its match-min and grows one empty slot at a time while its capacity allows (the smallest of its match-max, the sources allowed to pair with it, and max-associations). A source with room left under its match-max stays in its bank after it is placed.

### tabular layout — advanced cert

| class/attribute | cutie | notes |
|---|---|---|
| qti-match-tabular | :white_check_mark: | a table: first match set as row headers, second as column headers, an input per cell (see below) |
| qti-header-hidden | :white_check_mark: | column headers hidden visually; they still name each cell's input |
| data-first-column-header | :white_check_mark: | text of the top-left header cell |

In the table, a row whose source has a match-max of 1 is a radio group (choosing a cell replaces the row's pair); any other row is checkboxes. A cell the association rules exclude (match-group, a full row or column, max-associations) stays focusable but is `aria-disabled`, described by the reason, and refuses clicks; while the interaction isn't enabled, every input is natively disabled. A table wider than the item scrolls, and while it overflows its scroll container is a named region in the tab order. An evaluation puts the standard "Correct answer" / "Incorrect answer" overline above each marked cell's input, with every cell reserving the overline's room so the inputs stay level.

### orientation — in vocab, not in cert checklist

| class | cutie | notes |
|---|---|---|
| qti-orientation-horizontal | :x: | |
| qti-orientation-vertical | :x: | |
| qti-input-control-hidden | :x: | |

### data attributes — advanced cert

| attribute | cutie | notes |
|---|---|---|
| data-max-selections-message | :x: | constraint messages are hardcoded, not data-driven |
| data-min-selections-message | :x: | |
