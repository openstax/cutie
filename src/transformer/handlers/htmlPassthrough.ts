import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

/**
 * Handler for standard HTML/XHTML elements
 * Passes through any non-qti elements as-is
 */
class HtmlPassthroughHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    // Handle any element that doesn't start with "qti-"
    return !element.tagName.toLowerCase().startsWith('qti-');
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Clone the element with the same tag name
    const cloned = document.createElement(element.tagName);

    // Copy all attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr) {
        cloned.setAttribute(attr.name, attr.value);
      }
    }

    // Recursively transform children using context function
    if (context.transformChildren) {
      const childrenFragment = context.transformChildren(element);
      cloned.appendChild(childrenFragment);
    }

    fragment.appendChild(cloned);
    return fragment;
  }
}

// Register with lowest priority (catch-all for non-qti elements)
registry.register('html-passthrough', new HtmlPassthroughHandler(), 1000);
