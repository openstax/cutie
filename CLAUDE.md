<!-- spell-checker: ignore typecheck hotspots -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Cutie is an implementation of the QTIv3 standard for displaying and scoring QTI Assessment Items.

QTI Documentation: https://www.imsglobal.org/spec/qti/v3p0/impl

### Architecture

The architecture separates response and template processing from the presentational layer using purely stateless and asynchronous functions. This design allows item definitions to be processed securely in a backend environment without exposing them to the interface.

**Key concepts:**
- **Template processing** (server-side): Takes the item definition and current state, produces sanitized QTI XML with:
  - Template variables resolved to their current values
  - Conditional visibility applied based on state
  - Sensitive content stripped (response processing rules, correct answers, hidden feedback, variable declarations)
  - Only presentation-ready content that is safe to expose to the client
- **Response processing** (server-side): A reducer function that accepts current state, item definition, and response submission, then produces a new state
- **Learner state**: A serializable object (`AttemptState`) representing a learner's attempt at an item, containing opaque variables and standardized completion status
- **Client rendering**: Client-side library parses sanitized QTI XML and converts it to HTML, wiring up interaction handlers and serializing responses back to QTI format

**Benefits of XML intermediate format:**
- Platform flexibility for alternative renderers (native mobile, PDF generation, accessibility tools)
- Cleaner security model where server acts as a content filter
- Better testability and separation of concerns

### CI and Quality Checks

```bash
# Run all CI checks (build + lint + typecheck + spelling)
# AVOID doing this, PREFER running checks for the individual package you're working in.
yarn ci

# Individual package CI checks
yarn workspace @openstax/cutie-core ci
yarn workspace @openstax/cutie-client ci
yarn workspace @openstax/cutie-editor ci
yarn workspace @openstax/cutie-example ci

# Linting
yarn workspace @openstax/cutie-core ci:lint
yarn workspace @openstax/cutie-client ci:lint
yarn workspace @openstax/cutie-editor ci:lint
yarn workspace @openstax/cutie-example ci:lint

# Type checking
yarn workspace @openstax/cutie-core ci:typecheck
yarn workspace @openstax/cutie-client ci:typecheck
yarn workspace @openstax/cutie-editor ci:typecheck
yarn workspace @openstax/cutie-example ci:typecheck

# Spell checking (root level)
yarn ci:spelling

# Check package version consistency
yarn ci:versions
```

## Repository Structure

- **`packages/cutie-core/`**: Server-side QTI processing engine (`@openstax/cutie-core`)
  - Template processing: sanitizes and resolves QTI XML
  - Response processing: scores responses and updates state
  - Dual module format: ESM and CJS
  - TypeScript with strict mode enabled
- **`packages/cutie-client/`**: Client-side rendering library (`@openstax/cutie-client`)
  - Parses sanitized QTI XML and converts to HTML
  - Priority-based handler registry system for extensibility
  - Interaction handlers (currently: error placeholders for unsupported elements)
  - Will serialize user responses to QTI format (future)
  - Dual module format: ESM and CJS
  - TypeScript with strict mode enabled
- **`packages/cutie-example/`**: Example application demonstrating the full stack
  - Vite + React application
  - Shows cutie-core template processing and cutie-client rendering
  - Useful for testing and development
- **`scripts/`**: Build and publishing automation scripts
- **`.github/workflows/`**: CI workflows for lint, tests, and deployment

## cutie-client Architecture

### Handler Registry System

The cutie-client uses a **priority-based handler registry** for processing QTI elements. This design allows interaction support to be added incrementally without modifying core code.

**How it works:**
1. Each handler registers with a priority number (lower = higher priority)
2. When transforming an element, the first matching handler is used
3. Handlers are checked in priority order

**Priority tiers:**
- **10-100**: Specific qti-* elements (interactions, feedback, etc.)
- **500**: Unsupported qti-* catch-all (shows error UI)
- **1000**: Generic HTML/XHTML passthrough

**To add a new interaction handler:**
1. Create handler file in `packages/cutie-client/src/transformer/handlers/`
2. Implement `ElementHandler` interface:
   - `canHandle(element)`: Return true if this handler should process the element
   - `transform(element, context)`: Transform element to DocumentFragment
3. Register with appropriate priority (typically 10-100 for interactions)
4. Import in `packages/cutie-client/src/transformer/handlers/index.ts`

**Example:**
```typescript
// packages/cutie-client/src/transformer/handlers/choiceInteraction.ts
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

class ChoiceInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-choice-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();
    // Build HTML structure for choice interaction
    // Use context.transformChildren(element) to recursively transform children
    return fragment;
  }
}

registry.register('choice-interaction', new ChoiceInteractionHandler(), 50);
```
