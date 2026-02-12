import { registry } from '../../registry';
import type { ElementHandler, TransformContext } from '../../types';
import { announceFeedback } from './feedbackAnnouncer';
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
    if (context.styleManager && !context.styleManager.hasStyle('cutie-feedback-block')) {
      context.styleManager.addStyle('cutie-feedback-block', FEEDBACK_BLOCK_STYLES);
    }
    if (context.styleManager && !context.styleManager.hasStyle('cutie-feedback-icon')) {
      context.styleManager.addStyle('cutie-feedback-icon', FEEDBACK_ICON_STYLES);
    }

    const div = document.createElement('div');
    div.className = 'cutie-feedback-block';

    const identifier = element.getAttribute('identifier');
    if (identifier) {
      div.dataset.identifier = identifier;
    }

    const outcomeIdentifier = element.getAttribute('outcome-identifier');
    if (outcomeIdentifier) {
      div.dataset.outcomeIdentifier = outcomeIdentifier;
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

    announceFeedback(element, div, context);

    fragment.appendChild(div);
    return fragment;
  }
}

registry.register('feedback-block', new FeedbackBlockHandler(), 50);

const FEEDBACK_BLOCK_STYLES = `
  .cutie-feedback-block[data-feedback-type="correct"],
  .cutie-feedback-block[data-feedback-type="incorrect"],
  .cutie-feedback-block[data-feedback-type="info"] {
    display: block;
    position: relative;
    margin: 0.75em 0;
    padding: 0.75em 1em 0.75em 2.25em;
    background-color: #f3f4f6;
    color: #374151;
    font-style: italic;
  }

  .cutie-feedback-block .cutie-feedback-icon {
    position: absolute;
    left: 0.625em;
    top: 0.75em;
  }

  .cutie-feedback-block[data-feedback-type="correct"] {
    border-left: 0.5em solid #22c55e;
  }

  .cutie-feedback-block[data-feedback-type="incorrect"] {
    border-left: 0.5em solid #ef4444;
  }

  .cutie-feedback-block[data-feedback-type="info"] {
    border-left: 0.5em solid #4a90e2;
  }
`;
