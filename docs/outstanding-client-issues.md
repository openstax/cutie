# Outstanding client issues

Known problems in `@openstax/cutie-client` that haven't been fixed yet.

## Choice interaction renders block content inside a label

**Issue:** the HTML the client builds for `qti-simple-choice` is invalid when a choice contains
block content, and that block content is allowed in QTI.

In QTI v3, `qti-simple-choice` takes flow content, so a choice can mix inline content with
blocks such as `<p>`, `<div>`, `<ul>`, `<table>` and `qti-feedback-block`. Every OpenStax
choice sample has a `<p>` for the choice text followed by a `qti-feedback-block`.

The client (`packages/cutie-client/src/transformer/handlers/choiceInteraction.ts`) renders each
choice like this:

```html
<label class="cutie-simple-choice">
  <input type="radio" ...>
  <span class="cutie-simple-choice-content">
    <span class="cutie-correct-answer-overline">Correct answer</span>
    <p>Mitochondrion</p>
    <div class="cutie-feedback-block">
      <p>The citric acid cycle ...</p>
    </div>
  </span>
</label>
```

In HTML, both `<label>` and `<span>` only allow phrasing content, so the `<p>` and the feedback
`<div>` inside them are invalid.

**Impact:**

- Browsers render it correctly today, because the client builds the DOM with DOM APIs. If the
  same markup goes through an HTML parser (server rendering, `innerHTML`, copying the
  markup), the parser closes the `<span>` and `<label>` early and the structure falls apart.
- Assistive technology computes the label's accessible name from all of its content, so the
  input's name includes the feedback text. In the preview, for example, the radio is announced
  as "Correct answer Mitochondrion The citric acid cycle and the electron transport chain ...".
- HTML validators and accessibility checkers will report the nesting errors.

**Possible direction:** stop wrapping the whole choice in a `<label>`. Instead, use a block
container (`<div>`) for the choice, link the input to its text with `aria-labelledby` or a
`<label for>` that holds only the choice text, and render feedback as a sibling block outside
the accessible name. Clicking anywhere on the choice can still select it with a click handler
on the container. The choice and feedback styling, and the test flows in `docs/test-flows/`,
would need updating to match.

**Related:** `.cutie-simple-choice-content` resets the top margin of its first block child and
the bottom margin of its last one, so a choice written as `<p>text</p>` lines up with its input
the same way bare text does. Keep that behavior through any restructure.

## Match interaction defaults max-associations to no limit

**Issue:** `qti-match-interaction` without a `max-associations` attribute is rendered with no
limit on the number of associations. The QTI v3 default is 1: the information model says
"Default = "1"", and the ASI XSD declares `max-associations` with `default="1"`. Only an explicit
`max-associations="0"` means no limit.

**Impact:** an item that leaves out `max-associations` accepts more associations in cutie than
in a conformant delivery system. Items written against cutie may depend on the wrong default and
break elsewhere.

**Possible direction:** default `max-associations` to 1 in `matchInteractionHandler.ts`, and fall
back to that default for a value that isn't a number (it currently gives `NaN`). Before changing
it, check the existing samples and example items for match interactions without the attribute and
add an explicit value where they rely on no limit.

## Interactions natively disable their controls while a submission is pending

**Issue:** in the `'disabled'` interaction state (a submission is in flight), interactions set
the native `disabled` attribute on their controls. A focused control that becomes disabled loses
focus, which moves to the page body, so a keyboard or screen reader user loses their place in
the item while the request is pending.

**Impact:** after every submission, keyboard and screen reader users have to find their way back
to where they were. Assistive technology also gets no message about why the controls stopped
responding.

**Possible direction:** in the `'disabled'` state only, use `aria-disabled="true"` with the
controls kept focusable, refuse edits in the event handlers, and describe the state (for
example, "Submitting…") to assistive technology. The `'readonly'` state (a submitted response,
review, or preview) should keep native `disabled`, so the controls stay out of the tab order.
This applies to every interaction, so it should be one convention rather than a change to a
single interaction. The tabular match interaction already uses `aria-disabled` with a reason for
cells the association rules exclude, while the interaction is enabled.
