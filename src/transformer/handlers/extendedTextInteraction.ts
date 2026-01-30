import { createMissingAttributeError } from '../../errors/errorDisplay';
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
    if (context.styleManager && !context.styleManager.hasStyle('qti-extended-text-interaction')) {
      context.styleManager.addStyle('qti-extended-text-interaction', EXTENDED_TEXT_INTERACTION_STYLES);
    }

    // Create container for the interaction
    const container = document.createElement('div');
    container.className = 'qti-extended-text-interaction';
    container.setAttribute('data-response-identifier', responseIdentifier);

    // Process qti-prompt if present
    const promptElement = element.querySelector('qti-prompt');
    if (promptElement && context.transformChildren) {
      const promptContainer = document.createElement('div');
      promptContainer.className = 'qti-prompt';
      const promptFragment = context.transformChildren(promptElement);
      promptContainer.appendChild(promptFragment);
      container.appendChild(promptContainer);
    }

    // Create textarea for response input
    const textarea = document.createElement('textarea');
    textarea.className = 'qti-extended-text-response';
    textarea.setAttribute('aria-label', 'Response input');
    textarea.setAttribute('data-response-identifier', responseIdentifier);

    // Optional: Use expected-lines hint for sizing if provided
    const expectedLines = element.getAttribute('expected-lines');
    if (expectedLines) {
      const lines = parseInt(expectedLines, 10);
      if (!isNaN(lines) && lines > 0) {
        // Approximate height based on line count (roughly 20px per line)
        textarea.style.minHeight = `${Math.max(lines * 20, 60)}px`;
      }
    }

    // Initialize with default value from response declaration if present
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null && typeof defaultValue === 'string') {
      textarea.value = defaultValue;
    }

    container.appendChild(textarea);

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, () => {
        const value = textarea.value.trim();
        return value === '' ? null : value;
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
.qti-extended-text-interaction {
  display: block;
  margin: 8px 0;
}

.qti-extended-text-interaction .qti-prompt {
  margin-bottom: 8px;
}

.qti-extended-text-interaction textarea {
  width: 100%;
  min-height: 120px;
  padding: 8px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  box-sizing: border-box;
}

.qti-extended-text-interaction textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}
`.trim();

// Register with priority 50 (after specific handlers, before unsupported catch-all at 500)
registry.register('extended-text-interaction', new ExtendedTextInteractionHandler(), 50);
