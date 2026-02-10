import { registry } from '../../registry';
import type { ElementHandler, TransformContext } from '../../types';
import { createFeedbackIcon, FEEDBACK_ICON_STYLES, isFeedbackType } from './feedbackIcons';

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
    if (context.styleManager && !context.styleManager.hasStyle('qti-feedback-icon')) {
      context.styleManager.addStyle('qti-feedback-icon', FEEDBACK_ICON_STYLES);
    }

    const div = document.createElement('div');
    div.className = 'qti-feedback-block';

    const identifier = element.getAttribute('identifier');
    if (identifier) {
      div.dataset.identifier = identifier;
    }

    const feedbackType = element.getAttribute('data-feedback-type');
    if (feedbackType) {
      div.dataset.feedbackType = feedbackType;
    }

    if (feedbackType && isFeedbackType(feedbackType)) {
      div.appendChild(createFeedbackIcon(feedbackType));
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
  .qti-feedback-block[data-feedback-type="correct"],
  .qti-feedback-block[data-feedback-type="incorrect"],
  .qti-feedback-block[data-feedback-type="info"] {
    display: block;
    position: relative;
    margin: 0.75em 0;
    padding: 0.75em 1em 0.75em 2.25em;
    background-color: #f3f4f6;
    color: #374151;
    font-style: italic;
  }

  .qti-feedback-block .qti-feedback-icon {
    position: absolute;
    left: 0.625em;
    top: 0.75em;
  }

  .qti-feedback-block[data-feedback-type="correct"] {
    border-left: 0.5em solid #22c55e;
  }

  .qti-feedback-block[data-feedback-type="incorrect"] {
    border-left: 0.5em solid #ef4444;
  }

  .qti-feedback-block[data-feedback-type="info"] {
    border-left: 0.5em solid #4a90e2;
  }
`;
