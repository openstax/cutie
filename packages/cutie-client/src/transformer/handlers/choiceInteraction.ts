import {
  createInvalidAttributeError,
  createMissingAttributeError,
} from '../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../errors/validationDisplay';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';
import { getDefaultValue } from './responseUtils';

/**
 * Build constraint text describing the selection requirements.
 * Returns null when no instructional text is needed (e.g., single-select radio).
 */
function buildConstraintText(minChoices: number, maxChoices: number, isSingleSelect: boolean): string | null {
  if (isSingleSelect) {
    return minChoices > 0 ? 'Select an answer.' : null;
  }
  if (minChoices > 0 && maxChoices > 0 && minChoices !== maxChoices) {
    return `Select between ${minChoices} and ${maxChoices} choices.`;
  }
  if (minChoices > 0) {
    return `Select at least ${minChoices} choice${minChoices === 1 ? '' : 's'}.`;
  }
  if (maxChoices > 0) {
    return `Select up to ${maxChoices} choice${maxChoices === 1 ? '' : 's'}.`;
  }
  return null;
}

/**
 * Handler for qti-choice-interaction elements
 * Supports both single-select (max-choices="1") and multi-select (max-choices > 1)
 * Required for Basic level QTI v3 certification
 */
class ChoiceInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-choice-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-choice-interaction')) {
      context.styleManager.addStyle('cutie-choice-interaction', CHOICE_INTERACTION_STYLES);
    }

    // Get required attributes
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      fragment.appendChild(createMissingAttributeError('qti-choice-interaction', 'response-identifier'));
      return fragment;
    }

    const maxChoicesAttr = element.getAttribute('max-choices');
    if (!maxChoicesAttr) {
      fragment.appendChild(createMissingAttributeError('qti-choice-interaction', 'max-choices'));
      return fragment;
    }

    const maxChoices = parseInt(maxChoicesAttr, 10);
    if (isNaN(maxChoices)) {
      fragment.appendChild(createInvalidAttributeError('qti-choice-interaction', 'max-choices', maxChoicesAttr, 'Value must be a number'));
      return fragment;
    }

    // Parse optional min-choices attribute
    const minChoicesAttr = element.getAttribute('min-choices');
    const minChoices = minChoicesAttr ? parseInt(minChoicesAttr, 10) : 0;

    // Determine if this is single-select (radio) or multi-select (checkbox)
    const isSingleSelect = maxChoices === 1;
    const inputType = isSingleSelect ? 'radio' : 'checkbox';
    const inputName = `choice-${responseIdentifier}`;

    // Create container for the interaction
    const container = document.createElement('div');
    container.className = 'cutie-choice-interaction';
    container.setAttribute('data-response-identifier', responseIdentifier);
    container.setAttribute('data-max-choices', maxChoicesAttr);

    // Process children to find prompt and simple-choice elements
    const children = Array.from(element.children);
    const promptElement = children.find(
      (child) => child.tagName.toLowerCase() === 'qti-prompt'
    );
    const choiceElements = children.filter(
      (child) => child.tagName.toLowerCase() === 'qti-simple-choice'
    );

    // Use fieldset for better accessibility (groups related form controls)
    const choicesContainer = document.createElement('fieldset');
    choicesContainer.className = 'cutie-simple-choice-group';

    // Add legend if prompt is present
    if (promptElement && context.transformChildren) {
      const legend = document.createElement('legend');
      legend.className = 'cutie-prompt';
      const promptContent = context.transformChildren(promptElement);
      legend.appendChild(promptContent);
      choicesContainer.appendChild(legend);
    }

    // Process each simple-choice element
    const inputElements: HTMLInputElement[] = [];
    for (const choiceElement of choiceElements) {
      const choiceIdentifier = choiceElement.getAttribute('identifier');
      if (!choiceIdentifier) {
        console.warn('qti-simple-choice missing identifier attribute, skipping');
        continue;
      }

      // Create choice container as a label (makes entire row clickable)
      const choiceLabel = document.createElement('label');
      choiceLabel.className = 'cutie-simple-choice';

      // Create input element
      const input = document.createElement('input');
      input.type = inputType;
      input.name = inputName;
      input.value = choiceIdentifier;
      inputElements.push(input);

      // Create span for choice content
      const contentSpan = document.createElement('span');
      contentSpan.className = 'cutie-simple-choice-content';

      // Transform choice content
      if (context.transformChildren) {
        const choiceContent = context.transformChildren(choiceElement);
        contentSpan.appendChild(choiceContent);
      }

      // Assemble choice (input inside label makes entire area clickable)
      choiceLabel.appendChild(input);
      choiceLabel.appendChild(contentSpan);
      choicesContainer.appendChild(choiceLabel);
    }

    container.appendChild(choicesContainer);

    // Add constraint text if applicable
    let constraint: ConstraintMessage | undefined;
    const constraintText = buildConstraintText(minChoices, maxChoices, isSingleSelect);
    if (constraintText) {
      constraint = createConstraintMessage(
        `constraint-${responseIdentifier}`,
        constraintText,
        context.styleManager,
      );
      container.appendChild(constraint.element);

      // Link fieldset to constraint text for screen readers
      const existingDescribedBy = choicesContainer.getAttribute('aria-describedby');
      choicesContainer.setAttribute(
        'aria-describedby',
        existingDescribedBy
          ? `${existingDescribedBy} ${constraint.element.id}`
          : constraint.element.id
      );
    }

    // Initialize with default value(s) from response declaration if present
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null) {
      const defaultValues = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      for (const input of inputElements) {
        if (defaultValues.includes(input.value)) {
          input.checked = true;
        }
      }
    }

    // Enforce max-choices constraint for multi-select
    if (!isSingleSelect && maxChoices > 0) {
      const enforceMaxChoices = () => {
        const checkedCount = inputElements.filter((input) => input.checked).length;
        if (checkedCount >= maxChoices) {
          // Disable unchecked inputs when max is reached
          inputElements.forEach((input) => {
            if (!input.checked) {
              input.disabled = true;
            }
          });
        } else {
          // Re-enable all inputs when below max (respect interaction enabled state)
          const isEnabled = context.itemState?.interactionsEnabled ?? true;
          inputElements.forEach((input) => {
            input.disabled = !isEnabled;
          });
        }
      };

      inputElements.forEach((input) => {
        input.addEventListener('change', enforceMaxChoices);
      });

      // Apply initial constraint in case default values already hit max
      enforceMaxChoices();
    }

    // Register response accessor with itemState
    if (context.itemState) {
      const getResponse = (): string | string[] | null => {
        const checked = inputElements.filter((input) => input.checked);
        if (checked.length === 0) {
          return null;
        }
        if (isSingleSelect) {
          return checked[0]?.value ?? null;
        } else {
          return checked.map((input) => input.value);
        }
      };

      const accessor = () => {
        const value = getResponse();
        const checkedCount = inputElements.filter((input) => input.checked).length;
        const isValid = minChoices <= 0 || checkedCount >= minChoices;

        if (!isValid) {
          choicesContainer.setAttribute('aria-invalid', 'true');
          constraint?.setError(true);
          return { value, valid: false };
        }

        // Clear error state if previously set
        choicesContainer.removeAttribute('aria-invalid');
        constraint?.setError(false);
        return { value, valid: true };
      };

      context.itemState.registerResponse(responseIdentifier, accessor);

      // Observe interaction enabled state changes
      const updateInteractionState = (state: { interactionsEnabled: boolean }) => {
        const isEnabled = state.interactionsEnabled;
        inputElements.forEach((input) => {
          // For multi-select with max-choices enforcement, check if we're at max
          if (!isSingleSelect && maxChoices > 0 && !input.checked) {
            const checkedCount = inputElements.filter((inp) => inp.checked).length;
            input.disabled = !isEnabled || checkedCount >= maxChoices;
          } else {
            input.disabled = !isEnabled;
          }
        });
      };

      context.itemState.addObserver(updateInteractionState);

      // Set initial state
      updateInteractionState({ interactionsEnabled: context.itemState.interactionsEnabled });
    }

    fragment.appendChild(container);
    return fragment;
  }
}

