import { announce } from '../../../utils/liveRegion';
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
export function announceFeedback(sourceElement, renderedElement, context) {
    var _a, _b, _c;
    if (!context.state)
        return;
    const outcomeIdentifier = (_a = sourceElement.getAttribute('outcome-identifier')) !== null && _a !== void 0 ? _a : '';
    const identifier = (_b = sourceElement.getAttribute('identifier')) !== null && _b !== void 0 ? _b : '';
    const key = `${outcomeIdentifier}:${identifier}`;
    let previousKeys = context.state.get(ANNOUNCED_KEYS_STATE_KEY);
    if (!previousKeys) {
        previousKeys = new Set();
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
    const text = (_c = renderedElement.textContent) === null || _c === void 0 ? void 0 : _c.trim();
    if (text) {
        announce(context, text);
    }
    previousKeys.add(key);
}
function hasNewFeedbackAncestor(element, previousKeys) {
    var _a, _b;
    let current = element.parentElement;
    while (current) {
        const tag = current.tagName.toLowerCase();
        if (tag === 'qti-feedback-block' || tag === 'qti-feedback-inline') {
            const ancestorOutcome = (_a = current.getAttribute('outcome-identifier')) !== null && _a !== void 0 ? _a : '';
            const ancestorId = (_b = current.getAttribute('identifier')) !== null && _b !== void 0 ? _b : '';
            const ancestorKey = `${ancestorOutcome}:${ancestorId}`;
            if (!previousKeys.has(ancestorKey)) {
                return true;
            }
        }
        current = current.parentElement;
    }
    return false;
}
