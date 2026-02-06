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

    const feedbackType = element.getAttribute('data-feedback-type');
    if (feedbackType) {
      span.dataset.feedbackType = feedbackType;
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
  .qti-feedback-inline[data-feedback-type="correct"],
  .qti-feedback-inline[data-feedback-type="incorrect"],
  .qti-feedback-inline[data-feedback-type="info"] {
    display: inline;
    font-style: italic;
    color: #374151;
    padding: 0.15em 0.5em;
    border-radius: 3px;
    line-height: 1.6;
  }

  .qti-feedback-inline[data-feedback-type="correct"]::before,
  .qti-feedback-inline[data-feedback-type="incorrect"]::before,
  .qti-feedback-inline[data-feedback-type="info"]::before {
    content: " ";
    margin-right: 0.5em;
  }

  .qti-feedback-inline[data-feedback-type="correct"]::before {
    border-left: 0.5em solid #22c55e;
  }

  .qti-feedback-inline[data-feedback-type="incorrect"]::before {
    border-left: 0.5em solid #ef4444;
  }

  .qti-feedback-inline[data-feedback-type="info"]::before {
    border-left: 0.5em solid #4a90e2;
  }
`;
