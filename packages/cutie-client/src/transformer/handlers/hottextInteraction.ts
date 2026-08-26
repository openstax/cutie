/* spell-checker: ignore hottext */
import {
  createInvalidAttributeError,
  createMissingAttributeError,
} from '../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../errors/validationDisplay';
import { announce } from '../../utils/liveRegion';
import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';
import { getDefaultValue } from './responseUtils';

/**
 * Build constraint text describing the selection requirements.
 * Returns null when no instructional text is needed (e.g., single-select
 * without a minimum).
 */
function buildConstraintText(minChoices: number, maxChoices: number, isSingleSelect: boolean): string | null {
  if (isSingleSelect) {
    return minChoices > 0 ? 'Select an answer.' : null;
  }
  if (minChoices > 0 && maxChoices > 0 && minChoices !== maxChoices) {
    return `Select between ${minChoices} and ${maxChoices} items.`;
  }
  if (minChoices > 0) {
    return `Select at least ${minChoices} item${minChoices === 1 ? '' : 's'}.`;
  }
  if (maxChoices > 0) {
    return `Select up to ${maxChoices} item${maxChoices === 1 ? '' : 's'}.`;
  }
  return null;
}

/**
 * Read the cardinality of a response declaration.
 * Mirrors the lookup used by getDefaultValue (queries the owning document for
 * the qti-response-declaration with the given identifier).
 */
function getResponseCardinality(
  doc: Document | null,
  responseIdentifier: string
): string | null {
  if (!doc) return null;
  const responseDeclaration = doc.querySelector(
    `qti-response-declaration[identifier="${responseIdentifier}"]`
  );
  return responseDeclaration?.getAttribute('cardinality') ?? null;
}

/**
 * Handler for qti-hottext elements within a qti-hottext-interaction.
 * Renders each selectable word as an inert inline toggle button. The parent
 * HottextInteractionHandler wires up all behavior after transforming content.
 */
class HottextHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-hottext';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-hottext')) {
      context.styleManager.addStyle('cutie-hottext', HOTTEXT_STYLES);
    }

    const identifier = element.getAttribute('identifier');
    if (!identifier) {
      console.warn('qti-hottext missing identifier attribute');
      const span = document.createElement('span');
      span.className = 'cutie-hottext cutie-hottext--error';
      span.textContent = '[missing identifier]';
      fragment.appendChild(span);
      return fragment;
    }

    // Render an inert inline toggle. Behavior is attached by the parent
    // interaction handler after it finds the button via querySelectorAll.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cutie-hottext';
    button.setAttribute('data-hottext-identifier', identifier);
    button.setAttribute('aria-pressed', 'false');

    if (context.transformChildren) {
      button.appendChild(context.transformChildren(element));
    }

    fragment.appendChild(button);
    return fragment;
  }
}

/**
 * Handler for qti-hottext-interaction elements.
 * Renders the surrounding flow content (which contains inline qti-hottext
 * toggles), then wires up selection, min/max enforcement, validation, a
 * response accessor, and an enabled-state observer.
 *
 * Single-vs-multi select is driven by the response declaration's cardinality,
 * not by max-choices. cardinality="single" yields a scalar response value;
 * otherwise the value is an array. max-choices governs only the max constraint.
 */
class HottextInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-hottext-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-hottext-interaction')) {
      context.styleManager.addStyle('cutie-hottext-interaction', HOTTEXT_INTERACTION_STYLES);
    }

    // Required response-identifier
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      fragment.appendChild(
        createMissingAttributeError('qti-hottext-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Single-vs-multi select is determined by the response declaration's
    // cardinality, NOT by max-choices (see class docs).
    const cardinality = getResponseCardinality(element.ownerDocument, responseIdentifier);
    const isSingleSelect = cardinality === 'single';

    // Parse max-choices (default 1 per the QTI v3 HotTextInteractionDType XSD)
    // as a constraint only.
    const maxChoicesAttr = element.getAttribute('max-choices') ?? '1';
    const maxChoices = parseInt(maxChoicesAttr, 10);
    if (isNaN(maxChoices)) {
      fragment.appendChild(
        createInvalidAttributeError('qti-hottext-interaction', 'max-choices', maxChoicesAttr, 'Value must be a number')
      );
      return fragment;
    }

    // Parse optional min-choices attribute
    const minChoicesAttr = element.getAttribute('min-choices');
    const minChoices = minChoicesAttr ? parseInt(minChoicesAttr, 10) : 0;
    if (minChoicesAttr && isNaN(minChoices)) {
      fragment.appendChild(
        createInvalidAttributeError('qti-hottext-interaction', 'min-choices', minChoicesAttr, 'Value must be a number')
      );
      return fragment;
    }

    // Create the interaction container (acts as the accessible group)
    const container = document.createElement('div');
    const sourceClasses = element.getAttribute('class');
    container.className = sourceClasses
      ? `cutie-hottext-interaction ${sourceClasses}`
      : 'cutie-hottext-interaction';
    container.setAttribute('data-response-identifier', responseIdentifier);
    container.setAttribute('role', 'group');

    const children = Array.from(element.children);
    const promptElement = children.find(
      (child) => child.tagName.toLowerCase() === 'qti-prompt'
    );

    // Render prompt if present, and label the group with it
    const promptId = `prompt-${responseIdentifier}`;
    if (promptElement && context.transformChildren) {
      const promptDiv = document.createElement('div');
      promptDiv.className = 'cutie-prompt';
      promptDiv.id = promptId;
      promptDiv.appendChild(context.transformChildren(promptElement));
      container.appendChild(promptDiv);
      container.setAttribute('aria-labelledby', promptId);
    } else {
      // No prompt: give the group a fallback accessible name so screen
      // readers announce more than a bare "group" (mirrors gap-match).
      container.setAttribute('aria-label', 'Hottext interaction');
    }

    // Transform the interaction's flow content (everything except the prompt)
    // into a content container. Transforming a clone of the interaction — rather
    // than each child element in isolation — preserves block wrappers like <p>
    // and the whitespace text nodes between them, so multi-paragraph passages
    // render faithfully instead of collapsing into run-together text. This also
    // invokes HottextHandler for each inline qti-hottext element.
    const contentContainer = document.createElement('div');
    contentContainer.className = 'cutie-hottext-content';
    if (context.transformChildren) {
      const contentSource = element.cloneNode(true) as Element;
      for (const child of Array.from(contentSource.children)) {
        if (child.tagName.toLowerCase() === 'qti-prompt') child.remove();
      }
      contentContainer.appendChild(context.transformChildren(contentSource));
    }
    container.appendChild(contentContainer);

    // Collect the rendered toggle buttons
    const buttons = Array.from(
      contentContainer.querySelectorAll<HTMLButtonElement>('[data-hottext-identifier]')
    );

    const getIdentifier = (button: HTMLButtonElement): string =>
      button.getAttribute('data-hottext-identifier') ?? '';
    const isPressed = (button: HTMLButtonElement): boolean =>
      button.getAttribute('aria-pressed') === 'true';
    const pressedCount = (): number => buttons.filter(isPressed).length;

    // Constraint message
    const minSelectionsMessage = element.getAttribute('data-min-selections-message');
    const maxSelectionsMessage = element.getAttribute('data-max-selections-message');
    let constraint: ConstraintMessage | undefined;
    const hintText = buildConstraintText(minChoices, maxChoices, isSingleSelect);
    if (hintText) {
      constraint = createConstraintMessage(
        `constraint-${responseIdentifier}`,
        hintText,
        context.styleManager,
      );
      container.appendChild(constraint.element);

      const existingDescribedBy = container.getAttribute('aria-describedby');
      container.setAttribute(
        'aria-describedby',
        existingDescribedBy
          ? `${existingDescribedBy} ${constraint.element.id}`
          : constraint.element.id
      );
    }

    // Apply default value(s) from the response declaration if present
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null) {
      const defaults = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      for (const button of buttons) {
        if (defaults.includes(getIdentifier(button))) {
          button.setAttribute('aria-pressed', 'true');
        }
      }
    }

    const checkValidity = (): boolean => {
      const count = pressedCount();
      return (minChoices <= 0 || count >= minChoices) &&
             (maxChoices <= 0 || isSingleSelect || count <= maxChoices);
    };

    const clearErrors = () => {
      container.removeAttribute('aria-invalid');
      constraint?.setError(false);
      if (hintText) constraint?.setText(hintText);
    };

    const showErrors = () => {
      container.setAttribute('aria-invalid', 'true');
      constraint?.setError(true);

      const count = pressedCount();
      if (!isSingleSelect && maxChoices > 0 && count > maxChoices) {
        const msg = maxSelectionsMessage ?? hintText;
        if (msg) constraint?.setText(msg);
      } else if (minChoices > 0 && count < minChoices) {
        const msg = minSelectionsMessage ?? hintText;
        if (msg) constraint?.setText(msg);
      }
    };

    // Wire up selection behavior
    for (const button of buttons) {
      button.addEventListener('click', () => {
        if (button.disabled) return;

        if (isPressed(button)) {
          // Toggle off
          button.setAttribute('aria-pressed', 'false');
        } else if (isSingleSelect) {
          // Single-select: activating one clears the others
          for (const other of buttons) {
            other.setAttribute('aria-pressed', 'false');
          }
          button.setAttribute('aria-pressed', 'true');
        } else {
          // Multi-select: block additional selections once at max
          if (maxChoices > 0 && pressedCount() >= maxChoices) {
            const msg = maxSelectionsMessage ?? hintText;
            if (msg) announce(context, msg, 'assertive');
            return;
          }
          button.setAttribute('aria-pressed', 'true');
        }

        // Clear any prior validation error once the selection is valid
        if (checkValidity()) clearErrors();
      });
    }

    // Register response accessor with itemState
    if (context.itemState) {
      const getResponse = (): string | string[] | null => {
        const selected = buttons.filter(isPressed).map(getIdentifier);
        if (selected.length === 0) return null;
        return isSingleSelect ? (selected[0] ?? null) : selected;
      };

      const accessor = () => {
        const value = getResponse();
        const valid = checkValidity();
        if (valid) { clearErrors(); } else { showErrors(); }
        return { value, valid };
      };

      context.itemState.registerResponse(responseIdentifier, accessor);

      // Observe interaction enabled state changes
      const updateInteractionState = (state: { interactionsEnabled: boolean }) => {
        const isEnabled = state.interactionsEnabled;
        for (const button of buttons) {
          button.disabled = !isEnabled;
        }
      };

      context.itemState.addObserver(updateInteractionState);

      // Set initial state
      updateInteractionState({ interactionsEnabled: context.itemState.interactionsEnabled });
    }

    fragment.appendChild(container);
    return fragment;
  }
}

