/**
 * Shared utilities for interaction handlers.
 */

export { shuffleWithFixed } from './shuffleWithFixed';

export {
  createLiveRegion,
  announce,
  LIVE_REGION_STYLES,
} from './liveRegion';

export {
  focusNext,
  focusPrev,
  updateRovingTabindex,
  initializeRovingTabindex,
} from './rovingTabindex';

export {
  DRAG_CLASSES,
  wireDragSource,
  wireDropTarget,
  highlightDropTargets,
  clearDropTargetHighlights,
  parseDragData,
} from './dragDrop';

export type {
  DragSourceCallbacks,
  DropTargetCallbacks,
} from './dragDrop';
