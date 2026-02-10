import type { TransformContext } from '../transformer/types';

let pendingMessages: string[] = [];
let flushScheduled = false;
let flushCtx: TransformContext | null = null;
let liveRegion: HTMLElement | null = null;

function getOrCreateLiveRegion(ctx: TransformContext): HTMLElement {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = LIVE_REGION_STYLES;
    document.body.appendChild(liveRegion);
    ctx.onCleanup?.(() => {
      liveRegion?.remove();
      liveRegion = null;
    });
  }
  return liveRegion;
}

function flush(): void {
  const ctx = flushCtx;
  const messages = pendingMessages;
  pendingMessages = [];
  flushScheduled = false;
  flushCtx = null;

  if (!ctx || messages.length === 0) return;

  getOrCreateLiveRegion(ctx).textContent = messages.join(' ');
}

/**
 * Announces a message to screen readers via a shared live region.
 * Messages within the same microtask are batched and concatenated.
 */
export function announce(ctx: TransformContext, message: string): void {
  pendingMessages.push(message);
  flushCtx = ctx;

  if (!flushScheduled) {
    flushScheduled = true;
    queueMicrotask(flush);
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
