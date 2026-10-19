import { announce } from '../../../utils/liveRegion.js';
import type { TransformContext } from '../../types.js';

/** The feedback the previous render showed */
const SHOWN_KEYS_STATE_KEY = 'feedbackShownKeys';
/** The feedback the render in progress shows */
const RENDER_KEYS_STATE_KEY = 'feedbackRenderKeys';

/**
 * Starts tracking the feedback a render shows. `mountItem` calls it before
 * transforming the item.
 */
export function beginFeedbackRender(state: Map<string, unknown>): void {
  state.set(RENDER_KEYS_STATE_KEY, new Set<string>());
}

/**
 * Finishes a render: the feedback it showed is what the next render compares
 * with. `mountItem` calls it once the item is transformed.
 */
export function endFeedbackRender(state: Map<string, unknown>): void {
  state.set(SHOWN_KEYS_STATE_KEY, state.get(RENDER_KEYS_STATE_KEY) ?? new Set<string>());
}

/**
 * Announces newly-visible feedback to screen readers.
 *
 * Feedback is identified by its visibility condition (tag, outcome-identifier
 * and identifier), as cutie-core's hasNewFeedback identifies it: elements that
 * share a condition appear and disappear together. Each render records the
 * feedback it shows, and a render after
 * the first (after `update()`, per the `isUpdate` flag `mountItem` sets)
 * announces feedback the previous render did not show. Feedback that stays
 * visible is not repeated; feedback that went away and comes back (e.g. a
 * hint on a fresh try) is announced again, as cutie-core's hasNewFeedback
 * counts it. The first render announces nothing (nothing has been submitted).
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

  const key = feedbackKey(sourceElement);

  let renderKeys = context.state.get(RENDER_KEYS_STATE_KEY) as Set<string> | undefined;
  if (!renderKeys) {
    renderKeys = new Set<string>();
    context.state.set(RENDER_KEYS_STATE_KEY, renderKeys);
  }
  renderKeys.add(key);

  const shownKeys = (context.state.get(SHOWN_KEYS_STATE_KEY) as Set<string> | undefined) ?? new Set<string>();
  const isUpdate = context.state.get('isUpdate') === true;

  if (!isUpdate || shownKeys.has(key)) return;

  // Nesting guard: skip if an ancestor feedback element is also new
  if (hasNewFeedbackAncestor(sourceElement, shownKeys)) return;

  const text = renderedElement.textContent?.trim();
  if (text) {
    announce(context, text);
  }
}

function feedbackKey(element: Element): string {
  const outcomeIdentifier = element.getAttribute('outcome-identifier') ?? '';
  return `${element.tagName.toLowerCase()}|${outcomeIdentifier}|${element.getAttribute('identifier') ?? ''}`;
}

function hasNewFeedbackAncestor(element: Element, shownKeys: Set<string>): boolean {
  let current = element.parentElement;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if ((tag === 'qti-feedback-block' || tag === 'qti-feedback-inline') && !shownKeys.has(feedbackKey(current))) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}
