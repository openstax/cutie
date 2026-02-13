import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../../errors/validationDisplay';
import type { StyleManager, TransformContext } from '../../types';

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
    ? `${className} ${sourceClasses}`
    : className;
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
}

/**
 * Parse constraint attributes from an extended-text interaction element.
 */
export function parseConstraints(element: Element): ParsedConstraints {
  const minStrings = parseInt(element.getAttribute('min-strings') ?? '0', 10) || 0;
  const patternMask = element.getAttribute('pattern-mask');
  const patternMessage = element.getAttribute('data-patternmask-message');
  return { minStrings, patternMask, patternMessage };
}

/**
 * Derive constraint display text from parsed constraints.
 */
export function getMinStringsText(minStrings: number): string | null {
  if (minStrings === 1) return 'Enter a response.';
  if (minStrings > 1) return `Enter at least ${minStrings} responses.`;
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
  minStringsText: string | null;
  patternText: string | null;
}

/**
 * Create constraint message element if min-strings > 0 or pattern-mask is present.
 * Returns the constraint message and derived text, or null if no constraints apply.
 */
export function createConstraintElements(
  constraints: ParsedConstraints,
  responseIdentifier: string,
  styleManager?: StyleManager,
): ConstraintResult | null {
  const { minStrings, patternMask, patternMessage } = constraints;
  const minStringsText = getMinStringsText(minStrings);
  const patternText = getPatternText(patternMask, patternMessage);

  if (minStrings <= 0 && !patternMask) return null;

  const constraint = createConstraintMessage(
    `constraint-${responseIdentifier}`,
    minStringsText ?? patternText!,
    styleManager,
  );

  return { constraint, minStringsText, patternText };
}

/**
 * Wire aria-describedby on an input element to link to a constraint message.
 */
export function wireConstraintDescribedBy(
  inputElement: HTMLElement,
  constraintElement: HTMLElement,
): void {
  const existing = inputElement.getAttribute('aria-describedby');
  inputElement.setAttribute(
    'aria-describedby',
    existing
      ? `${existing} ${constraintElement.id}`
      : constraintElement.id,
  );
}
