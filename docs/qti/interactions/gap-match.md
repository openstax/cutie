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
| template-identifier | not in checklist | :white_check_mark: | processed in processTemplateConditionals |
| show-hide | not in checklist | :white_check_mark: | processed in processTemplateConditionals |

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
| template-identifier | not in checklist | :white_check_mark: | processed in processTemplateConditionals |
| show-hide | not in checklist | :white_check_mark: | processed in processTemplateConditionals |

## gap attributes (qti-gap)

| attribute | cert | cutie | notes |
|---|---|---|---|
| identifier | advanced | :white_check_mark: | |
| match-group | advanced | :white_check_mark: | |
| required | not in checklist | :x: | |
| template-identifier | not in checklist | :white_check_mark: | processed in processTemplateConditionals |
| show-hide | not in checklist | :white_check_mark: | processed in processTemplateConditionals |

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

### word bank headings — cutie extension

QTI has no vocabulary for labeling a match-group, so cutie uses an ordinary heading in the interaction's content (block content, after the choices), tied to its group by a custom data attribute (spec §2.2.2's extension point):

```xml
<qti-gap-text identifier="warm_front" match-max="1" match-group="cause">warm front</qti-gap-text>
<h3 data-for-match-group="cause">Event</h3>
```

| attribute | on | cutie | notes |
|---|---|---|---|
| data-for-match-group | h1–h6 | :white_check_mark: | names the match-group whose word bank the heading titles; the bank's listbox is labelled by it (aria-labelledby). A heading for a group with no choices is dropped. Other delivery systems show it as plain content. |

When choices span 2+ match-groups, or any group has a heading, cutie gives each group its own word bank; otherwise all choices share one bank. The editor writes these headings as `h3` with plain text.
