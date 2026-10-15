/* spell-checker: ignore hottext hottexts radiogroup deselectable */
import {
  createInvalidAttributeError,
  createMissingAttributeError,
} from '../../errors/errorDisplay.js';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../errors/validationDisplay.js';
import { announce } from '../../utils/liveRegion.js';
import { reportResponseChanges } from '../../utils/responseChange.js';
import {
  focusNext,
  focusPrev,
  initializeRovingTabindex,
  updateRovingTabindex,
} from '../../utils/rovingTabindex.js';
import { registry } from '../registry.js';
import type { ElementHandler, InteractionState, ResponseAccessorOptions, TransformContext } from '../types.js';
import {
  clearConstraintVerdict,
  clearEvaluated,
  clearVerdictOnEdit,
  createSrText,
  getVerdictText,
  markEvaluated,
  readEvaluation,
} from './evaluation/index.js';
import { getDefaultValue } from './responseUtils.js';

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

const ANSWER_MARKS = {
  correct: { className: 'cutie-answer-mark--correct', text: 'Correct answer' },
  incorrect: { className: 'cutie-answer-mark--incorrect', text: 'Incorrect answer' },
} as const;

type AnswerMark = keyof typeof ANSWER_MARKS;

/**
 * Mark a hottext with an answer mark: the underline, and visually hidden text
 * leading its accessible name.
 */
function markAnswer(button: HTMLElement, mark: AnswerMark): void {
  const { className, text } = ANSWER_MARKS[mark];
  button.classList.add('cutie-answer-mark', className);
  const label = createSrText(`${text}: `);
  label.setAttribute('data-answer-mark', mark);
  button.prepend(label);
}

/**
 * Mark the hottexts in the correct response, and the selected hottexts that
 * aren't. Draws nothing when there is no correct response to mark.
 */
function drawAnswerMarks(
  container: HTMLElement,
  buttons: HTMLElement[],
  correctResponse: string[],
  isSelected: (button: HTMLElement) => boolean
): void {
  if (correctResponse.length === 0) return;

  container.classList.add('cutie-hottext-interaction--answers-shown');
  for (const button of buttons) {
    const identifier = button.getAttribute('data-hottext-identifier') ?? '';
    if (correctResponse.includes(identifier)) {
      markAnswer(button, 'correct');
    } else if (isSelected(button)) {
      markAnswer(button, 'incorrect');
    }
  }
}

/**
 * Remove the incorrect-answer marks.
 */
