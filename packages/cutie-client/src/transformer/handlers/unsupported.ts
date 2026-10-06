import { createUnsupportedElement } from '../../errors/errorDisplay.js';
import { registry } from '../registry.js';
import type { ElementHandler, TransformContext } from '../types.js';

/**
 * Handler for unsupported qti-* elements
 * Shows error UI for any qti-* element that isn't handled by a specific handler
 */
class UnsupportedHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    // Handle any element that starts with "qti-"
    return element.tagName.toLowerCase().startsWith('qti-');
  }

  transform(element: Element, _context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const errorElement = createUnsupportedElement(element.tagName.toLowerCase());
    fragment.appendChild(errorElement);
    return fragment;
  }
}

// Register with mid priority (after specific qti-* handlers, before HTML passthrough)
registry.register('unsupported-qti', new UnsupportedHandler(), 500);
