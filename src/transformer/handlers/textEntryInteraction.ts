import { createMissingAttributeError } from '../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createInlineRequiredIndicator,
} from '../../errors/validationDisplay';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';
import { parseInputWidth } from '../vocabUtils';
import { getDefaultValue } from './responseUtils';

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
    if (context.styleManager && !context.styleManager.hasStyle('cutie-text-entry-interaction')) {
      context.styleManager.addStyle('cutie-text-entry-interaction', TEXT_ENTRY_INTERACTION_STYLES);
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

    // Find the response declaration to get base-type
    const responseDeclaration = element.ownerDocument?.querySelector(
      `qti-response-declaration[identifier="${responseIdentifier}"]`
    );
    const baseType = responseDeclaration?.getAttribute('base-type');

    // Create inline text input element
    const input = document.createElement('input');

    if (baseType === 'integer' || baseType === 'float') {
      input.type = 'number';
      input.step = baseType === 'integer' ? '1' : 'any';
    } else {
      input.type = 'text';
    }
    input.className = 'cutie-text-entry-interaction';
    input.id = `input-${responseIdentifier}`;

    // Set placeholder text if provided
    const placeholderText = element.getAttribute('placeholder-text');
    if (placeholderText) {
      input.placeholder = placeholderText;
    }

    // Set data attribute for identification
    input.dataset.responseIdentifier = responseIdentifier;

    // Width precedence: qti-input-width-N > expected-length > default 10ch
    const inputWidth = parseInputWidth(element);
    if (inputWidth !== null) {
      input.style.width = `${inputWidth + 2}ch`;
    } else {
      const expectedLength = element.getAttribute('expected-length');
      if (expectedLength) {
        const length = parseInt(expectedLength, 10);
        if (!isNaN(length) && length > 0) {
          input.style.width = `${length + 2}ch`;
        }
      } else {
        input.style.width = '10ch';
      }
    }

    // Initialize with default value from response declaration if present
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null && typeof defaultValue === 'string') {
      input.value = defaultValue;
    }

    // Read pattern-mask constraint
    const patternMask = element.getAttribute('pattern-mask');
    const patternMessage = element.getAttribute('data-patternmask-message');
    const hasConstraint = patternMask !== null;

    // Add inline indicator if pattern-mask is present
    let indicator: ConstraintMessage | undefined;
    if (hasConstraint) {
      const constraintId = `constraint-${responseIdentifier}`;
      indicator = createInlineRequiredIndicator(
        constraintId,
        patternMessage ?? 'Required format',
        context.styleManager,
      );
      input.setAttribute('aria-describedby', constraintId);
    }

    // Register response accessor with itemState if available
    if (context.itemState) {
      const responseAccessor = () => {
        const value = input.value.trim();

        if (hasConstraint) {
          const isValid = new RegExp(patternMask).test(input.value);

          if (!isValid) {
            input.setAttribute('aria-invalid', 'true');
            indicator?.setError(true);
            return { value: value === '' ? null : value, valid: false };
          }

          input.removeAttribute('aria-invalid');
          indicator?.setError(false);
        }

        return { value: value === '' ? null : value, valid: true };
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
    if (indicator) {
      fragment.appendChild(indicator.element);
    }

    return fragment;
  }
}

const TEXT_ENTRY_INTERACTION_STYLES = `
  .cutie-text-entry-interaction {
    display: inline-block;
    margin: 0 0.25em;
    padding: 0.25em 0.5em;
    border: 1px solid var(--cutie-border);
    border-radius: 3px;
    font-size: inherit;
    font-family: inherit;
    vertical-align: baseline;
  }

  .cutie-text-entry-interaction:focus {
    outline: 2px solid var(--cutie-primary);
    outline-offset: 1px;
    border-color: var(--cutie-primary);
  }

  .cutie-text-entry-interaction:disabled {
    background-color: var(--cutie-bg-alt);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .cutie-text-entry-interaction:disabled:focus {
    outline: none;
  }
`;

// Register with priority 50 (before unsupported catch-all at 500)
registry.register('text-entry-interaction', new TextEntryInteractionHandler(), 50);
