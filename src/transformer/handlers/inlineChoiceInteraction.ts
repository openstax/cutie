import { createMissingAttributeError } from '../../errors/errorDisplay';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';
import { getDefaultValue } from './responseUtils';

/**
 * Handler for qti-inline-choice-interaction elements.
 * Renders an inline dropdown/select for filling gaps in text passages.
 *
 * QTI Spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.qtiinlinechoiceinteraction
 *
 * Requirements (Basic level certification):
 * - MUST support response-identifier attribute (required)
 * - MUST provide inline select/dropdown with choices
 * - MUST maintain inline flow within surrounding content
 * - MUST capture selected choice identifier and emit response events
 * - MAY support shuffle attribute to randomize choice order
 * - MAY support fixed attribute on choices to prevent shuffling
 */
class InlineChoiceInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-inline-choice-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (
      context.styleManager &&
      !context.styleManager.hasStyle('cutie-inline-choice-interaction')
    ) {
      context.styleManager.addStyle(
        'cutie-inline-choice-interaction',
        INLINE_CHOICE_INTERACTION_STYLES
      );
    }

    // Extract required response-identifier attribute
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      console.error(
        'qti-inline-choice-interaction missing required response-identifier attribute'
      );
      fragment.appendChild(
        createMissingAttributeError(
          'qti-inline-choice-interaction',
          'response-identifier'
        )
      );
      return fragment;
    }

    // Create select element
    const select = document.createElement('select');
    select.className = 'cutie-inline-choice-interaction';
    select.dataset.responseIdentifier = responseIdentifier;

    // Collect choices from qti-inline-choice children
    const choiceElements = Array.from(element.children).filter(
      (child) => child.tagName.toLowerCase() === 'qti-inline-choice'
    );

    // Add placeholder option for initial unselected state
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '';
    select.appendChild(placeholder);

    // Create option elements from pre-shuffled choices (order comes from server via renderTemplate)
    for (const choiceElement of choiceElements) {
      const identifier = choiceElement.getAttribute('identifier');
      if (!identifier) {
        console.warn('qti-inline-choice missing identifier attribute, skipping');
        continue;
      }

      const option = document.createElement('option');
      option.value = identifier;
      option.textContent = choiceElement.textContent ?? '';
      select.appendChild(option);
    }

    // Initialize with default value from response declaration if present
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null && typeof defaultValue === 'string') {
      select.value = defaultValue;
    }

    // Register response accessor with itemState if available
    if (context.itemState) {
      const responseAccessor = () => {
        const value = select.value;
        // Return null if no selection or empty value
        return { value: value === '' ? null : value, valid: true };
      };

      context.itemState.registerResponse(responseIdentifier, responseAccessor);

      // Observe interaction enabled state to enable/disable select
      const observer = (state: { interactionsEnabled: boolean }) => {
        select.disabled = !state.interactionsEnabled;
      };

      context.itemState.addObserver(observer);

      // Set initial disabled state
      select.disabled = !context.itemState.interactionsEnabled;
    }

    fragment.appendChild(select);
    return fragment;
  }
}

const INLINE_CHOICE_INTERACTION_STYLES = `
  .cutie-inline-choice-interaction {
    display: inline-block;
    margin: 0 0.25em;
    padding: 0.25em 0.5em;
    border: 1px solid var(--cutie-border);
    border-radius: 3px;
    font-size: inherit;
    font-family: inherit;
    vertical-align: baseline;
    background-color: #fff;
    cursor: pointer;
    min-width: 8ch;
  }

  .cutie-inline-choice-interaction:focus {
    outline: 2px solid var(--cutie-primary);
    outline-offset: 1px;
    border-color: var(--cutie-primary);
  }

  .cutie-inline-choice-interaction:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Register with priority 50 (before unsupported catch-all at 500)
registry.register(
  'inline-choice-interaction',
  new InlineChoiceInteractionHandler(),
  50
);
