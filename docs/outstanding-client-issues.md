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
