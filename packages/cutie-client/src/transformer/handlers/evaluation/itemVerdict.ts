import { announce } from '../../../utils/liveRegion.js';
import type { TransformContext } from '../../types.js';
import { registerFeedbackBlockStyles } from '../feedback/feedbackBlock.js';
import { createFeedbackIcon } from '../feedback/feedbackIcons.js';
import { getVerdict, type Verdict } from './evaluationDisplay.js';

const ITEM_VERDICT_TEXT: Record<Verdict, string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  partial: 'Partially correct',
};

/**
 * Create a block stating a verdict on the item as a whole: a feedback block
 * with the verdict's icon and text. Partial uses the info color with its own
 * half-filled icon, distinct from correct and incorrect.
 *
 * The verdict is new whenever it is sent, so it is announced on any render
 * after the first (a render that resumes the attempt shows it without
 * announcing it).
 */
export function createVerdictBlock(verdict: Verdict, text: string, context: TransformContext): HTMLDivElement {
  registerFeedbackBlockStyles(context);

  const block = document.createElement('div');
  block.className = 'cutie-feedback-block cutie-verdict-block';
  block.dataset.feedbackType = verdict === 'partial' ? 'info' : verdict;
  block.appendChild(createFeedbackIcon(verdict, { decorative: true }));

  const message = document.createElement('p');
  message.textContent = text;
  block.appendChild(message);

  if (context.state?.get('isUpdate') === true && text) {
    announce(context, text);
  }

  return block;
}

/**
 * Create the block stating the verdict core placed on the item body for a
 * finished attempt (see the showEvaluation delivery option), or null when
 * there is none.
 */
export function createItemVerdict(itemBody: Element, context: TransformContext): HTMLDivElement | null {
  const verdict = getVerdict(itemBody);
  return verdict ? createVerdictBlock(verdict, ITEM_VERDICT_TEXT[verdict], context) : null;
}
