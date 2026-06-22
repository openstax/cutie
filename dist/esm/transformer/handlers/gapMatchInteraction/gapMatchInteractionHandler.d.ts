import type { ElementHandler, TransformContext } from '../../types';
/**
 * Handler for qti-gap-match-interaction elements.
 * Creates a container with draggable choices and wires up all interactions.
 */
export declare class GapMatchInteractionHandler implements ElementHandler {
    canHandle(element: Element): boolean;
    transform(element: Element, context: TransformContext): DocumentFragment;
}
