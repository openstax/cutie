import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

/**
 * Handler for qti-content-body elements.
 * This is a transparent container that wraps flow content in feedback elements.
 * It simply renders its children without adding any wrapper element.
 */
class ContentBodyHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-content-body';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    if (context.transformChildren) {
      fragment.appendChild(context.transformChildren(element));
    }

    return fragment;
  }
}

registry.register('content-body', new ContentBodyHandler(), 50);
