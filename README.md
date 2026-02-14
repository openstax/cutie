<!-- spell-checker: ignore hotspots -->

# Project Cutie

![cute logo](./cute-image.png)

Project Cutie is an implementation of the QTIv3 standard for displaying and scoring QTI Assessment Items.

## QTI Documentation
- https://www.imsglobal.org/spec/qti/v3p0/impl
- [QTI spec coverage](docs/qti/README.md)

## Design

Response and template processing are separated from the presentational layer using purely stateless and asynchronous functions. This allows item definitions to be processed securely in a backend environment without exposing sensitive content to the client.

### Architecture

**Server-side (cutie-core):**
- **Template processing**: Takes item definition and current state, produces sanitized QTI XML
  - Resolves template variables to their current values
  - Applies conditional visibility based on state
  - Strips sensitive content (response processing rules, correct answers, hidden feedback, variable declarations)
  - Returns presentation-ready QTI XML safe for client consumption
- **Response processing**: A reducer function that accepts current state, item definition, and response submission, then produces a new state

**Client-side (cutie-client):**
- Parses sanitized QTI XML from server
- Converts QTI XML to HTML for rendering
- Wires up interaction handlers (drag/drop, drawing, hotspots, etc.)
- Serializes user responses back to QTI format for submission

**Authoring (cutie-editor):**
- React-based WYSIWYG editor for QTI v3 assessment items
- Built with Slate.js for robust editing experience 
- Supports many QTI v3 interaction types, features, and response processing rules
- Text formatting and media embedding
- Strives to be non-destructive to unrecognized elements

**Learner state**: A serializable `AttemptState` object representing a learner's attempt at an item, containing:
- Opaque `variables` object managed by QTI processing (host application doesn't interpret)
- Standardized `completionStatus` field indicating if further attempts are allowed

### Benefits

- **Platform flexibility**: XML intermediate format enables alternative renderers (native mobile apps, PDF generation, accessibility tools)
- **Security**: Server acts as content filter, never exposing sensitive item data
- **Separation of concerns**: Server handles QTI logic, client handles presentation
- **Testability**: Easy to verify server output is valid, sanitized QTI XML

## QTI Extensions

### Feedback Type Attribute (`data-feedback-type`)

QTI uses "feedback" elements (`qti-feedback-block`, `qti-feedback-inline`, `qti-modal-feedback`) for any conditionally-displayed content based on response variables. In practice, this conflates two distinct purposes:

1. **Genuine feedback** - Messages shown to learners about their performance ("Correct!", "Try again", hints)
2. **Conditional content** - Content that changes based on state, especially in adaptive items (problem variations, dynamic instructions)

This distinction matters for delivery: learner feedback benefits from visual treatment (colored borders, emphasis), while conditional content should render as normal prose.

**Solution**: Cutie extends QTI feedback elements with an optional `data-feedback-type` attribute:

| Value | Purpose | Styling |
|-------|---------|---------|
| `correct` | Positive feedback | Green accent |
| `incorrect` | Negative feedback | Red accent |
| `info` | Neutral/informational feedback | Blue accent |
| (none) | Conditional content, not feedback | No special styling |

This attribute is set in `cutie-editor` and preserved through `cutie-core` processing. `cutie-client` applies appropriate styles based on the value.

Items authored without this attribute will render feedback elements unstyled, maintaining backward compatibility with standard QTI content.

### Formula Response Type (`data-response-type="formula"`)

QTI's standard `qti-extended-text-interaction` treats responses as plain text, comparing strings exactly. For mathematical content, this is problematic: `5x` and `x*5` are mathematically equivalent but fail string comparison.

**Solution**: Cutie extends `qti-response-declaration` with attributes that enable mathematical formula comparison:

```xml
<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"
  data-response-type="formula" data-comparison-mode="algebraic">
  <qti-correct-response>
    <qti-value>x^2-1</qti-value>
  </qti-correct-response>
</qti-response-declaration>
```

**Attributes on `qti-response-declaration`:**

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-response-type` | `formula` | Enables formula processing for this response |
| `data-comparison-mode` | `strict`, `canonical`, `algebraic` | How to compare expressions (default: `canonical`) |

**Comparison Modes:**

| Mode | Description | Example equivalences |
|------|-------------|---------------------|
| `strict` | AST structure must match exactly after parsing | Only identical LaTeX matches |
| `canonical` | Normalized forms compared | `5x` = `x*5`, `x+y` = `y+x` |
| `algebraic` | Full mathematical equivalence | `2x+3x` = `5x`, `(x+1)(x-1)` = `x^2-1` |

**Client-side rendering**: When `cutie-client` encounters a `qti-extended-text-interaction` linked to a formula response, it renders a [MathLive](https://cortexjs.io/mathlive/) math-field instead of a textarea, providing a rich math editing experience. Falls back to a LaTeX textarea if MathLive fails to load.

**Server-side scoring**: `cutie-core` uses the [Compute Engine](https://cortexjs.io/compute-engine/) to compare LaTeX expressions according to the specified mode when evaluating `qti-match` elements.

Standard QTI items without these attributes continue to work normally with string comparison.

### Character Limits (`data-min-characters`, `data-max-characters`)

QTI's `expected-length` attribute is a sizing hint — it suggests a response length but does
not enforce it. Some assessment scenarios require hard character limits that prevent
submission when constraints are not met.

**Solution**: Cutie extends `qti-extended-text-interaction` with character limit attributes:

```xml
<qti-extended-text-interaction response-identifier="RESPONSE"
  data-min-characters="20" data-max-characters="200" class="qti-counter-up">
```

| Attribute | Element | Description |
|-----------|---------|-------------|
| `data-min-characters` | `qti-extended-text-interaction` | Minimum character requirement; response is invalid when not met |
| `data-max-characters` | `qti-extended-text-interaction` | Hard character limit; response is invalid when exceeded |

`data-max-characters` always displays a live character counter (defaulting to count-down).
The `qti-counter-up` / `qti-counter-down` vocab classes can override the counter direction.
Unlike `expected-length` (which shows "suggested characters"), `data-max-characters` uses
hard-limit language ("characters remaining" / "over limit") and fails validation on submit.

`data-min-characters` displays a constraint message (`"Write at least N characters"`) and
implies the response is required — empty input fails validation without needing `min-strings="1"`.

The two attributes pair well together with `qti-counter-up` to give learners a clear picture
of the acceptable response length range.
