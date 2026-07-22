import type { TransformContext } from '../transformer/types';

type Urgency = 'polite' | 'assertive';

interface LiveRegionState {
  element: HTMLElement | null;
  setText: ((text: string) => void) | null;
  pendingMessages: string[];
  flushScheduled: boolean;
  flushCtx: TransformContext | null;
}

const regions: Record<Urgency, LiveRegionState> = {
  polite: { element: null, setText: null, pendingMessages: [], flushScheduled: false, flushCtx: null },
  assertive: { element: null, setText: null, pendingMessages: [], flushScheduled: false, flushCtx: null },
};

// Browsers throttle how often accessibility-tree diffs are pushed to the OS
// accessibility API, independently of paint/frame timing — often on the order of
// ~100ms. Two mutations spaced only an animation frame apart (~16ms) can land inside
// the same throttle window and collapse into a single "no net change" event before
// screen readers ever see it. This delay is chosen to comfortably clear that window.
const RESTORE_DELAY_MS = 150;

/**
 * Wraps a text node's `textContent` updates so that setting the same text twice in a
 * row still produces a DOM mutation screen readers can react to. Screen readers
 * (VoiceOver in particular) won't re-announce an `aria-live` region whose `textContent`
 * is assigned an unchanged value.
 *
 * The text is always applied synchronously, so callers (and tests) can read it back
 * immediately. Only when the incoming text is identical to what was set last time —
 * the case a plain assignment can't surface as a mutation — does this additionally
 * clear the node on the next animation frame and restore the text after a short delay,
 * forcing a genuine empty -> non-empty transition for the live region to announce.
 */
export function createForcedTextSetter(node: HTMLElement): (text: string) => void {
  let lastText = node.textContent;
  let clearHandle: number | null = null;
  let restoreHandle: ReturnType<typeof setTimeout> | null = null;

  return (text: string) => {
    if (clearHandle !== null) cancelAnimationFrame(clearHandle);
    if (restoreHandle !== null) clearTimeout(restoreHandle);
    clearHandle = null;
    restoreHandle = null;

    const unchanged = text === lastText;
    node.textContent = text;
    lastText = text;

    if (unchanged) {
      clearHandle = requestAnimationFrame(() => {
        clearHandle = null;
        node.textContent = '';
        restoreHandle = setTimeout(() => {
          restoreHandle = null;
          node.textContent = text;
        }, RESTORE_DELAY_MS);
      });
    }
  };
}

function getOrCreateLiveRegion(ctx: TransformContext, urgency: Urgency): HTMLElement {
  const state = regions[urgency];
  if (!state.element) {
    state.element = document.createElement('div');
    state.element.setAttribute('aria-live', urgency);
    state.element.setAttribute('aria-atomic', 'true');
    state.element.style.cssText = LIVE_REGION_STYLES;
    document.body.appendChild(state.element);
    state.setText = createForcedTextSetter(state.element);
    ctx.onCleanup?.(() => {
      state.element?.remove();
      state.element = null;
      state.setText = null;
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

    getOrCreateLiveRegion(ctx, urgency);
    state.setText?.(messages.join(' '));
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
