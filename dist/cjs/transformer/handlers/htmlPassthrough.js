"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../registry");
const inlineInteractionAnnotator_1 = require("./inlineInteractionAnnotator");
/**
 * Handler for standard HTML/XHTML elements
 * Passes through any non-qti elements as-is
 */
class HtmlPassthroughHandler {
    canHandle(element) {
        // Handle any element that doesn't start with "qti-"
        return !element.tagName.toLowerCase().startsWith('qti-');
    }
    transform(element, context) {
        const fragment = document.createDocumentFragment();
        // Clone the element with the same tag name
        const cloned = document.createElement(element.tagName);
        // Copy all attributes
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            if (attr) {
                cloned.setAttribute(attr.name, attr.value);
            }
        }
        // Recursively transform children using context function
        if (context.transformChildren) {
            const childrenFragment = context.transformChildren(element);
            cloned.appendChild(childrenFragment);
        }
        // After building the output for a block-level element, annotate any
        // inline interactions with aria-labelledby referencing surrounding text.
        // Inner blocks are processed first (via recursion above), so nested
        // interactions are already annotated and get skipped.
        if (inlineInteractionAnnotator_1.BLOCK_TAGS.has(element.tagName.toLowerCase())) {
            const wrapperFragment = document.createDocumentFragment();
            wrapperFragment.appendChild(cloned);
            if ((0, inlineInteractionAnnotator_1.annotateInlineInteractions)(wrapperFragment)) {
                if (context.styleManager && !context.styleManager.hasStyle('cutie-sr-only')) {
                    context.styleManager.addStyle('cutie-sr-only', inlineInteractionAnnotator_1.SR_ONLY_STYLES);
                }
            }
            fragment.appendChild(wrapperFragment);
            return fragment;
        }
        fragment.appendChild(cloned);
        return fragment;
    }
}
// Register with lowest priority (catch-all for non-qti elements)
registry_1.registry.register('html-passthrough', new HtmlPassthroughHandler(), 1000);
