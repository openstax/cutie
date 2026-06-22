"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptSerializers = exports.promptParsers = void 0;
const xmlUtils_1 = require("../../serialization/xmlUtils");
/**
 * Parse QTI prompt from XML
 */
function parsePrompt(element, convertChildren, _convertChildrenStructural, _context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    // Use flow content converter - prompt can contain inline text
    const children = convertChildren(Array.from(element.childNodes));
    return {
        type: 'qti-prompt',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
    };
}
/**
 * Serialize prompt to XML
 */
function serializePrompt(element, context, convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-prompt');
    if (element.attributes) {
        setAttributes(xmlElement, element.attributes);
    }
    // If there's exactly one child and it's a paragraph, unwrap it for clean XML
    if (element.children.length === 1) {
        const onlyChild = element.children[0];
        if ('type' in onlyChild && onlyChild.type === 'paragraph') {
            // Unwrap paragraph - serialize its children directly
            convertChildren(onlyChild.children, xmlElement);
            return xmlElement;
        }
    }
    // Otherwise convert children normally
    convertChildren(element.children, xmlElement);
    return xmlElement;
}
/**
 * Set attributes on an XML element from attributes object
 */
function setAttributes(element, attributes) {
    for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined) {
            element.setAttribute(key, value);
        }
    }
}
/**
 * Export parsers and serializers as objects that can be spread
 */
exports.promptParsers = {
    'qti-prompt': parsePrompt,
};
exports.promptSerializers = {
    'qti-prompt': serializePrompt,
};
