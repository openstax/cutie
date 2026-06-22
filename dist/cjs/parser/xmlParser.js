"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQtiXml = parseQtiXml;
/**
 * Parse QTI XML string into a structured format
 */
function parseQtiXml(xmlString) {
    var _a;
    // Parse XML using native DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    // Check for parser errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error(`XML parsing failed: ${(_a = parseError.textContent) !== null && _a !== void 0 ? _a : 'Unknown parser error'}`);
    }
    // Extract qti-item-body element
    const itemBody = doc.querySelector('qti-item-body');
    if (!itemBody) {
        throw new Error('Invalid QTI structure: missing qti-item-body element');
    }
    // Extract modal feedback elements (siblings of item-body)
    const modalFeedbacks = Array.from(doc.querySelectorAll('qti-modal-feedback'));
    return {
        itemBody,
        modalFeedbacks,
        rawDocument: doc,
    };
}
