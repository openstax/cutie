import { createMissingAttributeError } from '../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../errors/validationDisplay';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';
import { loadMathLive } from './mathFieldLoader';
import { getDefaultValue } from './responseUtils';

/**
 * Check if a response declaration is a formula type
 */
function isFormulaResponse(doc: Document | null, responseIdentifier: string): boolean {
  if (!doc) return false;

  const responseDeclaration = doc.querySelector(
    `qti-response-declaration[identifier="${responseIdentifier}"]`
  );
  if (!responseDeclaration) return false;

  return responseDeclaration.getAttribute('data-response-type') === 'formula';
}

/**
 * Handler for qti-extended-text-interaction elements with formula response type
 *
 * Detects formula responses via data-response-type="formula" on the response
 * declaration and renders a MathLive math-field instead of a textarea.
 *
 * Loads MathLive asynchronously to avoid bundling it with the main bundle.
 */
class FormulaInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    if (element.tagName.toLowerCase() !== 'qti-extended-text-interaction') {
      return false;
    }

    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) return false;

    return isFormulaResponse(element.ownerDocument, responseIdentifier);
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      console.error('qti-extended-text-interaction missing required response-identifier attribute');
      fragment.appendChild(
        createMissingAttributeError('qti-extended-text-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-formula-interaction')) {
      context.styleManager.addStyle('cutie-formula-interaction', FORMULA_INTERACTION_STYLES);
    }

    // Create container for the interaction
    const container = document.createElement('div');
    container.className = 'cutie-formula-interaction';
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

    // Create a wrapper for the math field
    const mathFieldWrapper = document.createElement('div');
    mathFieldWrapper.className = 'cutie-formula-field-wrapper';

    // Create loading placeholder
    const loadingPlaceholder = document.createElement('div');
    loadingPlaceholder.className = 'cutie-formula-loading';
    loadingPlaceholder.textContent = 'Loading math input...';
    mathFieldWrapper.appendChild(loadingPlaceholder);

    container.appendChild(mathFieldWrapper);

    // Parse optional min-strings attribute
    const minStrings = parseInt(element.getAttribute('min-strings') ?? '0', 10) || 0;

    // Read extended-text attributes
    const placeholderText = element.getAttribute('placeholder-text')
      ?? 'Enter LaTeX formula (e.g., 5x or \\frac{1}{2})';
    const expectedLines = element.getAttribute('expected-lines');

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
    }

    fragment.appendChild(container);

    // Get default value
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    const initialValue = typeof defaultValue === 'string' ? defaultValue : '';

    // Track current value for response accessor
    let currentValue = initialValue;

    // Track active input element for aria-describedby/aria-invalid
    let activeInputElement: HTMLElement | null = null;

    // Register response accessor immediately (returns current value)
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, () => {
        const trimmed = currentValue.trim();
        const isValid = minStrings <= 0 || trimmed.length > 0;

        if (!isValid) {
          activeInputElement?.setAttribute('aria-invalid', 'true');
          constraint?.setError(true);
          return { value: trimmed === '' ? null : trimmed, valid: false };
        }

        activeInputElement?.removeAttribute('aria-invalid');
        constraint?.setError(false);
        return { value: trimmed === '' ? null : trimmed, valid: true };
      });
    }

    // Load MathLive asynchronously and create math-field
    loadMathLive()
      .then((mathlive) => {
        // Remove loading placeholder
        loadingPlaceholder.remove();

        // Create math-field element
        const mathField = document.createElement('math-field') as HTMLElement & {
          value: string;
          disabled: boolean;
        };
        mathField.className = 'cutie-formula-field';
        mathField.setAttribute('data-response-identifier', responseIdentifier);
        if (promptElement) {
          mathField.setAttribute('aria-labelledby', promptId);
        } else {
          mathField.setAttribute('aria-label', 'Formula input');
        }

        mathField.setAttribute('placeholder', placeholderText);

        // Set initial value
        if (initialValue) {
          mathField.value = initialValue;
          currentValue = initialValue;
        }

        // Listen for input events to update current value
        mathField.addEventListener('input', () => {
          currentValue = mathField.value;
        });

        // Handle interaction state
        if (context.itemState) {
          context.itemState.addObserver((state) => {
            mathField.disabled = !state.interactionsEnabled;
          });
          mathField.disabled = !context.itemState.interactionsEnabled;
        }

        // Wire up constraint linkage
        activeInputElement = mathField;
        if (constraint) {
          const existingDescribedBy = mathField.getAttribute('aria-describedby');
          mathField.setAttribute(
            'aria-describedby',
            existingDescribedBy
              ? `${existingDescribedBy} ${constraint.element.id}`
              : constraint.element.id
          );
        }

        mathFieldWrapper.appendChild(mathField);

        // MathLive requires defining the custom element
        // This is typically done automatically when the module loads,
        // but we call it explicitly to ensure it's ready
        if (typeof mathlive.MathfieldElement !== 'undefined') {
          // Element should be auto-registered, but we can ensure it
          if (!customElements.get('math-field')) {
            customElements.define('math-field', mathlive.MathfieldElement);
          }
        }
      })
      .catch((error) => {
        console.error('Failed to load MathLive:', error);

        // Remove loading placeholder
        loadingPlaceholder.remove();

        // Fall back to a textarea with error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'cutie-formula-error';
        errorMsg.textContent = 'Math input unavailable. Please enter LaTeX formula:';
        mathFieldWrapper.appendChild(errorMsg);

        const textarea = document.createElement('textarea');
        textarea.className = 'cutie-formula-fallback';
        textarea.setAttribute('data-response-identifier', responseIdentifier);
        if (promptElement) {
          textarea.setAttribute('aria-labelledby', promptId);
        } else {
          textarea.setAttribute('aria-label', 'Formula input');
        }
        textarea.placeholder = placeholderText;

        if (expectedLines) {
          const lines = parseInt(expectedLines, 10);
          if (!isNaN(lines) && lines > 0) {
            textarea.style.minHeight = `${Math.max(lines * 1.4, 3)}em`;
          }
        }

        if (initialValue) {
          textarea.value = initialValue;
        }

        textarea.addEventListener('input', () => {
          currentValue = textarea.value;
        });

        // Wire up constraint linkage
        activeInputElement = textarea;
        if (constraint) {
          const existingDescribedBy = textarea.getAttribute('aria-describedby');
          textarea.setAttribute(
            'aria-describedby',
            existingDescribedBy
              ? `${existingDescribedBy} ${constraint.element.id}`
              : constraint.element.id
          );
        }

        if (context.itemState) {
          context.itemState.addObserver((state) => {
            textarea.disabled = !state.interactionsEnabled;
          });
          textarea.disabled = !context.itemState.interactionsEnabled;
        }

        mathFieldWrapper.appendChild(textarea);
      });

    return fragment;
  }
}

