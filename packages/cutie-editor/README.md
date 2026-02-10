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

### Response Declaration Requirements

For scoring to work, interactions need response declarations with correct responses:

```xml
<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
  <qti-correct-response>
    <qti-value>choice_A</qti-value>
  </qti-correct-response>
</qti-response-declaration>
```

For text entry and other interactions that benefit from case-insensitive matching, use `qti-mapping`. QTI 3.0 mappings are case-insensitive by default, which avoids penalizing learners for capitalization differences:

```xml
<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
  <qti-correct-response>
    <qti-value>Philadelphia</qti-value>
  </qti-correct-response>
  <qti-mapping default-value="0">
    <qti-map-entry map-key="Philadelphia" mapped-value="1"/>
    <qti-map-entry map-key="Philly" mapped-value="0.5"/>
  </qti-mapping>
</qti-response-declaration>
```

### Scoring Modes

The editor recognizes three scoring modes:

#### `allCorrect` Mode

All interactions must be answered correctly to receive a score of 1 (otherwise 0). MAXSCORE is always 1.

The correctness check for each interaction depends on whether a `qti-mapping` is present:

- **Without mapping:** `qti-match` compares the response variable to its correct value. This is case-sensitive for strings.
- **With mapping:** `qti-equal(qti-map-response, maxValue)` checks that the mapped score equals the maximum possible value. This leverages the mapping's case-insensitive matching.

**Template shortcut** (single interaction named `RESPONSE`, no mapping, no feedback):

```xml
<qti-response-processing template="https://www.imsglobal.org/.../match_correct.xml"/>
```

**Single interaction without mapping:**

```xml
<qti-response-processing>
  <qti-response-condition>
    <qti-response-if>
      <qti-match>
        <qti-variable identifier="RESPONSE"/>
        <qti-correct identifier="RESPONSE"/>
      </qti-match>
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

**Single interaction with mapping** (e.g., text entry where max mapped value is 1):

```xml
<qti-response-processing>
  <qti-response-condition>
    <qti-response-if>
      <qti-equal>
        <qti-map-response identifier="RESPONSE"/>
        <qti-base-value base-type="float">1</qti-base-value>
      </qti-equal>
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

**Multiple interactions** (mix of mapped and unmapped wrapped in `qti-and`):

```xml
<qti-response-processing>
  <qti-response-condition>
    <qti-response-if>
      <qti-and>
        <!-- Unmapped interaction: qti-match -->
        <qti-match>
          <qti-variable identifier="RESPONSE_1"/>
          <qti-correct identifier="RESPONSE_1"/>
        </qti-match>
        <!-- Mapped interaction: qti-equal(qti-map-response, max) -->
        <qti-equal>
          <qti-map-response identifier="RESPONSE_2"/>
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-equal>
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

Scores from each interaction are summed. Interactions with mappings use `qti-map-response`; those without get an intermediate `{id}_SCORE` variable set to 1 if correct, 0 if incorrect.

**Template shortcut** (single interaction named `RESPONSE` with mapping, no feedback):

```xml
<qti-response-processing template="https://www.imsglobal.org/.../map_response.xml"/>
```

**Template shortcut** (single interaction named `RESPONSE` without mapping, no feedback):

```xml
<qti-response-processing template="https://www.imsglobal.org/.../match_correct.xml"/>
```

**Multiple interactions** (inline pattern):

```xml
<qti-response-processing>
  <!-- For each unmapped response: set intermediate score variable -->
  <qti-response-condition>
    <qti-response-if>
      <qti-match>
        <qti-variable identifier="RESPONSE_UNMAPPED"/>
        <qti-correct identifier="RESPONSE_UNMAPPED"/>
      </qti-match>
      <qti-set-outcome-value identifier="RESPONSE_UNMAPPED_SCORE">
        <qti-base-value base-type="float">1</qti-base-value>
      </qti-set-outcome-value>
    </qti-response-if>
    <qti-response-else>
      <qti-set-outcome-value identifier="RESPONSE_UNMAPPED_SCORE">
        <qti-base-value base-type="float">0</qti-base-value>
      </qti-set-outcome-value>
    </qti-response-else>
  </qti-response-condition>

  <!-- Sum all scores -->
  <qti-set-outcome-value identifier="SCORE">
    <qti-sum>
      <qti-map-response identifier="RESPONSE_MAPPED"/>
      <qti-variable identifier="RESPONSE_UNMAPPED_SCORE"/>
    </qti-sum>
  </qti-set-outcome-value>
</qti-response-processing>
```

#### `custom` Mode

Any pattern not matching the above is preserved verbatim. The editor will not modify response processing in custom mode.

**Triggers custom mode:**
- Unknown template URL
- Scoring logic that doesn't match allCorrect or sumScores patterns
- Non-standard feedback patterns (see below)

### Feedback Patterns

The editor generates feedback identifiers based on interaction configurations and creates corresponding response processing rules. Feedback conditions always follow the scoring condition as additional `qti-response-condition` elements.

#### Standard Feedback Identifier Naming

| Pattern | Description | Interactions | Example |
|---------|-------------|--------------|---------|
| `{responseId}_correct` | Correct answer | All | `RESPONSE_correct` |
| `{responseId}_incorrect` | Incorrect answer | All | `RESPONSE_incorrect` |
| `{responseId}_partial` | Partial credit | Text entry (with mapping) | `RESPONSE_partial` |
| `{responseId}_choice_{choiceId}` | Specific choice selected | Choice | `RESPONSE_choice_A` |

#### Conditional Generation

Feedback identifiers are only generated when they make sense:
- `_correct` / `_incorrect` only appear if the interaction has a correct response configured (via `qti-correct-response` in the response declaration)
- `_partial` only appears for text entry interactions that have a `qti-mapping`
- `_choice_{id}` identifiers only appear for choice interactions

#### Feedback Accumulation Pattern

Every feedback setter uses the accumulation pattern so multiple feedback identifiers can be active at once:

```xml
<qti-set-outcome-value identifier="FEEDBACK">
  <qti-multiple>
    <qti-variable identifier="FEEDBACK"/>
    <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
  </qti-multiple>
