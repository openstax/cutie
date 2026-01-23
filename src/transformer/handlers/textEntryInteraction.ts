import { createMissingAttributeError } from '../../errors/errorDisplay';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

/**
 * Handler for qti-text-entry-interaction elements.
 * Renders an inline text input for single-line text entry within surrounding content.
 *
 * QTI Spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.qtitextentryinteraction
 *
 * Requirements (Basic level certification):
 * - MUST support response-identifier attribute (required)
 * - MUST provide single-line inline text input
 * - MUST maintain inline flow within surrounding content
 * - MUST capture text entered by user and emit response events
 * - MUST allow candidate to review their input in context
 * - MAY ignore sizing hints like expected-length (optional)
 * - MAY ignore validation attributes like pattern-mask (optional)
 */
class TextEntryInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-text-entry-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('qti-text-entry-interaction')) {
      context.styleManager.addStyle('qti-text-entry-interaction', `
        .qti-text-entry-interaction {
          display: inline-block;
          margin: 0 0.25em;
          padding: 0.25em 0.5em;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-size: inherit;
          font-family: inherit;
          vertical-align: baseline;
        }

        .qti-text-entry-interaction:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.6;
        }
      `);
    }

    // Extract required response-identifier attribute
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      console.error(
        'qti-text-entry-interaction missing required response-identifier attribute'
      );
      fragment.appendChild(
        createMissingAttributeError('qti-text-entry-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Create inline text input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'qti-text-entry-interaction';

    // Set data attribute for identification
    input.dataset.responseIdentifier = responseIdentifier;

    // Optional: Use expected-length as a sizing hint (not required for Basic level)
    const expectedLength = element.getAttribute('expected-length');
    if (expectedLength) {
      const length = parseInt(expectedLength, 10);
      if (!isNaN(length) && length > 0) {
        // Use expected-length to set approximate width (1ch per character + padding)
        input.style.width = `${length + 2}ch`;
      }
    } else {
      // Default width if no expected-length provided
      input.style.width = '10ch';
    }

    // Register response accessor with itemState if available
    if (context.itemState) {
      const responseAccessor = () => {
        const value = input.value.trim();
        // Return empty string as null to match QTI convention for no response
        return value === '' ? null : value;
      };

      context.itemState.registerResponse(responseIdentifier, responseAccessor);

      // Observe interaction enabled state to enable/disable input
      const observer = (state: { interactionsEnabled: boolean }) => {
        input.disabled = !state.interactionsEnabled;
      };

      context.itemState.addObserver(observer);

      // Set initial disabled state
      input.disabled = !context.itemState.interactionsEnabled;
    }

    fragment.appendChild(input);
    return fragment;
  }
}

// Register with priority 50 (before unsupported catch-all at 500)
registry.register('text-entry-interaction', new TextEntryInteractionHandler(), 50);
