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
yarn ci

# Individual package CI checks
yarn workspace @openstax/cutie-core ci
yarn workspace @openstax/cutie-client ci

# Linting
yarn workspace @openstax/cutie-core ci:lint
yarn workspace @openstax/cutie-client ci:lint

# Type checking
yarn workspace @openstax/cutie-core ci:typecheck
yarn workspace @openstax/cutie-client ci:typecheck

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
  - Provides interaction handlers (drag/drop, drawing, hotspots, etc.)
  - Serializes user responses to QTI format
  - Dual module format: ESM and CJS
  - TypeScript with strict mode enabled
- **`scripts/`**: Build and publishing automation scripts
- **`.github/workflows/`**: CI workflows for lint, tests, and deployment
