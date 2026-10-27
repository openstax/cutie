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
| max-associations | advanced | :white_check_mark: | |
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
| qti-match-tabular | :x: | render as table/grid |
| qti-header-hidden | :x: | hide table header row |
| data-first-column-header | :x: | first column is a header |

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
