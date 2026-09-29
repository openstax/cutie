import type { TransformContext } from '../transformer/types';

/**
 * Wrap a learner-event listener so that, when running it changes the response
 * (as read by `readResponse`), the change is reported via
 * `itemState.notifyResponseChange()`.
 *
 * Use this for interactions whose single learner gesture can apply several
 * internal mutations (e.g. moving an association = remove + create): the
 * response is compared before and after the whole listener, so exactly one
 * report is made per gesture and gestures that change nothing (selecting,
 * cancelling) are not reported. Mutations made outside wrapped listeners —
 * such as restoring qti-default-value — are never reported.
 */
export function reportResponseChanges<E extends Event>(
  context: TransformContext,
  readResponse: () => unknown,
  listener: (event: E) => void,
): (event: E) => void {
  return (event) => {
    const before = JSON.stringify(readResponse());
    listener(event);
    if (JSON.stringify(readResponse()) !== before) {
      context.itemState?.notifyResponseChange();
    }
  };
}
