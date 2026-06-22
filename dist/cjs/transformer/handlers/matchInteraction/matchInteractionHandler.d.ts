import type { ElementHandler, TransformContext } from '../../types';
/**
 * Handler for qti-match-interaction elements.
 * Creates a two-set layout where items from either set can be associated.
 *
 * QTI Structure:
 * - qti-match-interaction[response-identifier, shuffle?, max-associations?]
 *   - qti-prompt
 *   - qti-simple-match-set (source set)
 *     - qti-simple-associable-choice[identifier, match-max]
 *   - qti-simple-match-set (target set)
 *     - qti-simple-associable-choice[identifier, match-max]
 */
export declare class MatchInteractionHandler implements ElementHandler {
    canHandle(element: Element): boolean;
    transform(element: Element, context: TransformContext): DocumentFragment;
    /**
     * Create a match set container with its choices.
     * Choices are already in the correct (potentially shuffled) order from the server.
     */
    private createMatchSet;
}