// Register HottextHandler (priority 45) so it is checked before the interaction
// handler; HottextInteractionHandler (priority 50) matches the wrapper element.
registry.register('hottext', new HottextHandler(), 45);
registry.register('hottext-interaction', new HottextInteractionHandler(), 50);

/**
 * CSS styles for inline hottext toggle words.
 */
const HOTTEXT_STYLES = `
  .cutie-hottext {
    display: inline;
    padding: 0.05em 0.2em;
    margin: 0;
    border: none;
    border-radius: 3px;
    background-color: transparent;
    color: inherit;
    font: inherit;
    line-height: inherit;
    text-align: inherit;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 0.2em;
    transition: background-color 0.2s, color 0.2s, text-decoration-color 0.2s;
  }

  .cutie-hottext:hover {
    background-color: var(--cutie-bg-alt);
  }

  .cutie-hottext:focus-visible {
    outline: 2px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  /* Selected state — colored fill with a solid underline as a non-color cue */
  .cutie-hottext[aria-pressed="true"] {
    background-color: var(--cutie-primary);
    color: var(--cutie-bg);
    text-decoration-style: solid;
    text-decoration-color: currentColor;
  }

  .cutie-hottext[aria-pressed="true"]:hover {
    background-color: var(--cutie-primary);
  }

  .cutie-hottext:disabled {
    cursor: default;
    opacity: 0.7;
  }

  .cutie-hottext:disabled:hover {
    background-color: transparent;
  }

  .cutie-hottext[aria-pressed="true"]:disabled {
    background-color: var(--cutie-primary);
    opacity: 0.7;
  }

  .cutie-hottext--error {
    color: var(--cutie-feedback-incorrect);
    text-decoration: underline;
    text-decoration-style: wavy;
  }
`;

/**
 * CSS styles for the hottext interaction container.
 */
const HOTTEXT_INTERACTION_STYLES = `
  .cutie-hottext-interaction {
    margin: 1em 0;
  }

  .cutie-hottext-interaction .cutie-prompt {
    font-weight: 600;
    margin-bottom: 0.75em;
    color: var(--cutie-text);
  }

  .cutie-hottext-interaction .cutie-hottext-content {
    line-height: 1.8;
  }
`;
