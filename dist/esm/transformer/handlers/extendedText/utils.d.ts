import { type ConstraintMessage } from '../../../errors/validationDisplay';
import type { StyleManager, TransformContext } from '../../types';
/**
 * Create the outer container div for an extended-text interaction variant.
 * Forwards source classes and sets data-response-identifier.
 */
export declare function createInteractionContainer(element: Element, className: string, responseIdentifier: string): HTMLDivElement;
export interface PromptResult {
    element: HTMLDivElement;
    id: string;
}
/**
 * Process a qti-prompt child element if present.
 * Creates a prompt container, transforms children, and returns the element + id.
 */
export declare function processPrompt(element: Element, responseIdentifier: string, context: TransformContext): PromptResult | null;
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
export declare function parseConstraints(element: Element): ParsedConstraints;
/**
 * Derive constraint display text from parsed constraints.
 */
export declare function getMinStringsText(minStrings: number): string | null;
export declare function getMinCharactersText(minCharacters: number | null): string | null;
export declare function getMaxCharactersText(maxCharacters: number | null): string | null;
export declare function getPatternText(patternMask: string | null, patternMessage: string | null): string | null;
export interface ConstraintResult {
    constraint: ConstraintMessage;
    initialText: string;
    minStringsText: string | null;
    minCharactersText: string | null;
    patternText: string | null;
    maxCharactersText: string | null;
}
/**
 * Create constraint message element if min-strings > 0 or pattern-mask is present.
 * Returns the constraint message and derived text, or null if no constraints apply.
 */
export declare function createConstraintElements(constraints: ParsedConstraints, responseIdentifier: string, styleManager?: StyleManager): ConstraintResult | null;
/**
 * Wire aria-describedby on an input element to link to a constraint message.
 */
export declare function wireConstraintDescribedBy(inputElement: HTMLElement, constraintElement: HTMLElement): void;
/**
 * Parse the data-min-characters attribute from an extended-text interaction.
 * This is a spec extension that enforces a minimum character requirement.
 */
export declare function parseMinCharacters(element: Element): number | null;
/**
 * Parse the data-max-characters attribute from an extended-text interaction.
 * This is a spec extension that enforces a hard character limit.
 */
export declare function parseMaxCharacters(element: Element): number | null;
/**
 * Parse the expected-length attribute from an extended-text interaction.
 */
export declare function parseExpectedLength(element: Element): number | null;
/**
 * Parse counter direction from the element's class list.
 * Returns 'up' for qti-counter-up, 'down' for qti-counter-down, or null.
 */
export declare function parseCounterDirection(element: Element): 'up' | 'down' | null;
export interface CharacterCounter {
    element: HTMLDivElement;
    update: (charCount: number) => void;
}
/**
 * Create a live character counter element with an update function.
 * The counter is an aria-live region that announces changes to screen readers.
 *
 * When `isHardLimit` is true the counter uses hard-limit wording
 * ("characters" / "characters remaining" / "over limit") instead of the
 * soft "suggested characters" language used for expected-length.
 */
export declare function createCharacterCounter(targetLength: number, direction: 'up' | 'down', responseIdentifier: string, styleManager?: StyleManager, isHardLimit?: boolean): CharacterCounter;
/**
 * Create a flex-row footer container for counter and/or constraint elements.
 * Returns null if neither element is provided.
 */
export declare function createInteractionFooter(constraint: HTMLElement | null, counter: HTMLElement | null, styleManager?: StyleManager): HTMLDivElement | null;
