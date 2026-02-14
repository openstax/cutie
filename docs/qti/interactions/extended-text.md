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
| expected-length | not in checklist | :white_check_mark: | used with counter vocab classes for character counter |
| format | advanced | :white_check_mark: | plain (textarea) and xhtml (Quill rich text editor) |
| pattern-mask | advanced | :white_check_mark: | regex validation with constraint message |
| max-strings | not in checklist | :x: | max number of response strings |
| base | not in checklist | :x: | numeric base for value interpretation |
| string-identifier | not in checklist | :x: | multi-string response support |

## vocabulary classes

### height lines — basic cert

| class | cutie | notes |
|---|---|---|
| qti-height-lines-3 | :white_check_mark: | min-height 4.2em; expected-lines attr overrides |
| qti-height-lines-6 | :white_check_mark: | min-height 8.4em; expected-lines attr overrides |
| qti-height-lines-15 | :white_check_mark: | min-height 21em; expected-lines attr overrides |

### counters — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-counter-up | :white_check_mark: | character count up (e.g. "25 / 200 characters") |
| qti-counter-down | :white_check_mark: | character count down from expected-length (e.g. "175 characters remaining") |

### data attributes — spec extensions

| attribute | cutie | notes |
|---|---|---|
| data-patternmask-message | :white_check_mark: | custom error text for pattern-mask |
| data-min-characters | :white_check_mark: | minimum character requirement; response invalid when not met; implies required |
| data-max-characters | :white_check_mark: | hard character limit; response invalid when exceeded; counter always shown (defaults to count-down) |

### writing mode — not in cert checklist

| class | cutie | notes |
|---|---|---|
| qti-writing-orientation-vertical-rl | :x: | |
| qti-writing-orientation-vertical-lr | :x: | |
