import { createXmlElement } from '../../../serialization/xmlUtils';
/**
 * Parse QTI modal feedback from XML
 */
function parseModalFeedback(element, _convertChildren, convertChildrenStructural, _context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    // Use structural conversion - children are block-level elements
    const children = convertChildrenStructural(Array.from(element.childNodes));
    return {
        type: 'qti-modal-feedback',
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
 * Serialize modal feedback to XML
 * Returns null because modal feedback is collected separately (outside qti-item-body)
 */
function serializeModalFeedback(element, context, convertChildren) {
    const xmlElement = createXmlElement(context.doc, 'qti-modal-feedback');
    // Set attributes
    setAttributes(xmlElement, element.attributes);
    // Track the feedback identifier for response processing generation
    const identifier = element.attributes.identifier;
    if (identifier && context.feedbackIdentifiersUsed) {
        context.feedbackIdentifiersUsed.add(identifier);
    }
    // Convert children
    convertChildren(element.children, xmlElement);
    // Push to context container (will be added outside item-body)
    context.modalFeedbackElements.push(xmlElement);
    // Return null - nothing goes into item-body
    return null;
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
export const modalFeedbackParsers = {
    'qti-modal-feedback': parseModalFeedback,
};
export const modalFeedbackSerializers = {
    'qti-modal-feedback': serializeModalFeedback,
};
