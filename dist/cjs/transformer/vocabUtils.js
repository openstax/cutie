"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInputWidth = parseInputWidth;
/**
 * Parses the `qti-input-width-{N}` vocabulary class from an element's class attribute.
 * Returns the numeric width value, or null if no valid width class is found.
 *
 * QTI Vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab
 */
function parseInputWidth(element) {
    var _a;
    const match = (_a = element.getAttribute('class')) === null || _a === void 0 ? void 0 : _a.match(/\bqti-input-width-(\d+)\b/);
    if (!match)
        return null;
    const width = parseInt(match[1], 10);
    return isNaN(width) || width <= 0 ? null : width;
}
