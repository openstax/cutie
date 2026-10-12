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
| match-min | not in checklist | :x: | |
| match-group | not in checklist | :white_check_mark: | restricts pairing; when every source names exactly one target and every target's match-max can be filled, renders the grouped (bowtie) layout |
| template-identifier | not in checklist | :white_check_mark: | processed in processTemplateConditionals |
| show-hide | not in checklist | :white_check_mark: | processed in processTemplateConditionals |

## vocabulary classes

### choices positioning — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-choices-top | :white_check_mark: | grouped (bowtie) layout: positions each column's bank above its slot |
| qti-choices-bottom | :white_check_mark: | grouped (bowtie) layout: bank below its slot (default) |
| qti-choices-left | :white_check_mark: | grouped (bowtie) layout: bank left of its slot |
| qti-choices-right | :white_check_mark: | grouped (bowtie) layout: bank right of its slot |

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
