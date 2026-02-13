import { createMissingAttributeError } from '../../../errors/errorDisplay';
import { registry } from '../../registry';
import type { ElementHandler, TransformContext } from '../../types';
import { getDefaultValue } from '../responseUtils';
import {
  createConstraintElements,
  createInteractionContainer,
  parseConstraints,
  processPrompt,
  wireConstraintDescribedBy,
} from './utils';

/**
 * Handler for qti-extended-text-interaction elements
 * Provides a multi-line text input area for learner responses
 *
 * QTI 3.0 Spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.w9vq14kyjxpy
 *
 * Supports:
 * - response-identifier attribute (required) - identifies the response variable
 * - qti-prompt child element (optional) - provides instructions to the learner
 * - Multi-line textarea for text input
 *
 * Basic level certification requirements:
 * - Can ignore sizing hints (expected-length, expected-lines)
 * - Can ignore validation attributes (pattern-mask)
 * - Can treat all formats as plain text
 */
class ExtendedTextInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-extended-text-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Get required response-identifier attribute
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      console.error('qti-extended-text-interaction missing required response-identifier attribute');
      fragment.appendChild(
        createMissingAttributeError('qti-extended-text-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-extended-text-interaction')) {
      context.styleManager.addStyle('cutie-extended-text-interaction', EXTENDED_TEXT_INTERACTION_STYLES);
    }

    // Create container for the interaction
    const container = createInteractionContainer(element, 'cutie-extended-text-interaction', responseIdentifier);

    // Process qti-prompt if present
    const prompt = processPrompt(element, responseIdentifier, context);
    if (prompt) {
      container.appendChild(prompt.element);
    }

    // Create textarea for response input
    const textarea = document.createElement('textarea');
    textarea.className = 'cutie-extended-text-response';
    if (prompt) {
      textarea.setAttribute('aria-labelledby', prompt.id);
    } else {
      textarea.setAttribute('aria-label', 'Response input');
    }
    textarea.setAttribute('data-response-identifier', responseIdentifier);

    // Set placeholder text if provided
    const placeholderText = element.getAttribute('placeholder-text');
    if (placeholderText) {
      textarea.placeholder = placeholderText;
    }

    // Optional: Use expected-lines hint for sizing if provided
    const expectedLines = element.getAttribute('expected-lines');
    if (expectedLines) {
      const lines = parseInt(expectedLines, 10);
      if (!isNaN(lines) && lines > 0) {
        textarea.style.minHeight = `${Math.max(lines * 1.4, 3)}em`;
      }
    }

    // Initialize with default value from response declaration if present
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null && typeof defaultValue === 'string') {
      textarea.value = defaultValue;
    }

    container.appendChild(textarea);

    // Parse and create constraint elements
    const constraints = parseConstraints(element);
    const constraintResult = createConstraintElements(constraints, responseIdentifier, context.styleManager);

    if (constraintResult) {
      container.appendChild(constraintResult.constraint.element);
      wireConstraintDescribedBy(textarea, constraintResult.constraint.element);
    }

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, () => {
        const value = textarea.value.trim();

        // Min-strings check: empty input when required
        if (constraints.minStrings > 0 && value.length === 0) {
          textarea.setAttribute('aria-invalid', 'true');
          if (constraintResult?.minStringsText) {
            constraintResult.constraint.setText(constraintResult.minStringsText);
          }
          constraintResult?.constraint.setError(true);
          return { value: null, valid: false };
        }

        // Pattern-mask check: non-empty but wrong format
        if (constraints.patternMask && !new RegExp(constraints.patternMask).test(textarea.value)) {
          textarea.setAttribute('aria-invalid', 'true');
          if (constraintResult?.patternText) {
            constraintResult.constraint.setText(constraintResult.patternText);
          }
          constraintResult?.constraint.setError(true);
          return { value: value === '' ? null : value, valid: false };
        }

        textarea.removeAttribute('aria-invalid');
        constraintResult?.constraint.setError(false);
        return { value: value === '' ? null : value, valid: true };
      });

      // Observe interaction state changes to enable/disable textarea
      context.itemState.addObserver((state) => {
        textarea.disabled = !state.interactionsEnabled;
      });

      // Set initial disabled state
      textarea.disabled = !context.itemState.interactionsEnabled;
    }

    fragment.appendChild(container);
    return fragment;
  }
}

const EXTENDED_TEXT_INTERACTION_STYLES = `
.cutie-extended-text-interaction {
  display: block;
  margin: 8px 0;
}

.cutie-extended-text-interaction .cutie-prompt {
  margin-bottom: 8px;
}

.cutie-extended-text-interaction textarea {
  width: 100%;
  min-height: 7.5em;
  padding: 8px;
  font-size: 1.6rem;
  font-family: inherit;
  border: 1px solid var(--cutie-border);
  border-radius: 4px;
  resize: vertical;
  box-sizing: border-box;
}

.cutie-extended-text-interaction textarea:focus {
  outline: 2px solid var(--cutie-primary);
  outline-offset: 1px;
  border-color: var(--cutie-primary);
}

.cutie-extended-text-interaction textarea:disabled {
  background-color: var(--cutie-bg-alt);
  cursor: not-allowed;
  opacity: 0.6;
}

.cutie-extended-text-interaction textarea:disabled:focus {
  outline: none;
}

.cutie-extended-text-interaction.qti-height-lines-3 textarea { min-height: 4.2em; }
.cutie-extended-text-interaction.qti-height-lines-6 textarea { min-height: 8.4em; }
.cutie-extended-text-interaction.qti-height-lines-15 textarea { min-height: 21em; }
`.trim();

// Register with priority 50 (after specific handlers, before unsupported catch-all at 500)
registry.register('extended-text-interaction', new ExtendedTextInteractionHandler(), 50);
