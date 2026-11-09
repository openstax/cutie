import { announce } from '../../../utils/liveRegion.js';
import type { TransformContext } from '../../types.js';
import { registerFeedbackBlockStyles } from '../feedback/feedbackBlock.js';
import { createFeedbackIcon } from '../feedback/feedbackIcons.js';

const VERDICTS = ['correct', 'incorrect', 'partial'] as const;

export type Verdict = (typeof VERDICTS)[number];

const VERDICT_TEXT: Record<Verdict, string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  partial: 'Partially correct',
};

/**
 * Read the verdict core placed on the item body.
 * Returns null when absent (the response couldn't be judged) or unrecognized.
 */
export function getVerdict(itemBody: Element): Verdict | null {
  const value = itemBody.getAttribute('data-cutie-evaluation');
  return VERDICTS.includes(value as Verdict) ? (value as Verdict) : null;
}

/**
 * Create the block stating the verdict core placed on the item body, or null
 * when there is none: a feedback block with the verdict's icon and either the
 * retry message core sent with it (on a fresh try, see the maxTries and
 * retryMessage delivery options) or the verdict itself (once the attempt is
 * finished, see the showEvaluation delivery option). Partial uses the info
 * color with its own half-filled icon, distinct from correct and incorrect.
 *
 * The verdict is never conveyed by the icon alone: a retry message is the
 * host's text and needn't name the verdict, so the icon then carries the
 * verdict as its accessible label, and the announcement leads with it.
 *
 * The verdict is new whenever it is sent, so it is announced on any render
 * after the first (a render that resumes the attempt shows it without
 * announcing it).
 */
export function createItemVerdict(itemBody: Element, context: TransformContext): HTMLDivElement | null {
  const verdict = getVerdict(itemBody);
  if (!verdict) return null;

  const retryMessage = itemBody.getAttribute('data-cutie-retry-message');
  const verdictText = VERDICT_TEXT[verdict];
  registerFeedbackBlockStyles(context);

  const block = document.createElement('div');
  block.className = 'cutie-feedback-block cutie-item-verdict';
  block.dataset.feedbackType = verdict === 'partial' ? 'info' : verdict;
  block.appendChild(createFeedbackIcon(verdict, { decorative: retryMessage === null }));

  const message = document.createElement('p');
  message.textContent = retryMessage ?? verdictText;
  block.appendChild(message);

  if (context.state?.get('isUpdate') === true) {
    announce(context, retryMessage === null ? verdictText : `${verdictText}: ${retryMessage}`);
  }

  return block;
}
