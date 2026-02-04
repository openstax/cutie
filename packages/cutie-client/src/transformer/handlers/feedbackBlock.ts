import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

/**
 * Handler for qti-feedback-block elements.
 * Renders block-level feedback content that appears as distinct sections.
 *
 * Server-side (cutie-core) has already handled visibility logic.
 * By the time XML reaches the client, only visible feedback elements remain.
 */
class FeedbackBlockHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-feedback-block';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('qti-feedback-block')) {
      context.styleManager.addStyle('qti-feedback-block', FEEDBACK_BLOCK_STYLES);
    }

    const div = document.createElement('div');
    div.className = 'qti-feedback-block';

    const identifier = element.getAttribute('identifier');
    if (identifier) {
      div.dataset.identifier = identifier;
    }

    if (context.transformChildren) {
      div.appendChild(context.transformChildren(element));
    }

    fragment.appendChild(div);
    return fragment;
  }
}

registry.register('feedback-block', new FeedbackBlockHandler(), 50);

const FEEDBACK_BLOCK_STYLES = `
  .qti-feedback-block {
    display: block;
    margin: 0.75em 0;
    padding: 0.75em 1em;
    border-left: 3px solid #5a6a7a;
    background-color: #f5f7f9;
    font-style: italic;
  }
`;
