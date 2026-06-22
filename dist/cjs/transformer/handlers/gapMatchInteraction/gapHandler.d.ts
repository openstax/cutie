import type { ElementHandler, TransformContext } from '../../types';
/**
 * Handler for qti-gap elements within gap-match-interaction.
 * Renders gaps as simple spans with data attributes.
 */
export declare class GapHandler implements ElementHandler {
    canHandle(element: Element): boolean;
    transform(element: Element, context: TransformContext): DocumentFragment;
}