// Register with priority 50 (after specific handlers, before unsupported catch-all)
registry.register('choice-interaction', new ChoiceInteractionHandler(), 50);

/**
 * CSS styles for choice interaction
 * Uses fieldset/legend for accessible grouping of related form controls
 */
const CHOICE_INTERACTION_STYLES = `
  .cutie-choice-interaction {
    margin: 1em 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .cutie-choice-interaction .cutie-prompt {
    font-weight: 600;
    margin-bottom: 0.75em;
    color: #333;
  }

  .cutie-choice-interaction .cutie-simple-choice-group {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  /* Remove default fieldset styling for clean appearance */
  .cutie-choice-interaction fieldset.cutie-simple-choice-group {
    border: none;
    padding: 0;
    margin: 0;
    min-width: 0;
  }

  .cutie-choice-interaction fieldset.cutie-simple-choice-group legend.cutie-prompt {
    padding: 0;
    margin-bottom: 0.75em;
    font-weight: 600;
    color: #333;
  }

  .cutie-choice-interaction .cutie-simple-choice {
    display: flex;
    align-items: flex-start;
    gap: 0.5em;
    padding: 0.7em 0.5em;
    border: 2px solid var(--cutie-border);
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
  }

  .cutie-choice-interaction .cutie-simple-choice:hover {
    background-color: #f5f5f5;
    border-color: var(--cutie-border-hover);
  }

  /* Selected state — outline mode (border only, no colored background) */
  .cutie-choice-interaction .cutie-simple-choice:has(input:checked) {
    border-color: var(--cutie-primary);
  }

  .cutie-choice-interaction .cutie-simple-choice:has(input:checked):hover {
    border-color: var(--cutie-primary);
  }

  /* Disabled state using :has() */
  .cutie-choice-interaction .cutie-simple-choice:has(input:disabled) {
    background-color: #f5f5f5;
    border-color: var(--cutie-border);
    cursor: not-allowed;
  }

  .cutie-choice-interaction .cutie-simple-choice:has(input:disabled):hover {
    background-color: #f5f5f5;
    border-color: var(--cutie-border);
  }

  .cutie-choice-interaction .cutie-simple-choice input {
    margin-top: 0.25em;
    flex-shrink: 0;
    cursor: pointer;
  }

  /* Hide default focus ring on input since label handles focus styling */
  .cutie-choice-interaction .cutie-simple-choice input:focus {
    outline: none;
  }

  .cutie-choice-interaction .cutie-simple-choice:has(input:disabled) input {
    cursor: not-allowed;
  }

  /* Focus-within styling for keyboard navigation */
  .cutie-choice-interaction .cutie-simple-choice:focus-within {
    outline: 2px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  .cutie-choice-interaction .cutie-simple-choice-content {
    flex: 1;
    cursor: pointer;
    line-height: 1.5;
    font-weight: 600;
  }

  .cutie-choice-interaction .cutie-simple-choice:has(input:disabled) .cutie-simple-choice-content {
    cursor: not-allowed;
  }
`;
