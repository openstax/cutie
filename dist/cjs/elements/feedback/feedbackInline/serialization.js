"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackInlineSerializers = exports.feedbackInlineParsers = void 0;
const xmlUtils_1 = require("../../../serialization/xmlUtils");
/**
 * Parse QTI feedback inline from XML
 */
function parseFeedbackInline(element, convertChildren, _convertChildrenStructural, _context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    // Use flow content converter - inline feedback contains inline text
    const children = convertChildren(Array.from(element.childNodes));
    return {
        type: 'qti-feedback-inline',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes: {
            'outcome-identifier': attributes['outcome-identifier'] || 'FEEDBACK',
            identifier: attributes['identifier'] || '',
            'show-hide': attributes['show-hide'] || 'show',
            ...attributes,
        },
    };
}
/**
 * Serialize feedback inline to XML
 */
function serializeFeedbackInline(element, context, convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-feedback-inline');
    // Set attributes
    setAttributes(xmlElement, element.attributes);
    // Track the feedback identifier for response processing generation
    const identifier = element.attributes.identifier;
    if (identifier && context.feedbackIdentifiersUsed) {
        context.feedbackIdentifiersUsed.add(identifier);
    }
    // Convert children
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
exports.feedbackInlineParsers = {
    'qti-feedback-inline': parseFeedbackInline,
};
exports.feedbackInlineSerializers = {
    'qti-feedback-inline': serializeFeedbackInline,
};
