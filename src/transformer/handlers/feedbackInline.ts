import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

/**
 * Handler for qti-feedback-inline elements.
 * Renders inline feedback content that appears within flowing text.
 *
 * Server-side (cutie-core) has already handled visibility logic.
 * By the time XML reaches the client, only visible feedback elements remain.
 */
class FeedbackInlineHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-feedback-inline';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('qti-feedback-inline')) {
      context.styleManager.addStyle('qti-feedback-inline', FEEDBACK_INLINE_STYLES);
    }

    const span = document.createElement('span');
    span.className = 'qti-feedback-inline';

    const identifier = element.getAttribute('identifier');
    if (identifier) {
      span.dataset.identifier = identifier;
    }

    if (context.transformChildren) {
      span.appendChild(context.transformChildren(element));
    }

    fragment.appendChild(span);
    return fragment;
  }
}

registry.register('feedback-inline', new FeedbackInlineHandler(), 50);

const FEEDBACK_INLINE_STYLES = `
  .qti-feedback-inline {
    display: inline;
    font-style: italic;
    color: #4a5a6a;
    background-color: #f5f7f9;
    padding: 0.15em 0.5em;
    border-left: 2px solid #8a9aaa;
    border-radius: 0 3px 3px 0;
  }
`;