const FORMULA_INTERACTION_STYLES = `
.cutie-formula-interaction {
  display: block;
  margin: 8px 0;
}

.cutie-formula-interaction .cutie-prompt {
  margin-bottom: 8px;
}

.cutie-formula-field-wrapper {
  width: 100%;
}

.cutie-formula-field {
  width: 100%;
  min-height: 50px;
  padding: 8px;
  font-size: 18px;
  border: 1px solid var(--cutie-border);
  border-radius: 4px;
  box-sizing: border-box;
}

.cutie-formula-field:focus-within {
  border-color: var(--cutie-primary);
  box-shadow: none;
}

.cutie-formula-field[disabled] {
  background-color: var(--cutie-bg-alt);
  cursor: not-allowed;
  opacity: 0.6;
}

.cutie-formula-loading {
  padding: 12px;
  color: var(--cutie-text-muted);
  font-style: italic;
  background-color: var(--cutie-bg-alt);
  border: 1px solid var(--cutie-border);
  border-radius: 4px;
}

.cutie-formula-error {
  color: var(--cutie-feedback-incorrect);
  background-color: var(--cutie-bg-alt);
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.cutie-formula-fallback {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  border: 1px solid var(--cutie-border);
  border-radius: 4px;
  resize: vertical;
  box-sizing: border-box;
}

.cutie-formula-fallback:disabled {
  background-color: var(--cutie-bg-alt);
  cursor: not-allowed;
  opacity: 0.6;
}
`.trim();

// Register with priority 40 (before generic extended-text at 50)
registry.register('formula-interaction', new FormulaInteractionHandler(), 40);
