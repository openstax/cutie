"use strict";
/**
 * Drag and drop utilities for interactive elements.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightDropTargets = highlightDropTargets;
exports.clearDropTargetHighlights = clearDropTargetHighlights;
/**
 * Highlight valid drop targets.
 * @param elements Elements to potentially highlight
 * @param highlightClass CSS class to add for highlighting
 * @param isValid Optional predicate to determine which elements to highlight
 */
function highlightDropTargets(elements, highlightClass, isValid) {
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
function clearDropTargetHighlights(elements, highlightClass) {
    for (const element of elements) {
        element.classList.remove(highlightClass);
    }
}
