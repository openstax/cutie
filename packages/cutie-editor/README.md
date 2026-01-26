<!-- spell-checker: ignore typecheck hotspot Hotspot -->
# @openstax/cutie-editor

React-based WYSIWYG editor for QTI v3 assessment items. Built with Slate.js for robust XML attribute preservation and format-agnostic editing.

## Features

- ✅ **React-first** - Built with React and Slate.js for modern React applications
- ✅ **XML attribute preservation** - Pure JSON document model prevents HTML/XHTML conversion issues
- ✅ **Rich text editing** - Bold, italic, underline, headings, lists
- ✅ **QTI interactions** - Text entry, extended text, choice interactions
- ✅ **XML round-trip** - Parse QTI XML ↔ Edit ↔ Serialize back to QTI XML with perfect fidelity
- ✅ **Unknown element preservation** - Displays unsupported QTI elements as warnings, preserves structure on save
- ✅ **Unique ID validation** - Auto-generates and validates response identifiers
- ✅ **TypeScript-first** - Full type safety with strict mode
- ✅ **Extensible** - Plugin system for custom QTI element support

## Installation

```bash
npm install @openstax/cutie-editor
# or
yarn add @openstax/cutie-editor
```

**Peer Dependencies:** React 18+

## Usage

### Basic Example

```typescript
import React, { useState } from 'react';
import { SlateEditor, Toolbar, parseXmlToSlate, serializeSlateToXml } from '@openstax/cutie-editor';
import type { Descendant } from '@openstax/cutie-editor';
import { Slate } from 'slate-react';
import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';

function QtiEditor({ initialXml }: { initialXml?: string }) {
  // Parse initial XML to Slate format
  const initialValue = initialXml
    ? parseXmlToSlate(initialXml)
    : [{ type: 'paragraph', children: [{ text: '' }] }];

  const [value, setValue] = useState<Descendant[]>(initialValue);
  const [editor] = useState(() => withReact(withHistory(createEditor())));

  const handleChange = (newValue: Descendant[]) => {
    setValue(newValue);
  };

  const handleSave = () => {
    const { xml, responseIdentifiers, errors } = serializeSlateToXml(value);

    if (errors) {
      console.error('Validation errors:', errors);
      return;
    }

    console.log('QTI XML:', xml);
    console.log('Response IDs:', responseIdentifiers);
  };

  return (
    <div>
      <Slate editor={editor} initialValue={value} onChange={handleChange}>
        <Toolbar />
        <SlateEditor
          value={value}
          onChange={handleChange}
          placeholder="Enter content..."
        />
      </Slate>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

## API

### Components

#### `<SlateEditor>`

Main editor component.

**Props:**
```typescript
interface SlateEditorProps {
  value: Descendant[];              // Controlled Slate document state
  onChange: (value: Descendant[]) => void;  // Change handler
  onSerialize?: (result: SerializationResult) => void;  // Optional auto-serialize
  className?: string;               // Optional CSS class
  readOnly?: boolean;               // Read-only mode
  placeholder?: string;             // Placeholder text
}
```

#### `<Toolbar>`

Toolbar component with formatting and interaction buttons. Must be used inside a `<Slate>` provider.

### Utilities

#### `parseXmlToSlate(xml: string): Descendant[]`

Parse QTI XML (or qti-item-body content) to Slate document format.

**Parameters:**
- `xml: string` - QTI XML string

**Returns:** `Descendant[]` - Slate document nodes

**Example:**
```typescript
const slateNodes = parseXmlToSlate('<p>Hello <strong>world</strong></p>');
```

#### `serializeSlateToXml(nodes: Descendant[]): SerializationResult`

Serialize Slate document to QTI XML.

**Parameters:**
- `nodes: Descendant[]` - Slate document nodes

**Returns:** `SerializationResult` - Serialization result with XML, identifiers, and errors

**Example:**
```typescript
const { xml, responseIdentifiers, errors } = serializeSlateToXml(nodes);
```

### Plugins

#### `withQtiInteractions(editor): Editor`

Slate plugin that handles QTI interaction-specific behavior (void elements, inline elements, normalization).

#### `withXhtml(editor): Editor`

Slate plugin for XHTML normalization rules.

#### `withUnknownElements(editor): Editor`

Slate plugin for handling unknown QTI elements.

### Insertion Commands

#### `insertTextEntryInteraction(editor, config?)`

Insert a text entry interaction at the current selection.

**Config:**
```typescript
{
  responseIdentifier?: string;  // Auto-generated if not provided
  expectedLength?: string;
  patternMask?: string;
  placeholderText?: string;
}
```

#### `insertExtendedTextInteraction(editor, config?)`

Insert an extended text interaction.

**Config:**
```typescript
{
  responseIdentifier?: string;
  expectedLines?: string;
  expectedLength?: string;
  placeholderText?: string;
}
```

#### `insertChoiceInteraction(editor, config?)`

Insert a choice interaction.

**Config:**
```typescript
{
  responseIdentifier?: string;
  maxChoices?: string;
  minChoices?: string;
  shuffle?: boolean;
  choices?: Array<{ identifier: string; text?: string }>;
}
```

### Types

```typescript
interface SerializationResult {
  xml: string;                      // Generated QTI XML
  responseIdentifiers: string[];    // List of response IDs
  errors?: ValidationError[];       // Validation errors
}

