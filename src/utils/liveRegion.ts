import type { TransformContext } from '../transformer/types';

type Urgency = 'polite' | 'assertive';

interface LiveRegionState {
  element: HTMLElement | null;
  pendingMessages: string[];
  flushScheduled: boolean;
  flushCtx: TransformContext | null;
}

const regions: Record<Urgency, LiveRegionState> = {
  polite: { element: null, pendingMessages: [], flushScheduled: false, flushCtx: null },
  assertive: { element: null, pendingMessages: [], flushScheduled: false, flushCtx: null },
};

function getOrCreateLiveRegion(ctx: TransformContext, urgency: Urgency): HTMLElement {
  const state = regions[urgency];
  if (!state.element) {
    state.element = document.createElement('div');
    state.element.setAttribute('aria-live', urgency);
    state.element.setAttribute('aria-atomic', 'true');
    state.element.style.cssText = LIVE_REGION_STYLES;
    document.body.appendChild(state.element);
    ctx.onCleanup?.(() => {
      state.element?.remove();
      state.element = null;
    });
  }
  return state.element;
}

function createFlush(urgency: Urgency): () => void {
  return () => {
    const state = regions[urgency];
    const ctx = state.flushCtx;
    const messages = state.pendingMessages;
    state.pendingMessages = [];
    state.flushScheduled = false;
    state.flushCtx = null;

    if (!ctx || messages.length === 0) return;

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
export function announce(
  ctx: TransformContext,
  message: string,
  urgency: Urgency = 'polite'
): void {
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
