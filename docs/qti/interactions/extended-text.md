<!-- spell-checker: ignore patternmask -->
# qti-extended-text-interaction

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.omuxci3o5dmg
- vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab#extended-text-interaction
- conf: https://www.imsglobal.org/spec/qti/v3p0/conf

## extended-text interaction attributes

| attribute | cert | cutie | notes |
|---|---|---|---|
| response-identifier | basic | :white_check_mark: | |
| expected-lines | basic | :white_check_mark: | sets minHeight in em units |
| placeholder-text | not in checklist | :white_check_mark: | |
| min-strings | not in checklist | :white_check_mark: | validated with constraint messages |
| expected-length | not in checklist | :white_check_mark: | tracked but not used for sizing |
| format | advanced | :x: | plain and xhtml; we treat everything as plain text |
| pattern-mask | advanced | :x: | |
| max-strings | not in checklist | :x: | max number of response strings |
| base | not in checklist | :x: | numeric base for value interpretation |
| string-identifier | not in checklist | :x: | multi-string response support |

## vocabulary classes

### height lines — basic cert

| class | cutie | notes |
|---|---|---|
| qti-height-lines-3 | :x: | forwarded but no CSS; expected-lines attr works separately |
| qti-height-lines-6 | :x: | forwarded but no CSS |
| qti-height-lines-15 | :x: | forwarded but no CSS |

### counters — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-counter-up | :x: | character/word count up |
| qti-counter-down | :x: | character/word count down from expected-length |

### data attributes — advanced cert

| attribute | cutie | notes |
|---|---|---|
| data-patternmask-message | :x: | goes with pattern-mask |

### writing mode — not in cert checklist

| class | cutie | notes |
|---|---|---|
| qti-writing-orientation-vertical-rl | :x: | |
| qti-writing-orientation-vertical-lr | :x: | |
