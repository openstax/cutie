<!-- spell-checker: ignore typecheck -->
# @openstax/cutie-editor

React-based WYSIWYG editor for QTI v3 assessment items. Built with Slate.js for robust XML attribute preservation and format-agnostic editing.

## Features

- **React-first** - Built with React and Slate.js for modern React applications
- **XML attribute preservation** - Pure JSON document model prevents HTML/XHTML conversion issues
- **Rich text editing** - Bold, italic, underline, headings, lists
- **QTI interactions** - Text entry, extended text, choice interactions
- **Feedback elements** - Inline and block feedback with automatic response processing generation
- **XML round-trip** - Parse QTI XML, edit, serialize back with fidelity
- **Unknown element preservation** - Unsupported QTI elements display as warnings, structure preserved on save
- **Response processing management** - Automatic scoring and feedback rule generation for supported patterns
- **TypeScript-first** - Full type safety with strict mode

## Installation

```bash
npm install @openstax/cutie-editor
# or
yarn add @openstax/cutie-editor
```

**Peer Dependencies:** React 18+

## Usage

```tsx
import { SlateEditor } from '@openstax/cutie-editor';

function QtiEditor() {
  const [qtiXml, setQtiXml] = useState('<qti-assessment-item>...</qti-assessment-item>');

  return (
    <SlateEditor
      qtiXml={qtiXml}
      onQtiChange={(xml) => setQtiXml(xml)}
      onError={(error) => console.error(error)}
    />
  );
}
```

## API

### `<SlateEditor>`

Main editor component.

**Props:**
```typescript
interface SlateEditorProps {
  qtiXml: string;                           // QTI XML string to edit
  onQtiChange?: (xml: string, result: SerializationResult) => void;
  onError?: (error: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
  assetHandlers?: AssetHandlers;            // Handlers for image upload/browse
}
```

## Supported QTI Elements

### Interactions
- `<qti-text-entry-interaction>` - Inline text entry
- `<qti-extended-text-interaction>` - Essay/long text
- `<qti-choice-interaction>` - Multiple choice with `<qti-simple-choice>` children
- `<qti-prompt>` - Optional prompt within choice interactions

### Feedback Elements
- `<qti-feedback-inline>` - Inline conditional feedback
- `<qti-feedback-block>` - Block-level conditional feedback

### XHTML Content
- `<p>`, `<div>`, `<span>` - Text containers
- `<h1>`-`<h6>` - Headings
- `<strong>`, `<b>`, `<em>`, `<i>`, `<u>` - Text formatting
- `<code>` - Code
- `<br>` - Line breaks
- `<img>` - Images
- `<ul>`, `<ol>`, `<li>` - Lists

### Unknown Elements
- Unsupported QTI elements display as yellow warning blocks
- Original XML and attributes preserved for round-trip fidelity

## Editor-Supported Patterns

The editor can automatically manage response processing (scoring and feedback) for certain patterns. When a QTI item uses patterns outside what the editor supports, it preserves the original response processing as "custom" and doesn't attempt to modify it.

### Scoring Modes

The editor recognizes three scoring modes:

#### `allCorrect` Mode

All interactions must be answered correctly to receive a score of 1 (otherwise 0).

**Recognized patterns:**
- Template: `match_correct.xml`
- Inline: Single `qti-response-condition` with `qti-match` (single interaction) or `qti-and` containing multiple `qti-match` elements (multiple interactions)

```xml
<!-- Single interaction -->
<qti-response-processing template="https://www.imsglobal.org/.../match_correct.xml"/>

<!-- Multiple interactions (generated inline) -->
<qti-response-processing>
  <qti-response-condition>
    <qti-response-if>
      <qti-and>
        <qti-match>
          <qti-variable identifier="RESPONSE1"/>
          <qti-correct identifier="RESPONSE1"/>
        </qti-match>
        <qti-match>
          <qti-variable identifier="RESPONSE2"/>
          <qti-correct identifier="RESPONSE2"/>
        </qti-match>
      </qti-and>
      <qti-set-outcome-value identifier="SCORE">
        <qti-base-value base-type="float">1</qti-base-value>
      </qti-set-outcome-value>
    </qti-response-if>
    <qti-response-else>
      <qti-set-outcome-value identifier="SCORE">
        <qti-base-value base-type="float">0</qti-base-value>
      </qti-set-outcome-value>
    </qti-response-else>
  </qti-response-condition>
</qti-response-processing>
```

#### `sumScores` Mode

Scores from each interaction are summed. Interactions with mappings use `qti-map-response`; those without use 1 if correct, 0 if incorrect.

