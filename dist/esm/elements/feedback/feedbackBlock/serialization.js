import { createXmlElement } from '../../../serialization/xmlUtils';
/**
 * Parse QTI feedback block from XML
 */
function parseFeedbackBlock(element, _convertChildren, convertChildrenStructural, _context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    // Use structural conversion - children are block-level elements
    const children = convertChildrenStructural(Array.from(element.childNodes));
    return {
        type: 'qti-feedback-block',
        children: children.length > 0 ? children : [{ type: 'paragraph', children: [{ text: '' }] }],
        attributes: {
            'outcome-identifier': attributes['outcome-identifier'] || 'FEEDBACK',
            identifier: attributes['identifier'] || '',
            'show-hide': attributes['show-hide'] || 'show',
            ...attributes,
        },
    };
}
/**
 * Serialize feedback block to XML
 */
function serializeFeedbackBlock(element, context, convertChildren) {
    const xmlElement = createXmlElement(context.doc, 'qti-feedback-block');
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
export const feedbackBlockParsers = {
    'qti-feedback-block': parseFeedbackBlock,
};
export const feedbackBlockSerializers = {
    'qti-feedback-block': serializeFeedbackBlock,
};
