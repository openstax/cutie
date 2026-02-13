/* spell-checker: ignore bqti */
import { createMissingAttributeError } from '../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createInlineRequiredIndicator,
} from '../../errors/validationDisplay';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';
import { getDefaultValue } from './responseUtils';

function parseInputWidth(element: Element): number | null {
  const match = element.getAttribute('class')?.match(/\bqti-input-width-(\d+)\b/);
  if (!match) return null;
  const width = parseInt(match[1], 10);
  return isNaN(width) || width <= 0 ? null : width;
}

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

    const inputWidth = parseInputWidth(element);
    if (inputWidth !== null) {
      select.style.width = `${inputWidth + 4}ch`;
      select.style.minWidth = '0';
    }

    // Collect choices from qti-inline-choice children
    const choiceElements = Array.from(element.children).filter(
      (child) => child.tagName.toLowerCase() === 'qti-inline-choice'
    );

    // Add placeholder option for initial unselected state
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = element.getAttribute('data-prompt') ?? 'Select\u2026';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.hidden = true;
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

    // Determine if constrained: required="true" or min-choices >= 1
    const requiredAttr = element.getAttribute('required');
    const minChoices = parseInt(element.getAttribute('min-choices') ?? '0', 10) || 0;
    const isConstrained = requiredAttr === 'true' || minChoices >= 1;

    // Add inline indicator if constrained
    let indicator: ConstraintMessage | undefined;
    if (isConstrained) {
      select.setAttribute('aria-required', 'true');

      const customMessage = element.getAttribute('data-min-selections-message');
      const constraintId = `constraint-${responseIdentifier}`;
      indicator = createInlineRequiredIndicator(
        constraintId,
        customMessage ?? 'Selection required',
        context.styleManager,
      );
      select.setAttribute('aria-describedby', constraintId);
    }

    // Register response accessor with itemState if available
    if (context.itemState) {
      const responseAccessor = () => {
        const value = select.value;
        const isValid = !isConstrained || value !== '';

        if (!isValid) {
          select.setAttribute('aria-invalid', 'true');
          indicator?.setError(true);
          return { value: null, valid: false };
        }

        select.removeAttribute('aria-invalid');
        indicator?.setError(false);
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
    if (indicator) {
      fragment.appendChild(indicator.element);
    }

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
    background-color: var(--cutie-bg);
    cursor: pointer;
    min-width: 8ch;
  }

  .cutie-inline-choice-interaction:focus {
    outline: 2px solid var(--cutie-primary);
    outline-offset: 1px;
    border-color: var(--cutie-primary);
  }

  .cutie-inline-choice-interaction:disabled {
    background-color: var(--cutie-bg-alt);
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
