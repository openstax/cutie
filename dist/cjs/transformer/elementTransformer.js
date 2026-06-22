"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransformContext = createTransformContext;
exports.transformNode = transformNode;
exports.transformChildren = transformChildren;
exports.transformElement = transformElement;
exports.getStyleManager = getStyleManager;
const errorDisplay_1 = require("../errors/errorDisplay");
const registry_1 = require("./registry");
const styleManager_1 = require("./styleManager");
// Import handlers to trigger registration
require("./handlers");
/**
 * Create a transform context with styleManager and transformChildren wired up.
 * Call this once at the start of transformation, then pass the context to
 * transformChildren and transformNode.
 */
function createTransformContext(baseContext = {}) {
    var _a;
    const styleManager = (_a = baseContext.styleManager) !== null && _a !== void 0 ? _a : new styleManager_1.DefaultStyleManager();
    const context = {
        ...baseContext,
        styleManager,
        transformChildren: (el) => transformChildren(el, context),
    };
    return context;
}
/**
 * Transform a single element using the appropriate handler.
 * Use this when you want to transform the element itself (e.g., a modal feedback element).
 */
function transformNode(element, context) {
    const handler = registry_1.registry.findHandler(element);
    if (handler) {
        return handler.transform(element, context);
    }
    // No handler found - create error display
    const fragment = document.createDocumentFragment();
    const errorElement = (0, errorDisplay_1.createUnsupportedElement)(element.tagName.toLowerCase());
    fragment.appendChild(errorElement);
    return fragment;
}
/**
 * Transform the children of an element (not the element itself).
 * Use this when you want to extract and transform the contents of a container
 * (e.g., the contents of qti-item-body).
 */
function transformChildren(element, context) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i];
        if (!node)
            continue;
        if (node.nodeType === Node.TEXT_NODE) {
            // Clone text nodes directly
            fragment.appendChild(node.cloneNode(true));
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            // Transform element nodes
            const childFragment = transformNode(node, context);
            fragment.appendChild(childFragment);
        }
        // Ignore other node types (comments, processing instructions, etc.)
    }
    return fragment;
}
/**
 * Legacy API: Transform an element's children with automatic context setup.
 * @deprecated Use createTransformContext + transformChildren instead for more control.
 */
function transformElement(element, baseContext = {}) {
    const context = createTransformContext(baseContext);
    return transformChildren(element, context);
}
/**
 * Get the StyleManager from a context, creating one if needed.
 * This is useful for handlers that need to ensure a StyleManager exists.
 */
function getStyleManager(context) {
    var _a;
    return (_a = context.styleManager) !== null && _a !== void 0 ? _a : new styleManager_1.DefaultStyleManager();
}
