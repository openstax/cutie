"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorDisplay_1 = require("../../errors/errorDisplay");
const registry_1 = require("../registry");
/**
 * Handler for unsupported qti-* elements
 * Shows error UI for any qti-* element that isn't handled by a specific handler
 */
class UnsupportedHandler {
    canHandle(element) {
        // Handle any element that starts with "qti-"
        return element.tagName.toLowerCase().startsWith('qti-');
    }
    transform(element, _context) {
        const fragment = document.createDocumentFragment();
        const errorElement = (0, errorDisplay_1.createUnsupportedElement)(element.tagName.toLowerCase());
        fragment.appendChild(errorElement);
        return fragment;
    }
}
// Register with mid priority (after specific qti-* handlers, before HTML passthrough)
registry_1.registry.register('unsupported-qti', new UnsupportedHandler(), 500);
