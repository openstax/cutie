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
| qti-labels-none | :x: | forwarded but no CSS |
| qti-labels-decimal | :x: | forwarded but no CSS |
| qti-labels-lower-alpha | :x: | forwarded but no CSS |
| qti-labels-upper-alpha | :x: | forwarded but no CSS |

### label suffixes — basic cert

| class | cutie | notes |
|---|---|---|
| qti-labels-suffix-none | :x: | forwarded but no CSS |
| qti-labels-suffix-period | :x: | forwarded but no CSS |
| qti-labels-suffix-parenthesis | :x: | forwarded but no CSS |

### orientation — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-orientation-horizontal | :white_check_mark: | `orientation` attr works, vocab class just forwarded |
| qti-orientation-vertical | :x: | default layout is vertical but class not handled |

### layout — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-choices-stacking-{1-5} | :x: | forwarded but no CSS |
| qti-input-control-hidden | :x: | forwarded but no CSS; should hide radio/checkbox widget |

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
