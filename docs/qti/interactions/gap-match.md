<!-- spell-checker: ignore patternmask -->
# qti-gap-match-interaction

- spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.7sroqk3xl8e1
- vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab#gap-match-interaction
- conf: https://www.imsglobal.org/spec/qti/v3p0/conf

Note: gap-match is entirely **advanced** cert (Q6 is Level 2).

## gap-match interaction attributes

| attribute | cert | cutie | notes |
|---|---|---|---|
| response-identifier | advanced | :white_check_mark: | |
| shuffle | advanced | :white_check_mark: | server-side in cutie-core |
| min-associations | advanced | :white_check_mark: | client + server validation |
| max-associations | advanced | :white_check_mark: | client + server validation |

## gap-text attributes (qti-gap-text)

| attribute | cert | cutie | notes |
|---|---|---|---|
| identifier | advanced | :white_check_mark: | |
| match-max | advanced | :white_check_mark: | 0 = unlimited reuse |
| match-group | advanced | :white_check_mark: | constrains which gaps accept which choices |
| match-min | not in checklist | :x: | |
| template-identifier | not in checklist | :x: | |
| show-hide | not in checklist | :x: | |

## gap-img attributes (qti-gap-img)

| attribute | cert | cutie | notes |
|---|---|---|---|
| identifier | advanced | :white_check_mark: | |
| match-max | advanced | :white_check_mark: | |
| match-group | advanced | :white_check_mark: | |
| match-min | not in checklist | :x: | |
| object-label | not in checklist | :x: | alt text for the image |
| top | not in checklist | :x: | CSS positioning |
| left | not in checklist | :x: | CSS positioning |
| template-identifier | not in checklist | :x: | |
| show-hide | not in checklist | :x: | |

## gap attributes (qti-gap)

| attribute | cert | cutie | notes |
|---|---|---|---|
| identifier | advanced | :white_check_mark: | |
| match-group | advanced | :white_check_mark: | |
| required | not in checklist | :x: | |
| template-identifier | not in checklist | :x: | |
| show-hide | not in checklist | :x: | |

## vocabulary classes

### choices positioning — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-choices-top | :x: | word bank above content |
| qti-choices-bottom | :x: | word bank below content |
| qti-choices-left | :x: | word bank left of content |
| qti-choices-right | :x: | word bank right of content |

### container sizing — advanced cert

| attribute | cutie | notes |
|---|---|---|
| data-choices-container-width | :x: | width of the choices container |

### input width — advanced cert

| class | cutie | notes |
|---|---|---|
| qti-input-width-{1,2,3,4,6,10,15,20,25,30,35,40,45,50,72} | :x: | gap element width |

### data attributes — advanced cert

| attribute | cutie | notes |
|---|---|---|
| data-max-selections-message | :x: | custom message when max-associations violated |
| data-min-selections-message | :x: | custom message when min-associations violated |
