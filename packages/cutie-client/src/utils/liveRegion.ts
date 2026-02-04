/**
 * Creates an ARIA live region for screen reader announcements.
 * The region is visually hidden but accessible to assistive technology.
 */
export function createLiveRegion(className: string): HTMLElement {
  const region = document.createElement('div');
  region.className = className;
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  return region;
}

/**
 * Announces a message to screen readers via a live region.
 */
export function announce(liveRegion: HTMLElement, message: string): void {
  liveRegion.textContent = message;
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
