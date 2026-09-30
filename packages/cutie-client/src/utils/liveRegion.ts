import type { TransformContext } from '../transformer/types';

type Urgency = 'polite' | 'assertive';

/** A queued message, with the mounted item it came from */
interface PendingMessage {
  message: string;
  source: object;
}

interface LiveRegionState {
  element: HTMLElement | null;
  pendingMessages: PendingMessage[];
  flushScheduled: boolean;
  announceToggle: boolean;
}

const regions: Record<Urgency, LiveRegionState> = {
  polite: { element: null, pendingMessages: [], flushScheduled: false, announceToggle: false },
  assertive: { element: null, pendingMessages: [], flushScheduled: false, announceToggle: false },
};

/**
 * The mounted item a context renders: its persistent state, shared by every
 * render of the item, or the context itself when it has none.
 */
function sourceOf(ctx: TransformContext): object {
  return ctx.state ?? ctx;
}

/** Mounted items holding the live regions (see acquireLiveRegions) */
let holders = 0;

function getOrCreateLiveRegion(urgency: Urgency): HTMLElement {
  const state = regions[urgency];
  if (!state.element) {
    state.element = document.createElement('div');
    state.element.setAttribute('aria-live', urgency);
    state.element.setAttribute('aria-atomic', 'true');
    state.element.style.cssText = LIVE_REGION_STYLES;
    document.body.appendChild(state.element);
  }
  return state.element;
}

function removeLiveRegions(): void {
  for (const state of Object.values(regions)) {
    state.element?.remove();
    state.element = null;
    // Drop anything queued, so a later flush neither recreates a region no
    // one holds nor announces a stale message in another item's regions
    state.pendingMessages = [];
  }
}

/**
 * Takes a hold on the live regions for a mounted item, creating and inserting
 * both if no other mounted item holds them, and returns a release. The regions
 * are shared by every mounted item and removed when the last holder releases
 * them. Call once per mount, before any announce() calls — a screen reader
 * needs a live region to already exist in the accessibility tree before its
 * content is mutated, or the first announcement may be missed.
 *
 * @param holder - The mounted item: the `state` its render contexts carry.
 *   Releasing drops the messages it queued that have not been announced yet,
 *   so an item that is gone is never heard from.
 */
export function acquireLiveRegions(holder: object): () => void {
  holders++;
  getOrCreateLiveRegion('polite');
  getOrCreateLiveRegion('assertive');

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders--;
    for (const state of Object.values(regions)) {
      state.pendingMessages = state.pendingMessages.filter((pending) => pending.source !== holder);
    }
    if (holders === 0) removeLiveRegions();
  };
}

function createFlush(urgency: Urgency): () => void {
  return () => {
    const state = regions[urgency];
    const messages = state.pendingMessages.map((pending) => pending.message);
    state.pendingMessages = [];
    state.flushScheduled = false;

    if (messages.length === 0) return;

    // Append an invisible, alternating marker so the live region's text
    // still changes even when a message repeats verbatim — screen readers
    // key off content changing, not off this function having been called.
    state.announceToggle = !state.announceToggle;
    const marker = state.announceToggle ? '\u200B' : '';
    getOrCreateLiveRegion(urgency).textContent = messages.join(' ') + marker;
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
  state.pendingMessages.push({ message, source: sourceOf(ctx) });

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
