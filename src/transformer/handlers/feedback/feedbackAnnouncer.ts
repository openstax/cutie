import { announce } from '../../../utils/liveRegion';
import type { TransformContext } from '../../types';

const ANNOUNCED_KEYS_STATE_KEY = 'feedbackAnnouncedKeys';

/**
 * Announces newly-visible feedback to screen readers.
 *
 * Tracks which feedback elements have been seen via a composite key stored in
 * `context.state`. On the initial render no announcement is made (the user
 * hasn't submitted yet). On subsequent renders (after `update()`), any
 * feedback with a key not previously seen is announced.
 *
 * The initial-vs-update distinction is determined by the `isUpdate` flag that
 * `mountItem` sets in persistent state after the first render completes.
 *
 * A nesting guard prevents double-announcement when a parent feedback element
 * and its child are both new — only the outermost ancestor announces.
 */
export function announceFeedback(
  sourceElement: Element,
  renderedElement: HTMLElement,
  context: TransformContext
): void {
  if (!context.state) return;

  const outcomeIdentifier = sourceElement.getAttribute('outcome-identifier') ?? '';
  const identifier = sourceElement.getAttribute('identifier') ?? '';
  const key = `${outcomeIdentifier}:${identifier}`;

  let previousKeys = context.state.get(ANNOUNCED_KEYS_STATE_KEY) as Set<string> | undefined;
  if (!previousKeys) {
    previousKeys = new Set<string>();
    context.state.set(ANNOUNCED_KEYS_STATE_KEY, previousKeys);
  }

  const isUpdate = context.state.get('isUpdate') === true;

  if (!isUpdate || previousKeys.has(key)) {
    previousKeys.add(key);
    return;
  }

  // Nesting guard: skip if an ancestor feedback element is also new
  if (hasNewFeedbackAncestor(sourceElement, previousKeys)) {
    previousKeys.add(key);
    return;
  }

  const text = renderedElement.textContent?.trim();
  if (text) {
    announce(context, text);
  }

  previousKeys.add(key);
}

function hasNewFeedbackAncestor(element: Element, previousKeys: Set<string>): boolean {
  let current = element.parentElement;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'qti-feedback-block' || tag === 'qti-feedback-inline') {
      const ancestorOutcome = current.getAttribute('outcome-identifier') ?? '';
      const ancestorId = current.getAttribute('identifier') ?? '';
      const ancestorKey = `${ancestorOutcome}:${ancestorId}`;
      if (!previousKeys.has(ancestorKey)) {
        return true;
      }
    }
    current = current.parentElement;
  }
  return false;
}