interface ValidationError {
  type: 'duplicate-identifier' | 'missing-identifier' | 'invalid-xml' | 'unknown';
  message: string;
  responseIdentifier?: string;
}
```

## Supported QTI Elements

### Interactions
- ✅ `<qti-text-entry-interaction>` - Inline text entry
- ✅ `<qti-extended-text-interaction>` - Essay/long text
- ✅ `<qti-choice-interaction>` - Multiple choice with `<qti-simple-choice>` children
- ✅ `<qti-prompt>` - Optional prompt within choice interactions

### XHTML Content
- ✅ `<p>` - Paragraphs
- ✅ `<div>`, `<span>` - Containers
- ✅ `<h1>`-`<h6>` - Headings
- ✅ `<strong>`, `<b>` - Bold
- ✅ `<em>`, `<i>` - Italic
- ✅ `<u>` - Underline
- ✅ `<code>` - Code
- ✅ `<br>` - Line breaks
- ✅ `<img>` - Images
- ✅ `<ul>`, `<ol>`, `<li>` - Lists

### Unknown Elements
- ✅ Unsupported QTI elements display as yellow warning blocks
- ✅ Original XML and attributes preserved for round-trip fidelity
- ✅ Content remains editable within unknown elements

## Architecture

### Slate Document Model

All QTI and XHTML elements are represented as Slate nodes with:
- **`type`** field for element discrimination
- **`attributes`** sub-object storing all XML attributes in kebab-case
- **`children`** array for nested content

**Example:**
```typescript
{
  type: 'qti-text-entry-interaction',
  children: [{ text: '' }],  // Void elements have single empty child
  attributes: {
    'response-identifier': 'RESPONSE_1',
    'expected-length': '10',
    'placeholder-text': 'Enter answer'
  }
}
```

### Plugin Composition

The editor composes multiple Slate plugins:

```typescript
withUnknownElements(
  withQtiInteractions(
    withXhtml(
      withHistory(
        withReact(editor)
      )
    )
  )
)
```

Each plugin adds specific behaviors:
- **withQtiInteractions**: Marks interactions as void/inline, provides insertion commands
- **withXhtml**: Enforces XHTML structure rules (e.g., lists must contain list-items)
- **withUnknownElements**: Handles void status for unknown QTI elements

### XML Round-Trip

```
QTI XML → parseXmlToSlate → Slate Document → Editor → serializeSlateToXml → QTI XML
```

**Benefits:**
1. **No HTML conversion** - Pure JSON model prevents attribute loss
2. **Perfect preservation** - All XML attributes stored in `attributes` sub-object
3. **Custom nodes** - QTI elements are first-class node types
4. **Extensible** - Easy to add new QTI element support

## Project Structure

```
src/
├── index.ts                          # Public API exports
├── types.ts                          # Type definitions and Slate extensions
├── editor/
│   ├── SlateEditor.tsx               # Main editor component
│   └── Toolbar.tsx                   # Toolbar component
├── plugins/
│   ├── withQtiInteractions.ts        # QTI interaction behaviors
│   ├── withXhtml.ts                  # XHTML normalization
│   ├── withUnknownElements.ts        # Unknown element handling
│   └── index.ts                      # Plugin exports
└── serialization/
    ├── xmlUtils.ts                   # XML utility functions
    ├── xmlToSlate.ts                 # XML → Slate parser
    └── slateToXml.ts                 # Slate → XML serializer
