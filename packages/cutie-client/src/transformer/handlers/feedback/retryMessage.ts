import { registry } from '../../registry.js';
import type { ElementHandler, TransformContext } from '../../types.js';
import { createVerdictBlock } from '../evaluation/itemVerdict.js';

const RETRY_VERDICTS = ['incorrect', 'partial'] as const;
type RetryVerdict = (typeof RETRY_VERDICTS)[number];

/**
 * Handler for the retry message cutie-core leads an item's body with when it
 * starts a fresh try (see the maxTries and retryMessage delivery options): a
 * div whose data-cutie-retry holds the last try's verdict on the item as a
 * whole. Drawn as a verdict block (see createVerdictBlock).
 */
class RetryMessageHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'div' && element.hasAttribute('data-cutie-retry');
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const value = element.getAttribute('data-cutie-retry');
    const verdict: RetryVerdict = RETRY_VERDICTS.includes(value as RetryVerdict)
      ? (value as RetryVerdict)
      : 'incorrect';

    const block = createVerdictBlock(verdict, element.textContent ?? '', context);
    block.classList.add('cutie-retry-message');

    const fragment = document.createDocumentFragment();
    fragment.appendChild(block);
    return fragment;
  }
}

registry.register('retry-message', new RetryMessageHandler(), 50);
