/**
 * Drag and drop utilities for interactive elements.
 */

/** CSS class constants for drag/drop states */
export const DRAG_CLASSES = {
  dragging: '--dragging',
  dropTarget: '--drop-target',
  dragOver: '--drag-over',
} as const;

export interface DragSourceCallbacks {
  /** Called when drag starts. Return false to cancel the drag. */
  onDragStart?: () => boolean | void;
  /** Called when drag ends */
  onDragEnd?: () => void;
  /** Return false to prevent dragging */
  canDrag?: () => boolean;
}

export interface DropTargetCallbacks {
  /** Called during dragover. Call e.preventDefault() to allow drop. */
  onDragOver?: (e: DragEvent) => void;
  /** Called when drag leaves the target */
  onDragLeave?: (e: DragEvent) => void;
  /** Called when an item is dropped. Receives the data type prefix and id. */
  onDrop?: (dataPrefix: string, dataId: string) => void;
  /** Return false to prevent accepting drops */
  canDrop?: () => boolean;
}

/**
 * Wire an element as a drag source.
 * @param element The element to make draggable
 * @param dataPrefix Data type prefix (e.g., "choice", "gap")
 * @param id Identifier for the dragged item
 * @param draggingClass CSS class to add while dragging
 * @param callbacks Event callbacks
 */
export function wireDragSource(
  element: HTMLElement,
  dataPrefix: string,
  id: string,
  draggingClass: string,
  callbacks: DragSourceCallbacks = {}
): void {
  element.addEventListener('dragstart', (e) => {
    if (callbacks.canDrag && !callbacks.canDrag()) {
      e.preventDefault();
      return;
    }

    if (callbacks.onDragStart) {
      const result = callbacks.onDragStart();
      if (result === false) {
        e.preventDefault();
        return;
      }
    }

    e.dataTransfer?.setData('text/plain', `${dataPrefix}:${id}`);
    element.classList.add(draggingClass);
  });

  element.addEventListener('dragend', () => {
    element.classList.remove(draggingClass);
    callbacks.onDragEnd?.();
  });
}

/**
 * Wire an element as a drop target.
 * @param element The element to accept drops
 * @param dragOverClass CSS class to add during dragover
 * @param callbacks Event callbacks
 */
export function wireDropTarget(
  element: HTMLElement,
  dragOverClass: string,
  callbacks: DropTargetCallbacks = {}
): void {
  element.addEventListener('dragover', (e) => {
    if (callbacks.canDrop && !callbacks.canDrop()) {
      return;
    }

    e.preventDefault();
    element.classList.add(dragOverClass);
    callbacks.onDragOver?.(e);
  });

  element.addEventListener('dragleave', (e) => {
    element.classList.remove(dragOverClass);
    callbacks.onDragLeave?.(e);
  });

  element.addEventListener('drop', (e) => {
    if (callbacks.canDrop && !callbacks.canDrop()) {
      return;
    }

    e.preventDefault();
    element.classList.remove(dragOverClass);

    const data = e.dataTransfer?.getData('text/plain');
    if (data && callbacks.onDrop) {
      const colonIndex = data.indexOf(':');
      if (colonIndex !== -1) {
        const prefix = data.slice(0, colonIndex);
        const id = data.slice(colonIndex + 1);
        callbacks.onDrop(prefix, id);
      }
    }
  });
}

/**
 * Highlight valid drop targets.
 * @param elements Elements to potentially highlight
 * @param highlightClass CSS class to add for highlighting
 * @param isValid Optional predicate to determine which elements to highlight
 */
export function highlightDropTargets(
  elements: Iterable<HTMLElement>,
  highlightClass: string,
  isValid?: (el: HTMLElement) => boolean
): void {
  for (const element of elements) {
    if (!isValid || isValid(element)) {
      element.classList.add(highlightClass);
    }
  }
}

/**
 * Clear drop target highlights from elements.
 * @param elements Elements to clear highlights from
 * @param highlightClass CSS class to remove
 */
export function clearDropTargetHighlights(
  elements: Iterable<HTMLElement>,
  highlightClass: string
): void {
  for (const element of elements) {
    element.classList.remove(highlightClass);
  }
}

/**
 * Parse drag data from a drop event.
 * @returns Object with prefix and id, or null if invalid
 */
export function parseDragData(
  e: DragEvent
): { prefix: string; id: string } | null {
  const data = e.dataTransfer?.getData('text/plain');
  if (!data) return null;

  const colonIndex = data.indexOf(':');
  if (colonIndex === -1) return null;

  return {
    prefix: data.slice(0, colonIndex),
    id: data.slice(colonIndex + 1),
  };
}
