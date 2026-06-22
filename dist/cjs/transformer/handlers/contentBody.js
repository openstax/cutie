"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../registry");
/**
 * Handler for qti-content-body elements.
 * This is a transparent container that wraps flow content in feedback elements.
 * It simply renders its children without adding any wrapper element.
 */
class ContentBodyHandler {
    canHandle(element) {
        return element.tagName.toLowerCase() === 'qti-content-body';
    }
    transform(element, context) {
        const fragment = document.createDocumentFragment();
        if (context.transformChildren) {
            fragment.appendChild(context.transformChildren(element));
        }
        return fragment;
    }
}
registry_1.registry.register('content-body', new ContentBodyHandler(), 50);