**Recognized patterns:**
- Template: `map_response.xml`
- Inline: `qti-set-outcome-value` for SCORE containing `qti-sum` with `qti-map-response` and/or `qti-variable` references

```xml
<!-- Single mapped interaction -->
<qti-response-processing template="https://www.imsglobal.org/.../map_response.xml"/>

<!-- Multiple interactions (generated inline) -->
<qti-response-processing>
  <!-- Condition for unmapped response (sets intermediate RESPONSE1_SCORE) -->
  <qti-response-condition>...</qti-response-condition>

  <!-- Sum all scores -->
  <qti-set-outcome-value identifier="SCORE">
    <qti-sum>
      <qti-map-response identifier="RESPONSE_MAPPED"/>
      <qti-variable identifier="RESPONSE1_SCORE"/>
    </qti-sum>
  </qti-set-outcome-value>
</qti-response-processing>
```

#### `custom` Mode

Any pattern not matching the above is preserved verbatim. The editor will not modify response processing in custom mode.

**Triggers custom mode:**
- Unknown template URL
- Multiple root-level `qti-response-condition` elements (except feedback conditions)
- Scoring logic that doesn't match allCorrect or sumScores patterns
- Non-standard feedback patterns (see below)

### Feedback Patterns

The editor generates feedback identifiers based on interaction configurations and creates corresponding response processing rules.

#### Standard Feedback Identifier Naming

The editor uses this naming convention for feedback identifiers:

| Pattern | Description | Example |
|---------|-------------|---------|
| `{responseId}_correct` | Correct answer | `RESPONSE_correct` |
| `{responseId}_incorrect` | Incorrect answer | `RESPONSE_incorrect` |
| `{responseId}_choice_{choiceId}` | Specific choice selected | `RESPONSE_choice_A` |

#### Conditional Generation

Feedback identifiers are only generated when they make sense:
- `_correct` / `_incorrect` only appear if the interaction has a correct response configured (via `qti-correct-response` in the response declaration)
- `_choice_{id}` identifiers only appear for choice interactions

#### Standard Feedback Processing Pattern

The editor recognizes and generates this feedback accumulation pattern:

```xml
<qti-set-outcome-value identifier="FEEDBACK">
  <qti-multiple>
    <qti-variable identifier="FEEDBACK"/>
    <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
  </qti-multiple>
</qti-set-outcome-value>
```

The `qti-multiple` with `qti-variable identifier="FEEDBACK"` is the accumulation pattern - it preserves existing feedback values while adding new ones. This allows multiple feedback identifiers to be active simultaneously.

#### What Triggers Custom Mode for Feedback

Any of these cause the entire response processing to be preserved as custom:
- Feedback using an outcome variable other than "FEEDBACK"
- Identifier values not matching the `{responseId}_{type}` pattern
- Feedback rules not using the accumulation pattern
- Direct assignment instead of accumulation

### Response Declaration Requirements

For scoring to work, interactions need response declarations with correct responses:

```xml
<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
  <qti-correct-response>
    <qti-value>choice_A</qti-value>
  </qti-correct-response>
</qti-response-declaration>
```

For mapped scoring (sumScores with partial credit):

```xml
<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
  <qti-mapping default-value="0">
    <qti-map-entry map-key="choice_A" mapped-value="1"/>
    <qti-map-entry map-key="choice_B" mapped-value="0.5"/>
  </qti-mapping>
</qti-response-declaration>
```

## Architecture

### Slate Document Model

QTI and XHTML elements are represented as Slate nodes with:
- `type` - Element type (e.g., `qti-choice-interaction`, `paragraph`)
- `attributes` - XML attributes in kebab-case
- `children` - Nested content

### Folder Structure

- `editor/` - Main SlateEditor component and Toolbar
- `elements/` - Element renderers (feedbackInline, feedbackBlock, image, prompt, simpleChoice)
- `interactions/` - Interaction types (choice, textEntry, extendedText)
- `components/` - Shared UI components (PropertiesPanel)
- `contexts/` - React contexts (AssetContext, FeedbackIdentifiersContext)
- `plugins/` - Slate plugins (withQtiInteractions, withXhtml, withUnknownElements)
- `serialization/` - XML parsing and serialization
- `utils/` - Utilities (responseProcessingClassifier, responseProcessingGenerator, feedbackIdentifiers)

### Plugin Composition

The editor composes Slate plugins for different behaviors:

```typescript
withUnknownElements(
  withQtiInteractions(
    withXhtml(
      withHistory(withReact(editor))
    )
  )
)
```
