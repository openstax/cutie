import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../../errors/validationDisplay';
import { addAriaDescribedBy } from '../../../utils/aria';
import { announce } from '../../../utils/liveRegion';
import type { StyleManager, TransformContext } from '../../types';
import { clearConstraintVerdict } from '../evaluation';

/**
 * Create the outer container div for an extended-text interaction variant.
 * Forwards source classes and sets data-response-identifier.
 */
export function createInteractionContainer(
  element: Element,
  className: string,
  responseIdentifier: string,
): HTMLDivElement {
  const container = document.createElement('div');
  const sourceClasses = element.getAttribute('class');
  container.className = sourceClasses
    ? `${className} cutie-status-rail ${sourceClasses}`
    : `${className} cutie-status-rail`;
  container.setAttribute('data-response-identifier', responseIdentifier);
  return container;
}

export interface PromptResult {
  element: HTMLDivElement;
  id: string;
}

/**
 * Process a qti-prompt child element if present.
 * Creates a prompt container, transforms children, and returns the element + id.
 */
export function processPrompt(
  element: Element,
  responseIdentifier: string,
  context: TransformContext,
): PromptResult | null {
  const promptElement = element.querySelector('qti-prompt');
  if (!promptElement || !context.transformChildren) return null;

  const promptId = `prompt-${responseIdentifier}`;
  const promptContainer = document.createElement('div');
  promptContainer.className = 'cutie-prompt';
  promptContainer.id = promptId;
  const promptFragment = context.transformChildren(promptElement);
  promptContainer.appendChild(promptFragment);

  return { element: promptContainer, id: promptId };
}

export interface ParsedConstraints {
  minStrings: number;
  patternMask: string | null;
  patternMessage: string | null;
  minCharacters: number | null;
  maxCharacters: number | null;
}

/**
 * Parse constraint attributes from an extended-text interaction element.
 */
export function parseConstraints(element: Element): ParsedConstraints {
  const minStrings = parseInt(element.getAttribute('min-strings') ?? '0', 10) || 0;
  const patternMask = element.getAttribute('pattern-mask');
  const patternMessage = element.getAttribute('data-patternmask-message');
  const minCharacters = parseMinCharacters(element);
  const maxCharacters = parseMaxCharacters(element);
  return { minStrings, patternMask, patternMessage, minCharacters, maxCharacters };
}

/**
 * Derive constraint display text from parsed constraints.
 */
export function getMinStringsText(minStrings: number): string | null {
  if (minStrings === 1) return 'Enter a response.';
  if (minStrings > 1) return `Enter at least ${minStrings} responses.`;
  return null;
}

export function getMinCharactersText(minCharacters: number | null): string | null {
  if (minCharacters !== null && minCharacters > 0) {
    return `Write at least ${minCharacters} characters`;
  }
  return null;
}

export function getMaxCharactersText(maxCharacters: number | null): string | null {
  if (maxCharacters !== null && maxCharacters > 0) {
    return `Maximum ${maxCharacters} characters allowed`;
  }
  return null;
}

export function getPatternText(
  patternMask: string | null,
  patternMessage: string | null,
): string | null {
  return patternMessage ?? (patternMask ? 'Required format' : null);
}

export interface ConstraintResult {
  constraint: ConstraintMessage;
  /** The text the message shows at rest: the verdict, if any, else the hint */
  initialText: string;
  /** The constraint hint, shown in place of a verdict once it is cleared */
  hintText: string | null;
  minStringsText: string | null;
  minCharactersText: string | null;
  patternText: string | null;
  maxCharactersText: string | null;
}

/**
 * Create constraint message element if min-strings > 0 or pattern-mask is present.
 * Returns the constraint message and derived text, or null if no constraints apply.
 *
 * A finished attempt with a verdict passes its text as verdictText: the message
 * then shows it in place of the constraint hint (whether or not there are
 * constraints), so it is announced with the input.
 */
export function createConstraintElements(
  constraints: ParsedConstraints,
  responseIdentifier: string,
  styleManager?: StyleManager,
  verdictText: string | null = null,
): ConstraintResult | null {
  const { minStrings, patternMask, patternMessage, minCharacters, maxCharacters } = constraints;
  const minStringsText = getMinStringsText(minStrings);
  const minCharactersText = getMinCharactersText(minCharacters);
  const patternText = getPatternText(patternMask, patternMessage);
  const maxCharactersText = getMaxCharactersText(maxCharacters);

  const hasConstraints = minStrings > 0 || !!patternMask || minCharacters !== null || maxCharacters !== null;
  if (!hasConstraints && !verdictText) return null;

  const hintText = hasConstraints
    ? minCharactersText ?? minStringsText ?? patternText ?? maxCharactersText
    : null;
  const initialText = verdictText ?? hintText!;

  const constraint = createConstraintMessage(
    `constraint-${responseIdentifier}`,
    initialText,
    styleManager,
  );

  return { constraint, initialText, hintText, minStringsText, minCharactersText, patternText, maxCharactersText };
}

/**
 * Put the constraint hint back in place of a verdict the message showed (see
 * clearConstraintVerdict), once the learner edits the response.
 */
export function clearConstraintResultVerdict(result: ConstraintResult | null, described: Element | null): void {
  if (!result) return;
  clearConstraintVerdict(result.constraint, described, result.hintText);
  if (result.hintText) result.initialText = result.hintText;
}