</qti-set-outcome-value>
```

#### Text Entry Feedback (unmapped)

Two-way correct/incorrect using `qti-match`:

```xml
<qti-response-condition>
  <qti-response-if>
    <qti-match>
      <qti-variable identifier="RESPONSE"/>
      <qti-correct identifier="RESPONSE"/>
    </qti-match>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-if>
  <qti-response-else>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">RESPONSE_incorrect</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-else>
</qti-response-condition>
```

#### Text Entry Feedback (mapped, two-way)

When mapped but no `_partial` feedback element is used, correct is checked via `qti-equal(qti-map-response, maxValue)`:

```xml
<qti-response-condition>
  <qti-response-if>
    <qti-equal>
      <qti-map-response identifier="RESPONSE"/>
      <qti-base-value base-type="float">1</qti-base-value>
    </qti-equal>
    <!-- set RESPONSE_correct -->
  </qti-response-if>
  <qti-response-else>
    <!-- set RESPONSE_incorrect -->
  </qti-response-else>
</qti-response-condition>
```

#### Text Entry Feedback (mapped, three-way with partial)

When mapped and a `_partial` feedback element exists, a three-way condition is generated:

```xml
<qti-response-condition>
  <!-- Correct: mapped score equals max -->
  <qti-response-if>
    <qti-equal>
      <qti-map-response identifier="RESPONSE"/>
      <qti-base-value base-type="float">1</qti-base-value>
    </qti-equal>
    <!-- set RESPONSE_correct -->
  </qti-response-if>
  <!-- Partial: mapped score > 0 but less than max -->
  <qti-response-else-if>
    <qti-gt>
      <qti-map-response identifier="RESPONSE"/>
      <qti-base-value base-type="float">0</qti-base-value>
    </qti-gt>
    <!-- set RESPONSE_partial -->
  </qti-response-else-if>
  <!-- Incorrect: mapped score = 0 -->
  <qti-response-else>
    <!-- set RESPONSE_incorrect -->
  </qti-response-else>
</qti-response-condition>
```

#### Choice Feedback (correct/incorrect)

Uses `qti-match` for correct/incorrect, same as unmapped text entry:

```xml
<qti-response-condition>
  <qti-response-if>
    <qti-match>
      <qti-variable identifier="RESPONSE"/>
      <qti-correct identifier="RESPONSE"/>
    </qti-match>
    <!-- set RESPONSE_correct -->
  </qti-response-if>
  <qti-response-else>
    <!-- set RESPONSE_incorrect -->
  </qti-response-else>
</qti-response-condition>
```

#### Choice Feedback (per-choice, single cardinality)

Uses `qti-match` against a specific choice identifier:

```xml
<qti-response-condition>
  <qti-response-if>
    <qti-match>
      <qti-variable identifier="RESPONSE"/>
      <qti-base-value base-type="identifier">choice_A</qti-base-value>
    </qti-match>
    <!-- set RESPONSE_choice_choice_A -->
  </qti-response-if>
</qti-response-condition>
```

#### Choice Feedback (per-choice, multiple cardinality)

Uses `qti-member` to check if a choice is in the response set:

```xml
<qti-response-condition>
  <qti-response-if>
    <qti-member>
      <qti-base-value base-type="identifier">choice_A</qti-base-value>
      <qti-variable identifier="RESPONSE"/>
    </qti-member>
    <!-- set RESPONSE_choice_choice_A -->
  </qti-response-if>
</qti-response-condition>
```

#### sumScores Default Feedback

In sumScores mode, feedback for mapped responses uses `qti-gt(qti-map-response, 0)`:

```xml
<qti-response-condition>
  <qti-response-if>
    <qti-gt>
      <qti-map-response identifier="RESPONSE"/>
      <qti-base-value base-type="float">0</qti-base-value>
    </qti-gt>
    <!-- set RESPONSE_correct -->
  </qti-response-if>
  <qti-response-else>
    <!-- set RESPONSE_incorrect -->
  </qti-response-else>
</qti-response-condition>
```

Unmapped responses in sumScores mode use `qti-match` (same as allCorrect).

#### What Triggers Custom Mode for Feedback

Any of these cause the entire response processing to be preserved as custom:
- Feedback using an outcome variable other than "FEEDBACK"
- Identifier values not matching the `{responseId}_{type}` naming convention
- Feedback rules not using the accumulation pattern
- Direct assignment instead of accumulation

### Classifier Summary

The classifier (`responseProcessingClassifier.ts`) detects the mode by inspecting the `qti-response-processing` element:

1. **Template attribute** (highest priority):
   - `match_correct.xml` → `allCorrect`
   - `map_response.xml` → `sumScores`
   - Unknown → `custom`

2. **Inline pattern** (no template):
   - First condition checks correctness via `qti-match` or `qti-equal(qti-map-response)`, optionally wrapped in `qti-and` → `allCorrect`
   - Top-level `qti-set-outcome-value` for SCORE with `qti-sum` → `sumScores`
   - Anything else → `custom`

3. **Feedback validation**: Even if the scoring pattern is recognized, all feedback conditions must follow standard patterns (accumulation, standard identifiers). Non-standard feedback triggers `custom`.

4. **Edge cases**:
   - No `qti-response-processing` element → `allCorrect`
   - Empty `qti-response-processing` → `allCorrect`

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
