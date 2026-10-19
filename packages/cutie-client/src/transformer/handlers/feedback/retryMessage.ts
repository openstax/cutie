import { announce } from '../../../utils/liveRegion.js';
import { registry } from '../../registry.js';
import type { ElementHandler, TransformContext } from '../../types.js';
import { registerFeedbackBlockStyles } from './feedbackBlock.js';
import { createFeedbackIcon } from './feedbackIcons.js';

const RETRY_VERDICTS = ['incorrect', 'partial'] as const;
type RetryVerdict = (typeof RETRY_VERDICTS)[number];

/**
 * Handler for the retry message cutie-core leads an adaptive item's body with
 * when it starts a fresh try (see the maxTries and adaptiveRetryMessage
 * delivery options): a div whose data-cutie-retry holds the last try's verdict.
 *
 * Drawn as a feedback block with the verdict's icon. The message is new
 * whenever it is sent, so it is announced on any render after the first
 * (a render that resumes the attempt shows it without announcing it).
 */
class RetryMessageHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'div' && element.hasAttribute('data-cutie-retry');
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();
    registerFeedbackBlockStyles(context);

    const value = element.getAttribute('data-cutie-retry');
    const verdict: RetryVerdict = RETRY_VERDICTS.includes(value as RetryVerdict)
      ? (value as RetryVerdict)
      : 'incorrect';

    const div = document.createElement('div');
    div.className = 'cutie-feedback-block cutie-retry-message';
    div.dataset.feedbackType = verdict === 'partial' ? 'info' : 'incorrect';
    div.appendChild(createFeedbackIcon(verdict));

    const text = document.createElement('p');
    text.textContent = element.textContent ?? '';
    div.appendChild(text);

    if (context.state?.get('isUpdate') === true && text.textContent) {
      announce(context, text.textContent);
    }

    fragment.appendChild(div);
    return fragment;
  }
}

registry.register('retry-message', new RetryMessageHandler(), 50);
