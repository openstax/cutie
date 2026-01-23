<!-- spell-checker: ignore typecheck hotspot -->
# @openstax/cutie-client

Browser-side rendering library for QTI v3 assessment items. Parses sanitized QTI XML from `@openstax/cutie-core` and renders it as interactive HTML.

## Installation

```bash
npm install @openstax/cutie-client
# or
yarn add @openstax/cutie-client
```

## Usage

```typescript
import { mountItem } from '@openstax/cutie-client';

// Get sanitized QTI XML from cutie-core
const sanitizedXml = '...'; // from cutie-core template processing

// Mount to a DOM container
const container = document.getElementById('item-container');
const cleanup = mountItem(container, sanitizedXml);

// Later, when you want to unmount
cleanup();
```

## Architecture

### Core Flow

```
QTI XML String → Parse XML → Transform Elements → Mount to DOM
```

The library follows a pipeline architecture:

1. **Parse**: XML string → DOM structure (via `DOMParser`)
2. **Transform**: QTI elements → HTML elements (via handler registry)
3. **Render**: HTML → mounted in container

### Handler Registry System

The transformation system uses a **priority-based handler registry** for processing elements. This makes it easy to add support for new QTI interactions incrementally.

#### How It Works

- Each handler registers itself with a **priority number** (lower = higher priority)
- When transforming an element, the registry finds the first handler that can process it
- Handlers are checked in priority order until a match is found

#### Priority Tiers

```
10-100   → Specific qti-* elements (interactions, feedback, etc.)
500      → Unsupported qti-* catch-all (shows error UI)
1000     → Generic HTML/XHTML passthrough
```

#### Current Handlers

| Handler | Priority | Purpose |
|---------|----------|---------|
| `choiceInteraction` | 50 | Renders qti-choice-interaction (radio buttons or checkboxes) |
| `extendedTextInteraction` | 50 | Renders qti-extended-text-interaction (multi-line text areas) |
| `textEntryInteraction` | 50 | Renders qti-text-entry-interaction (inline text inputs) |
| `unsupported` | 500 | Catch-all for unknown qti-* elements → shows yellow error box |
| `htmlPassthrough` | 1000 | Standard HTML elements (p, div, etc.) → passes through as-is |

**Future handlers** (to be implemented):
- `qti-feedback-block` (priority ~50)
- `qti-hotspot-interaction` (priority ~50)
- `qti-inline-choice-interaction` (priority ~50)
- etc.

### Handler Interface

Each handler must implement:

```typescript
interface ElementHandler {
  // Check if this handler can process the element
  canHandle(element: Element): boolean;

  // Transform the element into a DocumentFragment
  transform(element: Element, context: TransformContext): DocumentFragment;
}
```

### Adding a New Interaction Handler

To add support for a new QTI interaction:

1. **Create handler file** in `src/transformer/handlers/`:

```typescript
// src/transformer/handlers/choiceInteraction.ts
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

class ChoiceInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-choice-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Create HTML structure for the interaction
    const container = document.createElement('div');
    container.className = 'qti-choice-interaction';

    // Extract attributes
    const responseId = element.getAttribute('response-identifier');
    const maxChoices = element.getAttribute('max-choices');

    // Transform child elements (qti-simple-choice)
    if (context.transformChildren) {
      const choices = context.transformChildren(element);
      container.appendChild(choices);
    }

    fragment.appendChild(container);
    return fragment;
  }
}

// Register with priority 50 (before unsupported catch-all)
registry.register('choice-interaction', new ChoiceInteractionHandler(), 50);
```

2. **Import in handler index**:

```typescript
// src/transformer/handlers/index.ts
import './choiceInteraction';  // Add this line
import './unsupported';
import './htmlPassthrough';
```

3. **Done!** The handler will automatically be used when transforming items.

### Why This Design?

**Extensibility**: Add new interactions one at a time without modifying core code

**Priority-based**: Specific handlers take precedence over generic ones

**Clean separation**: Each interaction is self-contained in its own file

**No allowlists**: QTI item bodies extend XHTML, so HTML elements pass through safely

**Type-safe**: Full TypeScript support with strict mode

## Project Structure

```
src/
├── index.ts                          # Public API exports
├── types.ts                          # Shared type definitions
├── mountItem.ts                      # Main entry point
├── parser/
│   └── xmlParser.ts                  # XML parsing with DOMParser
├── transformer/
│   ├── types.ts                      # Handler interface definitions
│   ├── registry.ts                   # Handler registry system
│   ├── elementTransformer.ts         # Main transformation orchestrator
│   └── handlers/
│       ├── index.ts                  # Handler registration imports
│       ├── htmlPassthrough.ts        # Standard HTML element handler
│       └── unsupported.ts            # Default qti-* error handler
├── renderer/
│   └── domRenderer.ts                # DOM mounting and cleanup
└── errors/
    └── errorDisplay.ts               # Error UI component creation
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

## Future Enhancements

The architecture supports these future additions:

- **Interaction Handlers**: Add support for choice, text entry, hotspot, drag-drop, etc.
- **Response Serialization**: Extract user responses and format for cutie-core
- **State Management**: Pass `AttemptState` through context for conditional feedback
- **Styling**: Replace inline styles with CSS classes and theme support
- **MathML Rendering**: Add handler for MathML with optional MathJax/KaTeX

## License

MIT
