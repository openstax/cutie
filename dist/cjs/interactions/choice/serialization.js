"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choiceSerializers = exports.choiceParsers = void 0;
const xmlUtils_1 = require("../../serialization/xmlUtils");
const config_1 = require("./config");
/**
 * Create a default response declaration for a choice interaction
 */
function createDefaultResponseDeclaration(responseIdentifier, maxChoices) {
    return {
        tagName: 'qti-response-declaration',
        attributes: {
            identifier: responseIdentifier,
            cardinality: maxChoices === '1' ? 'single' : 'multiple',
            'base-type': 'identifier',
        },
        children: [],
    };
}
/**
 * Parse QTI choice interaction from XML
 */
function parseChoiceInteraction(element, _convertChildren, convertChildrenStructural, context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    const responseId = attributes['response-identifier'] || '';
    const maxChoices = attributes['max-choices'] || '1';
    // Get existing response declaration or create a default one
    const responseDeclaration = (responseId && (context === null || context === void 0 ? void 0 : context.responseDeclarations.get(responseId)))
        || createDefaultResponseDeclaration(responseId, maxChoices);
    // Use structural conversion - children are qti-prompt and qti-simple-choice elements
    const children = convertChildrenStructural(Array.from(element.childNodes));
    return {
        type: 'qti-choice-interaction',
        children: children.length > 0 ? children : [{ type: 'qti-simple-choice', children: [{ text: '' }], attributes: { identifier: 'choice-1' } }],
        attributes: {
            'response-identifier': responseId,
            'max-choices': maxChoices,
            'min-choices': attributes['min-choices'],
            shuffle: attributes['shuffle'],
            ...attributes,
        },
        responseDeclaration,
    };
}
/**
 * Serialize choice interaction to XML
 */
function serializeChoiceInteraction(element, context, convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-choice-interaction');
    // Track response identifier
    const responseId = element.attributes['response-identifier'];
    if (responseId) {
        context.responseIdentifiers.push(responseId);
        // Add response declaration to context if present
        if (element.responseDeclaration) {
            context.responseDeclarations.set(responseId, element.responseDeclaration);
        }
        // Register interaction config for response processing generation
        context.responseConfigs.set(responseId, config_1.choiceInteractionConfig);
    }
    else {
        context.errors.push({
            type: 'missing-identifier',
            message: 'Choice interaction missing response-identifier',
        });
    }
    // Set attributes
    setAttributes(xmlElement, element.attributes);
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
exports.choiceParsers = {
    'qti-choice-interaction': parseChoiceInteraction,
};
exports.choiceSerializers = {
    'qti-choice-interaction': serializeChoiceInteraction,
};
