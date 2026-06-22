"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textEntrySerializers = exports.textEntryParsers = void 0;
const xmlUtils_1 = require("../../serialization/xmlUtils");
const config_1 = require("./config");
/**
 * Create a default response declaration for a text entry interaction
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
 * Parse QTI text entry interaction from XML
 */
function parseTextEntryInteraction(element, _convertChildren, _convertChildrenStructural, context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    const responseId = attributes['response-identifier'] || '';
    // Get existing response declaration or create a default one
    const responseDeclaration = (responseId && (context === null || context === void 0 ? void 0 : context.responseDeclarations.get(responseId)))
        || createDefaultResponseDeclaration(responseId);
    return {
        type: 'qti-text-entry-interaction',
        children: [{ text: '' }],
        attributes: {
            'response-identifier': responseId,
            'expected-length': attributes['expected-length'],
            'pattern-mask': attributes['pattern-mask'],
            'placeholder-text': attributes['placeholder-text'],
            ...attributes,
        },
        responseDeclaration,
    };
}
/**
 * Serialize text entry interaction to XML
 */
function serializeTextEntryInteraction(element, context, _convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-text-entry-interaction');
    // Track response identifier
    const responseId = element.attributes['response-identifier'];
    if (responseId) {
        context.responseIdentifiers.push(responseId);
        // Add response declaration to context if present
        if (element.responseDeclaration) {
            context.responseDeclarations.set(responseId, element.responseDeclaration);
        }
        // Register interaction config for response processing generation
        context.responseConfigs.set(responseId, config_1.textEntryInteractionConfig);
    }
    else {
        context.errors.push({
            type: 'missing-identifier',
            message: 'Text entry interaction missing response-identifier',
        });
    }
    // Set attributes
    setAttributes(xmlElement, element.attributes);
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
exports.textEntryParsers = {
    'qti-text-entry-interaction': parseTextEntryInteraction,
};
exports.textEntrySerializers = {
    'qti-text-entry-interaction': serializeTextEntryInteraction,
};
