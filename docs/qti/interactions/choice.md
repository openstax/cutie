<!-- spell-checker: ignore parenthesis -->
# qti-choice-interaction

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.j9nu1oa1tu3b
- vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab#choice-interaction
- conf: https://www.imsglobal.org/spec/qti/v3p0/conf

## choice interaction attributes

| attribute | cert | cutie | notes |
|---|---|---|---|
| response-identifier | basic | :white_check_mark: | |
| max-choices | basic | :white_check_mark: | 1=radio, 0/unset=unlimited checkboxes |
| min-choices | advanced | :white_check_mark: | |
| shuffle | none | :white_check_mark: | server-side in cutie-core |
| orientation | advanced (via vocab) | :white_check_mark: | `orientation` attr handled; vocab classes are advanced |

## simple choice attributes

| attribute | cert | cutie | notes |
|---|---|---|---|
| identifier | basic | :white_check_mark: | |
| fixed | none | :white_check_mark: | respected during shuffle |
| show-hide | none | :white_check_mark: | processed in processTemplateConditionals |
| template-identifier | none | :white_check_mark: | processed in processTemplateConditionals |

## vocabulary classes

### labels — basic cert

| class | cutie | notes |
|---|---|---|
| qti-labels-none | :white_check_mark: | no-op; default has no labels |
| qti-labels-decimal | :white_check_mark: | CSS counter with `decimal` style |
| qti-labels-lower-alpha | :white_check_mark: | CSS counter with `lower-alpha` style |
| qti-labels-upper-alpha | :white_check_mark: | CSS counter with `upper-alpha` style |

### label suffixes — basic cert

| class | cutie | notes |
|---|---|---|
| qti-labels-suffix-none | :white_check_mark: | no-op; default has no suffix |
| qti-labels-suffix-period | :white_check_mark: | appends `.` via CSS `content` |
| qti-labels-suffix-parenthesis | :white_check_mark: | appends `)` via CSS `content` |

### orientation — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-orientation-horizontal | :white_check_mark: | both `orientation` attr and vocab class handled on container |
| qti-orientation-vertical | :white_check_mark: | no-op; default layout is vertical |

### layout — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-choices-stacking-{1-5} | :white_check_mark: | CSS Grid columns; column-major (vertical) or row-major (horizontal) |
| qti-input-control-hidden | :white_check_mark: | visually hidden input; stays in DOM for a11y |

### data attributes — advanced cert

| attribute | cutie | notes |
|---|---|---|
| data-max-selections-message | :white_check_mark: | probably not implemented correctly |
| data-min-selections-message | :white_check_mark: | probably not implemented correctly |

### writing mode — not in cert checklist

| class | cutie | notes |
|---|---|---|
| qti-writing-mode-vertical-rl | :x: | CJK vertical text |
| qti-writing-mode-vertical-lr | :x: | |

### uncertain

| class | cutie | notes |
|---|---|---|
| qti-labels-cjk-ideographic | :x: | in vocab but not in cert checklist |
