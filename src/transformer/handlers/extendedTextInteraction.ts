import { createMissingAttributeError } from '../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../errors/validationDisplay';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';
import { getDefaultValue } from './responseUtils';

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
    const container = document.createElement('div');
    container.className = 'cutie-extended-text-interaction';
    container.setAttribute('data-response-identifier', responseIdentifier);

    // Process qti-prompt if present
    const promptElement = element.querySelector('qti-prompt');
    const promptId = `prompt-${responseIdentifier}`;
    if (promptElement && context.transformChildren) {
      const promptContainer = document.createElement('div');
      promptContainer.className = 'cutie-prompt';
      promptContainer.id = promptId;
      const promptFragment = context.transformChildren(promptElement);
      promptContainer.appendChild(promptFragment);
      container.appendChild(promptContainer);
    }

    // Create textarea for response input
    const textarea = document.createElement('textarea');
    textarea.className = 'cutie-extended-text-response';
    if (promptElement) {
      textarea.setAttribute('aria-labelledby', promptId);
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

    // Parse optional min-strings attribute
    const minStrings = parseInt(element.getAttribute('min-strings') ?? '0', 10) || 0;

    // Add constraint message if min-strings > 0
    let constraint: ConstraintMessage | undefined;
    if (minStrings > 0) {
      const constraintText = minStrings === 1
        ? 'Enter a response.'
        : `Enter at least ${minStrings} responses.`;
      constraint = createConstraintMessage(
        `constraint-${responseIdentifier}`,
        constraintText,
        context.styleManager,
      );
      container.appendChild(constraint.element);

      const existingDescribedBy = textarea.getAttribute('aria-describedby');
      textarea.setAttribute(
        'aria-describedby',
        existingDescribedBy
          ? `${existingDescribedBy} ${constraint.element.id}`
          : constraint.element.id
      );
    }

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, () => {
        const value = textarea.value.trim();
        const isValid = minStrings <= 0 || value.length > 0;

        if (!isValid) {
          textarea.setAttribute('aria-invalid', 'true');
          constraint?.setError(true);
          return { value: value === '' ? null : value, valid: false };
        }

        textarea.removeAttribute('aria-invalid');
        constraint?.setError(false);
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
`.trim();

// Register with priority 50 (after specific handlers, before unsupported catch-all at 500)
registry.register('extended-text-interaction', new ExtendedTextInteractionHandler(), 50);
