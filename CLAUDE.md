# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Cutie is an implementation of the QTIv3 standard for displaying and scoring QTI Assessment Items.

QTI Documentation: https://www.imsglobal.org/spec/qti/v3p0/impl

### Architecture

The architecture separates response and template processing from the presentational layer using purely stateless and asynchronous functions. This design allows item definitions to be processed securely in a backend environment without exposing them to the interface.

**Key concepts:**
- **Template processing**: Takes the item definition and current state, produces HTML snippets for frontend rendering
- **Response processing**: A reducer function that accepts current state, item definition, and response submission, then produces a new state
- **Learner state**: A serializable object representing a learner's attempt at an item

### CI and Quality Checks

```bash
# Run all CI checks (build + lint + typecheck + spelling)
yarn ci

# Individual package CI checks
yarn workspace @openstax/cutie ci

# Linting
yarn workspace @openstax/cutie ci:lint

# Type checking
yarn workspace @openstax/cutie ci:typecheck

# Spell checking (root level)
yarn ci:spelling

# Check package version consistency
yarn ci:versions
```

## Repository Structure

- **`packages/cutie/`**: Main QTI implementation package (`@openstax/cutie`)
  - Dual module format: ESM and CJS
  - TypeScript with strict mode enabled
- **`scripts/`**: Build and publishing automation scripts
- **`.github/workflows/`**: CI workflows for lint, tests, and deployment