/**
 * Set constraint error text/state and announce it to screen readers in one call,
 * so the announced message always matches what's displayed on screen — and a
 * repeated failure is still announced even when the resulting text is unchanged.
 */
export function showConstraintError(
  result: ConstraintResult | null,
  text: string | null,
  context: TransformContext,
): void {
  if (result && text) {
    result.constraint.setText(text);
    announce(context, text, 'assertive');
  }
  result?.constraint.setError(true);
}

/**
 * Wire aria-describedby on an input element to link to a constraint message.
 */
export function wireConstraintDescribedBy(
  inputElement: HTMLElement,
  constraintElement: HTMLElement,
): void {
  addAriaDescribedBy(inputElement, constraintElement.id);
}

// ---------------------------------------------------------------------------
// Character counter
// ---------------------------------------------------------------------------

/**
 * Parse the data-min-characters attribute from an extended-text interaction.
 * This is a spec extension that enforces a minimum character requirement.
 */
export function parseMinCharacters(element: Element): number | null {
  const raw = element.getAttribute('data-min-characters');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

/**
 * Parse the data-max-characters attribute from an extended-text interaction.
 * This is a spec extension that enforces a hard character limit.
 */
export function parseMaxCharacters(element: Element): number | null {
  const raw = element.getAttribute('data-max-characters');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

/**
 * Parse the expected-length attribute from an extended-text interaction.
 */
export function parseExpectedLength(element: Element): number | null {
  const raw = element.getAttribute('expected-length');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

/**
 * Parse counter direction from the element's class list.
 * Returns 'up' for qti-counter-up, 'down' for qti-counter-down, or null.
 */
export function parseCounterDirection(element: Element): 'up' | 'down' | null {
  const classes = element.getAttribute('class') ?? '';
  if (classes.includes('qti-counter-up')) return 'up';
  if (classes.includes('qti-counter-down')) return 'down';
  return null;
}

export interface CharacterCounter {
  element: HTMLDivElement;
  update: (charCount: number) => void;
}

const CHARACTER_COUNTER_STYLES = `
.cutie-character-counter {
  text-align: right;
  color: var(--cutie-text-muted);
  font-size: 0.85em;
  margin-left: auto;
}

.cutie-character-counter.cutie-counter-over {
  color: var(--cutie-feedback-incorrect);
}

.cutie-rich-text-disabled .cutie-character-counter,
.cutie-extended-text-interaction textarea:disabled ~ .cutie-character-counter {
  opacity: 0.6;
}
`.trim();

/**
 * Create a live character counter element with an update function.
 * The counter is an aria-live region that announces changes to screen readers.
 *
 * When `isHardLimit` is true the counter uses hard-limit wording
 * ("characters" / "characters remaining" / "over limit") instead of the
 * soft "suggested characters" language used for expected-length.
 */
export function createCharacterCounter(
  targetLength: number,
  direction: 'up' | 'down',
  responseIdentifier: string,
  styleManager?: StyleManager,
  isHardLimit = false,
): CharacterCounter {
  if (styleManager && !styleManager.hasStyle('cutie-character-counter')) {
    styleManager.addStyle('cutie-character-counter', CHARACTER_COUNTER_STYLES);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'cutie-character-counter';
  wrapper.id = `counter-${responseIdentifier}`;
  wrapper.setAttribute('aria-live', 'polite');
  wrapper.setAttribute('aria-atomic', 'true');

  const span = document.createElement('span');
  wrapper.appendChild(span);

  function update(charCount: number): void {
    if (direction === 'up') {
      span.textContent = isHardLimit
        ? `${charCount} / ${targetLength} characters`
        : `${charCount} / ${targetLength} suggested characters`;
      wrapper.classList.toggle('cutie-counter-over', charCount > targetLength);
    } else {
      const remaining = targetLength - charCount;
      if (remaining >= 0) {
        span.textContent = isHardLimit
          ? `${remaining} characters remaining`
          : `${remaining} suggested characters remaining`;
        wrapper.classList.remove('cutie-counter-over');
      } else {
        span.textContent = isHardLimit
          ? `${-remaining} characters over limit`
          : `${-remaining} characters over suggested size`;
        wrapper.classList.add('cutie-counter-over');
      }
    }
  }

  update(0);
  return { element: wrapper, update };
}

// ---------------------------------------------------------------------------
// Interaction footer (shared row for counter + constraint)
// ---------------------------------------------------------------------------

const INTERACTION_FOOTER_STYLES = `
.cutie-interaction-footer {
  display: flex;
  align-items: baseline;
  margin-top: 4px;
  gap: 1em;
}

.cutie-interaction-footer .cutie-constraint-text {
  margin-top: 0;
}
`.trim();

/**
 * Create a flex-row footer container for counter and/or constraint elements.
 * Returns null if neither element is provided.
 */
export function createInteractionFooter(
  constraint: HTMLElement | null,
  counter: HTMLElement | null,
  styleManager?: StyleManager,
): HTMLDivElement | null {
  if (!constraint && !counter) return null;

  if (styleManager && !styleManager.hasStyle('cutie-interaction-footer')) {
    styleManager.addStyle('cutie-interaction-footer', INTERACTION_FOOTER_STYLES);
  }

  const footer = document.createElement('div');
  footer.className = 'cutie-interaction-footer';

  if (constraint) footer.appendChild(constraint);
  if (counter) footer.appendChild(counter);

  return footer;
}
