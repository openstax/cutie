# qti-text-entry-interaction

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.5bw8rpbotrcs
- vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab#text-entry-interaction
- conf: https://www.imsglobal.org/spec/qti/v3p0/conf

## text-entry interaction attributes

| attribute | cert | cutie | notes |
|---|---|---|---|
| response-identifier | basic | :white_check_mark: | |
| expected-length | basic | :white_check_mark: | used as sizing hint (width in ch units) |
| pattern-mask | basic | :white_check_mark: | regex validation with aria-invalid feedback |
| placeholder-text | not in checklist | :white_check_mark: | |
| base | not in checklist | :x: | numeric base for value interpretation |
| string-identifier | not in checklist | :x: | references a string variable for response processing |
| format | not in checklist | :x: | expected format category (plain, pre-formatted) |

## vocabulary classes

### input width — basic cert

| class | cutie | notes |
|---|---|---|
| qti-input-width-{1,2,3,4,5,6,10,15,20,25,30,35,40,45,50,72} | :white_check_mark: | sets input width in ch units; overrides expected-length |

### data attributes — basic cert

| attribute | cutie | notes |
|---|---|---|
| data-patternmask-message | :white_check_mark: | custom error message for pattern-mask validation |

### writing mode — not in cert checklist

| class | cutie | notes |
|---|---|---|
| qti-writing-orientation-vertical-rl | :x: | |
| qti-writing-orientation-vertical-lr | :x: | |
