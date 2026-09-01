/* spell-checker: ignore hottext radiogroup deselectable */
import {
  createInvalidAttributeError,
  createMissingAttributeError,
} from '../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../errors/validationDisplay';
import { announce } from '../../utils/liveRegion';
import {
  focusNext,
  focusPrev,
  initializeRovingTabindex,
  updateRovingTabindex,
} from '../../utils/rovingTabindex';
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
    const span = document.createElement('span');
    span.className = 'cutie-hottext';
    span.setAttribute('tabindex',  '0');
    span.setAttribute('role', 'button');
    span.setAttribute('data-hottext-identifier', identifier);
    span.setAttribute('aria-pressed', 'false');

    if (context.transformChildren) {
      span.appendChild(context.transformChildren(element));
    }

    fragment.appendChild(span);
    return fragment;
  }
}

/**
 * Handler for qti-hottext-interaction elements.
 * Renders the surrounding flow content (which contains inline qti-hottext
 * toggles), then wires up selection, min/max enforcement, validation, a
 * response accessor, and an enabled-state observer.
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
    container.setAttribute('role', isSingleSelect ? 'radiogroup' : 'group');
    if (isSingleSelect && minChoices >= 1) {
      container.setAttribute('aria-required', 'true');
    }

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

    const buttons = Array.from(
      contentContainer.querySelectorAll<HTMLElement>('[data-hottext-identifier]')
    );

    const getIdentifier = (button: HTMLElement): string =>
      button.getAttribute('data-hottext-identifier') ?? '';

    const selAttr = isSingleSelect ? 'aria-checked' : 'aria-pressed';
    const isSelected = (button: HTMLElement): boolean =>
      button.getAttribute(selAttr) === 'true';
    const setSelected = (button: HTMLElement, on: boolean): void => {
      button.setAttribute(selAttr, String(on));
    };
    const selectedCount = (): number => buttons.filter(isSelected).length;

    const isDisabled = (button: HTMLElement): boolean =>
      button.getAttribute('aria-disabled') === 'true';

    // Convert the toggle buttons into radios for single-select
    const radioMap = new Map<string, HTMLElement>();
    if (isSingleSelect) {
      for (const button of buttons) {
        button.setAttribute('role', 'radio');
        button.setAttribute('aria-checked', 'false');
        button.removeAttribute('aria-pressed');
        radioMap.set(getIdentifier(button), button);
      }
    }

    const selectExclusive = (button: HTMLElement): void => {
      for (const other of buttons) setSelected(other, false);
      setSelected(button, true);
    };

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
          setSelected(button, true);
        }
      }
    }

    if (isSingleSelect) {
      const checked = buttons.find(isSelected);
      if (checked) {
        updateRovingTabindex(radioMap, checked);
      } else {
        initializeRovingTabindex(radioMap);
      }
    }

    const checkValidity = (): boolean => {
      const count = selectedCount();
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

      const count = selectedCount();
      if (!isSingleSelect && maxChoices > 0 && count > maxChoices) {
        const msg = maxSelectionsMessage ?? hintText;
        if (msg) constraint?.setText(msg);
      } else if (minChoices > 0 && count < minChoices) {
        const msg = minSelectionsMessage ?? hintText;
        if (msg) constraint?.setText(msg);
      }
    };

    const activate = (button: HTMLElement): void => {
      if (isDisabled(button)) return;

      if (isSingleSelect) {
        // Radio semantics: activating selects and clears siblings.
        selectExclusive(button);
        updateRovingTabindex(radioMap, button);
      } else if (isSelected(button)) {
        setSelected(button, false);
      } else {
        if (maxChoices > 0 && selectedCount() >= maxChoices) {
          const msg = maxSelectionsMessage ?? hintText;
          if (msg) announce(context, msg, 'assertive');
          return;
        }
        setSelected(button, true);
      }

      if (checkValidity()) clearErrors();
    };

    for (const button of buttons) {
      button.addEventListener('click', () => activate(button));

      button.addEventListener('keydown', (event) => {
        if (isDisabled(button)) return;

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(button);
          return;
        }

        if (!isSingleSelect) return;

        const isNext = event.key === 'ArrowDown' || event.key === 'ArrowRight';
        const isPrev = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
        if (!isNext && !isPrev) return;

        event.preventDefault();
        const id = getIdentifier(button);
        const moved = isNext
          ? focusNext(radioMap, id)
          : focusPrev(radioMap, id);
        if (moved) {
          selectExclusive(moved);
          if (checkValidity()) clearErrors();
        }
      });
    }

    // Register response accessor with itemState
    if (context.itemState) {
      const getResponse = (): string | string[] | null => {
        const selected = buttons.filter(isSelected).map(getIdentifier);
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
          if (isEnabled) {
            button.removeAttribute('aria-disabled');
          } else {
            button.setAttribute('aria-disabled', 'true');
          }
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

  .cutie-hottext[aria-pressed="true"],
  .cutie-hottext[aria-checked="true"] {
    background-color: var(--cutie-primary);
    color: var(--cutie-bg);
    text-decoration-style: solid;
    text-decoration-color: currentColor;
  }

  .cutie-hottext[aria-pressed="true"]:hover,
  .cutie-hottext[aria-checked="true"]:hover {
    background-color: var(--cutie-primary);
  }

  .cutie-hottext[aria-disabled="true"] {
    cursor: default;
    opacity: 0.7;
  }

  .cutie-hottext[aria-disabled="true"]:hover {
    background-color: transparent;
  }

  .cutie-hottext[aria-pressed="true"][aria-disabled="true"],
  .cutie-hottext[aria-checked="true"][aria-disabled="true"] {
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

  .cutie-hottext-interaction .cutie-hottext-content .cutie-hottext {
    overflow-wrap: break-word;
  }
`;
