"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUnknownElements = withUnknownElements;
/**
 * Plugin to handle unknown QTI elements
 */
function withUnknownElements(editor) {
    const { isVoid } = editor;
    // Check if unknown elements should be void based on their metadata
    editor.isVoid = (element) => {
        if ('type' in element && element.type === 'qti-unknown') {
            // Check if this unknown element is marked as void
            if ('isVoid' in element && element.isVoid === true) {
                return true;
            }
        }
        return isVoid(element);
    };
    return editor;
}
