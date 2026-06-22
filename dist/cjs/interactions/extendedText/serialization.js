"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendedTextSerializers = exports.extendedTextParsers = void 0;
const xmlUtils_1 = require("../../serialization/xmlUtils");
const config_1 = require("./config");
/**
 * Create a default response declaration for an extended text interaction
 */
function createDefaultResponseDeclaration(responseIdentifier) {
    return {
        tagName: 'qti-response-declaration',
        attributes: {
            identifier: responseIdentifier,
            cardinality: 'single',
            'base-type': 'string',
        },
        children: [],
    };
}
/**
 * Parse QTI extended text interaction from XML
 */
function parseExtendedTextInteraction(element, _convertChildren, convertChildrenStructural, context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    const responseId = attributes['response-identifier'] || '';
    // Get existing response declaration or create a default one
    const responseDeclaration = (responseId && (context === null || context === void 0 ? void 0 : context.responseDeclarations.get(responseId)))
        || createDefaultResponseDeclaration(responseId);
    // Parse children (should include qti-prompt) - use structural conversion
    const children = convertChildrenStructural(Array.from(element.childNodes));
    return {
        type: 'qti-extended-text-interaction',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes: {
            'response-identifier': responseId,
            'expected-lines': attributes['expected-lines'],
            'expected-length': attributes['expected-length'],
            'placeholder-text': attributes['placeholder-text'],
            ...attributes,
        },
        responseDeclaration,
    };
}
/**
 * Serialize extended text interaction to XML
 */
function serializeExtendedTextInteraction(element, context, convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-extended-text-interaction');
    // Track response identifier
    const responseId = element.attributes['response-identifier'];
    if (responseId) {
        context.responseIdentifiers.push(responseId);
        // Add response declaration to context
        if (element.responseDeclaration) {
            context.responseDeclarations.set(responseId, element.responseDeclaration);
        }
        // Register interaction config for response processing generation
        context.responseConfigs.set(responseId, config_1.extendedTextInteractionConfig);
    }
    else {
        context.errors.push({
            type: 'missing-identifier',
            message: 'Extended text interaction missing response-identifier',
        });
    }
    // Set attributes
    setAttributes(xmlElement, element.attributes);
    // Serialize children (qti-prompt)
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
exports.extendedTextParsers = {
    'qti-extended-text-interaction': parseExtendedTextInteraction,
};
exports.extendedTextSerializers = {
    'qti-extended-text-interaction': serializeExtendedTextInteraction,
};
