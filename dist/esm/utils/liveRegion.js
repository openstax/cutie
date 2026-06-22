const regions = {
    polite: { element: null, pendingMessages: [], flushScheduled: false, flushCtx: null },
    assertive: { element: null, pendingMessages: [], flushScheduled: false, flushCtx: null },
};
function getOrCreateLiveRegion(ctx, urgency) {
    var _a;
    const state = regions[urgency];
    if (!state.element) {
        state.element = document.createElement('div');
        state.element.setAttribute('aria-live', urgency);
        state.element.setAttribute('aria-atomic', 'true');
        state.element.style.cssText = LIVE_REGION_STYLES;
        document.body.appendChild(state.element);
        (_a = ctx.onCleanup) === null || _a === void 0 ? void 0 : _a.call(ctx, () => {
            var _a;
            (_a = state.element) === null || _a === void 0 ? void 0 : _a.remove();
            state.element = null;
        });
    }
    return state.element;
}
function createFlush(urgency) {
    return () => {
        const state = regions[urgency];
        const ctx = state.flushCtx;
        const messages = state.pendingMessages;
        state.pendingMessages = [];
        state.flushScheduled = false;
        state.flushCtx = null;
        if (!ctx || messages.length === 0)
            return;
        getOrCreateLiveRegion(ctx, urgency).textContent = messages.join(' ');
    };
}
const flushPolite = createFlush('polite');
const flushAssertive = createFlush('assertive');
/**
 * Announces a message to screen readers via a shared live region.
 * Messages within the same microtask are batched and concatenated.
 *
 * @param urgency - `'polite'` (default) waits for the user to be idle;
 *                  `'assertive'` interrupts immediately.
 */
export function announce(ctx, message, urgency = 'polite') {
    const state = regions[urgency];
    state.pendingMessages.push(message);
    state.flushCtx = ctx;
    if (!state.flushScheduled) {
        state.flushScheduled = true;
        queueMicrotask(urgency === 'assertive' ? flushAssertive : flushPolite);
    }
}
/**
 * CSS styles for visually hiding live regions while keeping them accessible.
 */
export const LIVE_REGION_STYLES = `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
