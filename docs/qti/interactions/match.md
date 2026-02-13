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
| match-group | not in checklist | :x: | restricts which choices can pair |
| template-identifier | not in checklist | :white_check_mark: | processed in processTemplateConditionals |
| show-hide | not in checklist | :white_check_mark: | processed in processTemplateConditionals |

## vocabulary classes

### choices positioning — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-choices-top | :x: | uses custom cutie layout classes instead |
| qti-choices-bottom | :x: | |
| qti-choices-left | :x: | |
| qti-choices-right | :x: | |

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
