import type { StyleManager, TransformContext } from './types';
import './handlers';
/**
 * Create a transform context with styleManager and transformChildren wired up.
 * Call this once at the start of transformation, then pass the context to
 * transformChildren and transformNode.
 */
export declare function createTransformContext(baseContext?: Omit<TransformContext, 'transformChildren'>): TransformContext;
/**
 * Transform a single element using the appropriate handler.
 * Use this when you want to transform the element itself (e.g., a modal feedback element).
 */
export declare function transformNode(element: Element, context: TransformContext): DocumentFragment;
/**
 * Transform the children of an element (not the element itself).
 * Use this when you want to extract and transform the contents of a container
 * (e.g., the contents of qti-item-body).
 */
export declare function transformChildren(element: Element, context: TransformContext): DocumentFragment;
/**
 * Legacy API: Transform an element's children with automatic context setup.
 * @deprecated Use createTransformContext + transformChildren instead for more control.
 */
export declare function transformElement(element: Element, baseContext?: Omit<TransformContext, 'transformChildren'>): DocumentFragment;
/**
 * Get the StyleManager from a context, creating one if needed.
 * This is useful for handlers that need to ensure a StyleManager exists.
 */
export declare function getStyleManager(context: TransformContext): StyleManager;