function clearIncorrectAnswerMarks(container: HTMLElement): void {
  container.querySelectorAll(`.${ANSWER_MARKS.incorrect.className}`).forEach((marked) => {
    marked.classList.remove('cutie-answer-mark', ANSWER_MARKS.incorrect.className);
    marked.querySelector('[data-answer-mark="incorrect"]')?.remove();
  });
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
      ? `cutie-hottext-interaction cutie-status-rail ${sourceClasses}`
      : 'cutie-hottext-interaction cutie-status-rail';
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

    const getResponse = (): string | string[] | null => {
      const selected = buttons.filter(isSelected).map(getIdentifier);
      if (selected.length === 0) return null;
      return isSingleSelect ? (selected[0] ?? null) : selected;
    };

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

    // Evaluation of a finished attempt when the delivery options show one,
    // or the last try's verdict on a fresh try
    const evaluation = readEvaluation(element, responseIdentifier, context.styleManager);

    // Constraint message. A verdict describes the response in its place, so it
    // is announced with the group; the status rail is the visual verdict.
    const minSelectionsMessage = element.getAttribute('data-min-selections-message');
    const maxSelectionsMessage = element.getAttribute('data-max-selections-message');
    let constraint: ConstraintMessage | undefined;
    const constraintText = buildConstraintText(minChoices, maxChoices, isSingleSelect);
    let hintText = evaluation?.verdict ? getVerdictText(evaluation.verdict) : constraintText;
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

    // Tab stops while enabled: every toggle, or for single-select the checked
    // radio (else the first). Disabled hottexts have none.
    const restoreTabStops = (): void => {
      if (!isSingleSelect) {
        for (const button of buttons) button.setAttribute('tabindex', '0');
        return;
      }
      const checked = buttons.find(isSelected);
      if (checked) {
        updateRovingTabindex(radioMap, checked);
      } else {
        initializeRovingTabindex(radioMap);
      }
    };
    restoreTabStops();

    // Draw the evaluation: the status rail, a solid underline on each hottext
    // in the correct response, and a wavy underline on each selected hottext
    // that isn't. Each marked hottext's name starts with what its mark means.
    // The verdict is in the constraint text.
    if (evaluation) {
      drawAnswerMarks(container, buttons, evaluation.correctResponse, isSelected);
      markEvaluated(container, evaluation.verdict);
    }
    clearVerdictOnEdit(context, responseIdentifier, evaluation, () => {
      clearEvaluated(container);
      // Incorrect-answer marks describe the response, so they go with the verdict
      clearIncorrectAnswerMarks(container);
      clearConstraintVerdict(constraint, container, constraintText);
      hintText = constraintText;
    });

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
          // The selection is refused, so the response (and any verdict on it)
          // stands; announce the constraint, not the verdict
          const msg = maxSelectionsMessage ?? constraintText;
          if (msg) announce(context, msg, 'assertive');
          return;
        }
        setSelected(button, true);
      }

      if (checkValidity()) clearErrors();
    };

    // Learner gestures report the response changes they make to the item state
    const reported = <E extends Event>(listener: (event: E) => void) =>
      reportResponseChanges(context, responseIdentifier, getResponse, listener);

    for (const button of buttons) {
      button.addEventListener('click', reported(() => activate(button)));

      button.addEventListener('keydown', reported((event: KeyboardEvent) => {
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
      }));
    }

    // Register response accessor with itemState
    if (context.itemState) {
      const accessor = (options?: ResponseAccessorOptions) => {
        const value = getResponse();
        const valid = checkValidity();
        if (!options?.silent) {
          if (valid) { clearErrors(); } else { showErrors(); }
        }
        return { value, valid };
      };

      context.itemState.registerResponse(responseIdentifier, accessor);

      // Observe interaction enabled state changes
      const updateInteractionState = (state: { interactionState: InteractionState }) => {
        const isEnabled = state.interactionState === 'enabled';
        for (const button of buttons) {
          if (isEnabled) {
            button.removeAttribute('aria-disabled');
          } else {
            button.setAttribute('aria-disabled', 'true');
            button.setAttribute('tabindex', '-1');
          }
        }
        if (isEnabled) restoreTabStops();
      };

      context.itemState.addObserver(updateInteractionState);

      // Set initial state
      updateInteractionState({ interactionState: context.itemState.interactionState });
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
 *
 * Every visual state is carried by shape, not color, so a theme that remaps
 * the colors (e.g. high contrast) keeps every meaning.
 *
 * While the learner is answering, one line sits under the text: dotted while
 * selectable, thick and solid when selected. The padding is even, so the
 * focus ring (an outline, a shape no line takes) is centered on the text.
 *
 * Once answers are shown the interaction is disabled, with no focus ring to
 * center: the answer mark takes the line under the text (solid for a correct
 * answer, wavy for an incorrect one), and the padding shifts to the bottom
 * to hold the selection, a bar below the mark.
 *
 * Vertical padding on an inline box changes neither the line height nor
 * where the text sits, so selecting a hottext or showing answers moves no
 * text. There is no side padding (which would move text), so the underlines
 * and the selection bar all span exactly the text.
 */
const HOTTEXT_STYLES = `
  .cutie-hottext {
    display: inline;
    padding: 1px 0;
    margin: 0;
    border: none;
    border-radius: 2px;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
    background-color: transparent;
    color: inherit;
    font: inherit;
    line-height: inherit;
    text-align: inherit;
    text-decoration: none;
    text-decoration-skip-ink: none;
    text-underline-offset: 0.15em;
    cursor: pointer;
  }

  .cutie-hottext-interaction:not(.cutie-hottext-interaction--answers-shown) .cutie-hottext {
    text-decoration: underline dotted;
    text-decoration-thickness: 1px;
  }

  .cutie-hottext-interaction:not(.cutie-hottext-interaction--answers-shown)
    .cutie-hottext:not([aria-pressed="true"]):not([aria-checked="true"]):not([aria-disabled="true"]):hover {
    text-decoration-thickness: 2px;
  }

  .cutie-hottext-interaction:not(.cutie-hottext-interaction--answers-shown) .cutie-hottext[aria-pressed="true"],
  .cutie-hottext-interaction:not(.cutie-hottext-interaction--answers-shown) .cutie-hottext[aria-checked="true"] {
    text-decoration-style: solid;
    text-decoration-thickness: 3px;
    text-decoration-color: var(--cutie-primary);
  }

  .cutie-hottext:focus-visible {
    outline: var(--cutie-focus-ring);
    outline-offset: var(--cutie-focus-ring-offset);
  }

  /* Square corners, so the selection bar's ends are square too */
  .cutie-hottext-interaction--answers-shown .cutie-hottext {
    padding: 0 0 6px;
    border-radius: 0;
  }

  /*
   * The selection bar takes the bottom of the padding, so it sits where the
   * padding ends either way. A border rather than a shadow: forced colors
   * (e.g. Windows High Contrast) keep borders and drop shadows.
   */
  .cutie-hottext-interaction--answers-shown .cutie-hottext[aria-pressed="true"],
  .cutie-hottext-interaction--answers-shown .cutie-hottext[aria-checked="true"] {
    padding-bottom: 3px;
    border-bottom: 3px solid var(--cutie-primary);
  }

  .cutie-hottext[aria-disabled="true"] {
    cursor: default;
  }

  .cutie-hottext--error {
    color: var(--cutie-feedback-incorrect);
    text-decoration: underline wavy;
  }
`;

/**
 * CSS styles for the hottext interaction container, and the answer marks it
 * draws on its hottexts.
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

  /*
   * Room around each line for a hottext's focus ring, so it overlaps neither
   * the lines above and below nor, on a hottext that wraps, itself. The
   * selection bar shown with answers needs less.
   */
  .cutie-hottext-interaction .cutie-hottext-content {
    line-height: 2.4;
  }

  .cutie-hottext-interaction .cutie-hottext-content .cutie-hottext {
    overflow-wrap: break-word;
  }

  /*
   * Where the selected underline is while answering (see .cutie-hottext), so
   * the line under the text keeps its place once answers are shown, clear of
   * the selection bar below
   */
  .cutie-hottext-interaction .cutie-answer-mark {
    text-decoration-line: underline;
    text-decoration-skip-ink: none;
    text-underline-offset: 0.15em;
  }

  .cutie-hottext-interaction .cutie-answer-mark--correct {
    text-decoration-style: solid;
    text-decoration-thickness: 2px;
    text-decoration-color: var(--cutie-feedback-correct);
  }

  /*
   * A wave is taller than a solid line of the same thickness: 1px, and raised
   * 1px so its top lines up with the solid line's, keeps it clear of the
   * selection bar below (a thicker wave runs into it)
   */
  .cutie-hottext-interaction .cutie-answer-mark--incorrect {
    text-decoration-style: wavy;
    text-decoration-thickness: 1px;
    text-decoration-color: var(--cutie-feedback-incorrect);
    text-underline-offset: calc(0.15em - 1px);
  }
`;