```

## Development

```bash
# Build (ESM + CJS)
yarn build

# Type check
yarn ci:typecheck

# Lint
yarn ci:lint

# Run all CI checks
yarn ci
```

## Adding New Interactions

To add support for a new QTI interaction:

### 1. Add Type Definition

Update `src/types.ts`:

```typescript
export interface QtiHotspotInteraction {
  type: 'qti-hotspot-interaction';
  children: Array<SlateElement | SlateText>;
  attributes: {
    'response-identifier': string;
    'max-choices': string;
    // ... other attributes
  } & ElementAttributes;
}

// Add to SlateElement union
export type SlateElement =
  | QtiHotspotInteraction
  | ...
```

### 2. Update Parser

In `src/serialization/xmlToSlate.ts`, add case for new element:

```typescript
if (tagName === 'qti-hotspot-interaction') {
  const children = convertNodesToSlate(Array.from(element.childNodes));
  return {
    type: 'qti-hotspot-interaction',
    children: children.length > 0 ? children : [{ text: '' }],
    attributes: {
      'response-identifier': attributes['response-identifier'] || '',
      'max-choices': attributes['max-choices'] || '1',
      ...attributes,
    },
  } as SlateElement;
}
```

### 3. Update Serializer

In `src/serialization/slateToXml.ts`, add conversion function:

```typescript
function convertHotspotInteraction(
  element: SlateElement & { type: 'qti-hotspot-interaction' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-hotspot-interaction');

  const responseId = element.attributes['response-identifier'];
  if (responseId) {
    context.responseIdentifiers.push(responseId);
  }

  setAttributes(xmlElement, element.attributes);

  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) xmlElement.appendChild(childNode);
  }

  return xmlElement;
}
```

### 4. Add Renderer

In `src/editor/SlateEditor.tsx`, add case to `Element` component:

```typescript
case 'qti-hotspot-interaction':
  return (
    <div {...attributes} style={{ /* styling */ }}>
      {children}
      [Hotspot Interaction: {el.attributes['response-identifier']}]
    </div>
  );
```

### 5. Add Insertion Command (Optional)

In `src/plugins/withQtiInteractions.ts`:

```typescript
export function insertHotspotInteraction(editor: Editor, config: {...}): void {
  const responseId = config.responseIdentifier || generateResponseId(editor);

  const hotspot = {
    type: 'qti-hotspot-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      ...config
    },
  };

  Transforms.insertNodes(editor, hotspot as any);
}
```

## Migration from TinyMCE Version

The previous TinyMCE-based version used an imperative `mountEditor()` API. The new Slate version uses React components:

**Before:**
```typescript
const editor = await mountEditor(container, { initialXml, onChange });
editor.serialize();
editor.destroy();
```

**After:**
```typescript
const [value, setValue] = useState(parseXmlToSlate(initialXml));
const [editor] = useState(() => withReact(withHistory(createEditor())));

<Slate editor={editor} initialValue={value} onChange={setValue}>
  <Toolbar />
  <SlateEditor value={value} onChange={setValue} />
</Slate>

// Serialize when needed
const { xml } = serializeSlateToXml(value);
```

## License

MIT
