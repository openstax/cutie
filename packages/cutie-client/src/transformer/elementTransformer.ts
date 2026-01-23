import { createUnsupportedElement } from '../errors/errorDisplay';
import { registry } from './registry';
import { DefaultStyleManager } from './styleManager';
import type { StyleManager, TransformContext } from './types';

// Import handlers to trigger registration
import './handlers';

/**
 * Transform a single element using the appropriate handler
 */
function transformSingleElement(
  element: Element,
  context: TransformContext
): DocumentFragment {
  // Find handler for this element
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
 * Recursively transform an element and its children
 */
export function transformElement(
  element: Element,
  context: TransformContext = {}
): DocumentFragment {
  const fragment = document.createDocumentFragment();

  // Create or use existing StyleManager
  const styleManager = context.styleManager ?? new DefaultStyleManager();

  // Add transformChildren function and styleManager to context for recursive transformation
  const contextWithTransform: TransformContext = {
    ...context,
    styleManager,
    transformChildren: (el: Element) => transformElement(el, { ...context, styleManager }),
  };

  // Process all child nodes
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (!node) continue;

    if (node.nodeType === Node.TEXT_NODE) {
      // Clone text nodes directly
      fragment.appendChild(node.cloneNode(true));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Transform element nodes
      const childFragment = transformSingleElement(
        node as Element,
        contextWithTransform
      );
      fragment.appendChild(childFragment);
    }
    // Ignore other node types (comments, processing instructions, etc.)
  }

  return fragment;
}

/**
 * Get the StyleManager from a context, creating one if needed.
 * This is useful for handlers that need to ensure a StyleManager exists.
 */
export function getStyleManager(context: TransformContext): StyleManager {
  return context.styleManager ?? new DefaultStyleManager();
}
