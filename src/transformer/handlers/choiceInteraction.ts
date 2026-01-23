import {
  createInvalidAttributeError,
  createMissingAttributeError,
} from '../../errors/errorDisplay';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

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
    if (context.styleManager && !context.styleManager.hasStyle('qti-choice-interaction')) {
      context.styleManager.addStyle('qti-choice-interaction', `
        .qti-choice-interaction {
          margin: 1em 0;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .qti-choice-interaction .qti-prompt {
          font-weight: 600;
          margin-bottom: 0.75em;
          color: #333;
        }

        .qti-choice-interaction .qti-simple-choice-group {
          display: flex;
          flex-direction: column;
          gap: 0.5em;
        }

        .qti-choice-interaction .qti-simple-choice {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
          padding: 0.5em;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #fff;
          cursor: pointer;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .qti-choice-interaction .qti-simple-choice:hover {
          background-color: #f5f5f5;
          border-color: #bbb;
        }

        /* Selected state using :has() */
        .qti-choice-interaction .qti-simple-choice:has(input:checked) {
          background-color: #e3f2fd;
          border-color: #2196f3;
        }

        .qti-choice-interaction .qti-simple-choice:has(input:checked):hover {
          background-color: #e3f2fd;
          border-color: #2196f3;
        }

        /* Disabled state using :has() */
        .qti-choice-interaction .qti-simple-choice:has(input:disabled) {
          background-color: #f5f5f5;
          border-color: #ddd;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .qti-choice-interaction .qti-simple-choice:has(input:disabled):hover {
          background-color: #f5f5f5;
          border-color: #ddd;
        }

        .qti-choice-interaction .qti-simple-choice input {
          margin-top: 0.25em;
          cursor: pointer;
        }

        .qti-choice-interaction .qti-simple-choice:has(input:disabled) input {
          cursor: not-allowed;
        }

        .qti-choice-interaction .qti-simple-choice label {
          flex: 1;
          cursor: pointer;
          line-height: 1.5;
        }

        .qti-choice-interaction .qti-simple-choice:has(input:disabled) label {
          cursor: not-allowed;
        }
      `);
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

    // Determine if this is single-select (radio) or multi-select (checkbox)
    const isSingleSelect = maxChoices === 1;
    const inputType = isSingleSelect ? 'radio' : 'checkbox';
    const inputName = `choice-${responseIdentifier}`;

    // Create container for the interaction
    const container = document.createElement('div');
    container.className = 'qti-choice-interaction';
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

    // Add prompt if present
    if (promptElement && context.transformChildren) {
      const promptDiv = document.createElement('div');
      promptDiv.className = 'qti-prompt';
      const promptContent = context.transformChildren(promptElement);
      promptDiv.appendChild(promptContent);
      container.appendChild(promptDiv);
    }

    // Create choices container
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'qti-simple-choice-group';

    // Process each simple-choice element
    const inputElements: HTMLInputElement[] = [];
    for (const choiceElement of choiceElements) {
      const choiceIdentifier = choiceElement.getAttribute('identifier');
      if (!choiceIdentifier) {
        console.warn('qti-simple-choice missing identifier attribute, skipping');
        continue;
      }

      // Create choice container
      const choiceDiv = document.createElement('div');
      choiceDiv.className = 'qti-simple-choice';

      // Create input element
      const input = document.createElement('input');
      input.type = inputType;
      input.name = inputName;
      input.value = choiceIdentifier;
      input.id = `${inputName}-${choiceIdentifier}`;
      inputElements.push(input);

      // Create label
      const label = document.createElement('label');
      label.htmlFor = input.id;

      // Transform choice content
      if (context.transformChildren) {
        const choiceContent = context.transformChildren(choiceElement);
        label.appendChild(choiceContent);
      }

      // Assemble choice
      choiceDiv.appendChild(input);
      choiceDiv.appendChild(label);
      choicesContainer.appendChild(choiceDiv);
    }

    container.appendChild(choicesContainer);

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
    }

    // Register response accessor with itemState
    if (context.itemState) {
      const getResponse = (): string | string[] | null => {
        const checked = inputElements.filter((input) => input.checked);
        if (checked.length === 0) {
          return null;
        }
        if (isSingleSelect) {
          // For single-select, return single identifier string
          return checked[0]?.value ?? null;
        } else {
          // For multi-select, return array of identifiers
          return checked.map((input) => input.value);
        }
      };

      context.itemState.registerResponse(responseIdentifier, getResponse);

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
