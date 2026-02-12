import { registry } from '../../registry';
import type { ElementHandler, TransformContext } from '../../types';
import { announceFeedback } from './feedbackAnnouncer';
import { createFeedbackIcon, FEEDBACK_ICON_STYLES, isFeedbackType } from './feedbackIcons';

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
    if (context.styleManager && !context.styleManager.hasStyle('cutie-feedback-inline')) {
      context.styleManager.addStyle('cutie-feedback-inline', FEEDBACK_INLINE_STYLES);
    }
    if (context.styleManager && !context.styleManager.hasStyle('cutie-feedback-icon')) {
      context.styleManager.addStyle('cutie-feedback-icon', FEEDBACK_ICON_STYLES);
    }

    const span = document.createElement('span');
    span.className = 'cutie-feedback-inline';

    const identifier = element.getAttribute('identifier');
    if (identifier) {
      span.dataset.identifier = identifier;
    }

    const outcomeIdentifier = element.getAttribute('outcome-identifier');
    if (outcomeIdentifier) {
      span.dataset.outcomeIdentifier = outcomeIdentifier;
    }

    const feedbackType = element.getAttribute('data-feedback-type');
    if (feedbackType) {
      span.dataset.feedbackType = feedbackType;
    }

    if (feedbackType && isFeedbackType(feedbackType)) {
      span.appendChild(createFeedbackIcon(feedbackType));
    }

    if (context.transformChildren) {
      span.appendChild(context.transformChildren(element));
    }

    announceFeedback(element, span, context);

    fragment.appendChild(span);
    return fragment;
  }
}

registry.register('feedback-inline', new FeedbackInlineHandler(), 50);

const FEEDBACK_INLINE_STYLES = `
  .cutie-feedback-inline[data-feedback-type="correct"],
  .cutie-feedback-inline[data-feedback-type="incorrect"],
  .cutie-feedback-inline[data-feedback-type="info"] {
    font-style: italic;
    color: #374151;
    padding: 0.15em 0.25em;
  }

  .cutie-feedback-inline .cutie-feedback-icon {
    vertical-align: middle;
  }

  .cutie-feedback-inline .cutie-feedback-icon__svg {
    width: 1.25em;
    height: 1.25em;
  }
`;
