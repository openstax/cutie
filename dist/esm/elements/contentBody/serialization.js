import { createXmlElement } from '../../serialization/xmlUtils';
/**
 * Parse QTI content body from XML
 */
function parseContentBody(element, _convertChildren, convertChildrenStructural, _context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    // Use structural conversion - children are block-level elements
    const children = convertChildrenStructural(Array.from(element.childNodes));
    return {
        type: 'qti-content-body',
        children: children.length > 0 ? children : [{ type: 'paragraph', children: [{ text: '' }] }],
        attributes,
    };
}
/**
 * Serialize content body to XML
 */
function serializeContentBody(element, context, convertChildren) {
    const xmlElement = createXmlElement(context.doc, 'qti-content-body');
    if (element.attributes) {
        setAttributes(xmlElement, element.attributes);
    }
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
export const contentBodyParsers = {
    'qti-content-body': parseContentBody,
};
export const contentBodySerializers = {
    'qti-content-body': serializeContentBody,
};
