"use strict";
/**
 * DOM traversal utilities for QTI processing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildElements = getChildElements;
exports.getFirstChildElement = getFirstChildElement;
/**
 * Generator that yields child element nodes (lazy evaluation)
 * More efficient than creating arrays for iteration
 *
 * @param element - Parent element to traverse
 * @yields Child elements (nodeType === 1)
 */
function* getChildElements(element) {
    for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i];
        if (node.nodeType === 1) { // ELEMENT_NODE
            yield node;
        }
    }
}
/**
 * Gets the first child element node
 *
 * @param element - Parent element
 * @returns First child element or null if none found
 */
function getFirstChildElement(element) {
    for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i];
        if (node.nodeType === 1) { // ELEMENT_NODE
            return node;
        }
    }
    return null;
}
