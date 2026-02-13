<!-- spell-checker: ignore patternmask -->
# qti-inline-choice-interaction

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.8zaq47h31112
- vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab#inline-choice-interaction
- conf: https://www.imsglobal.org/spec/qti/v3p0/conf

Note: inline-choice is entirely **advanced** cert (Q12 is Level 2).

## inline-choice interaction attributes

| attribute | cert | cutie | notes |
|---|---|---|---|
| response-identifier | advanced | :white_check_mark: | |
| required | advanced | :white_check_mark: | |
| shuffle | not in checklist | :white_check_mark: | server-side in cutie-core |
| min-choices | advanced | :white_check_mark: | |
| data-min-selections-message | advanced | :white_check_mark: | |

## inline choice attributes (qti-inline-choice)

| attribute | cert | cutie | notes |
|---|---|---|---|
| identifier | advanced | :white_check_mark: | |
| fixed | not in checklist | :white_check_mark: | respected during shuffle |
| show-hide | not in checklist | :white_check_mark: | processed in processTemplateConditionals |
| template-identifier | not in checklist | :white_check_mark: | processed in processTemplateConditionals |

## vocabulary classes

### input width — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-input-width-{1,2,3,4,6,10,15,20,25,30,35,40,45,50,72} | :x: | forwarded but no CSS |

### data attributes — advanced cert

| attribute | cutie | notes |
|---|---|---|
| data-prompt | :x: | prompt text for the dropdown |

### writing mode — not in cert checklist

| class | cutie | notes |
|---|---|---|
| qti-writing-orientation-vertical-rl | :x: | |
