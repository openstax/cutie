/**
 * Shared utilities for interaction handlers.
 */

export {
  announce,
  LIVE_REGION_STYLES,
} from './liveRegion.js';

export {
  focusNext,
  focusPrev,
  updateRovingTabindex,
  initializeRovingTabindex,
} from './rovingTabindex.js';

export { highlightDropTargets, clearDropTargetHighlights } from './dragDrop.js';

export { reportResponseChanges } from './responseChange.js';

export { addAriaDescribedBy } from './aria.js';
