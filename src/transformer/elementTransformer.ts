import { createUnsupportedElement } from '../errors/errorDisplay';
import { registry } from './registry';
import { DefaultStyleManager } from './styleManager';
import type { StyleManager, TransformContext } from './types';

// Import handlers to trigger registration
import './handlers';

/**
 * Create a transform context with styleManager and transformChildren wired up.
 * Call this once at the start of transformation, then pass the context to
 * transformChildren and transformNode.
 */
export function createTransformContext(
  baseContext: Omit<TransformContext, 'transformChildren'> = {}
): TransformContext {
  const styleManager = baseContext.styleManager ?? new DefaultStyleManager();

  const context: TransformContext = {
    ...baseContext,
    styleManager,
    transformChildren: (el: Element) => transformChildren(el, context),
  };

  return context;
}

/**
 * Transform a single element using the appropriate handler.
 * Use this when you want to transform the element itself (e.g., a modal feedback element).
 */
export function transformNode(
  element: Element,
  context: TransformContext
): DocumentFragment {
  const handler = registry.findHandler(element);

  if (handler) {
    return handler.transform(element, context);
  }

  // No handler found - create error display
  const fragment = document.createDocumentFragment();
  const errorElement = createUnsupportedElement(element.tagName.toLowerCase());
  fragment.appendChild(errorElement);
  return fragment;
}

/**
 * Transform the children of an element (not the element itself).
 * Use this when you want to extract and transform the contents of a container
 * (e.g., the contents of qti-item-body).
 */
export function transformChildren(
  element: Element,
  context: TransformContext
): DocumentFragment {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (!node) continue;

    if (node.nodeType === Node.TEXT_NODE) {
      // Clone text nodes directly
      fragment.appendChild(node.cloneNode(true));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Transform element nodes
      const childFragment = transformNode(node as Element, context);
      fragment.appendChild(childFragment);
    }
    // Ignore other node types (comments, processing instructions, etc.)
  }

  return fragment;
}

/**
 * Legacy API: Transform an element's children with automatic context setup.
 * @deprecated Use createTransformContext + transformChildren instead for more control.
 */
export function transformElement(
  element: Element,
  baseContext: Omit<TransformContext, 'transformChildren'> = {}
): DocumentFragment {
  const context = createTransformContext(baseContext);
  return transformChildren(element, context);
}

/**
 * Get the StyleManager from a context, creating one if needed.
 * This is useful for handlers that need to ensure a StyleManager exists.
 */
export function getStyleManager(context: TransformContext): StyleManager {
  return context.styleManager ?? new DefaultStyleManager();
}
