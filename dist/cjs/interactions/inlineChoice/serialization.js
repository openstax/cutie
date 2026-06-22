"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineChoiceSerializers = exports.inlineChoiceParsers = void 0;
const xmlUtils_1 = require("../../serialization/xmlUtils");
const config_1 = require("./config");
/**
 * Create a default response declaration for an inline choice interaction
 */
function createDefaultResponseDeclaration(responseIdentifier) {
    return {
        tagName: 'qti-response-declaration',
        attributes: {
            identifier: responseIdentifier,
            cardinality: 'single',
            'base-type': 'identifier',
        },
        children: [],
    };
}
/**
 * Parse QTI inline choice interaction from XML
 */
function parseInlineChoiceInteraction(element, _convertChildren, _convertChildrenStructural, context) {
    var _a, _b;
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    const responseId = attributes['response-identifier'] || '';
    // Parse qti-inline-choice children to extract choices
    const choices = [];
    for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        if (((_a = child.tagName) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'qti-inline-choice') {
            const identifier = child.getAttribute('identifier');
            if (identifier) {
                choices.push({
                    identifier,
                    text: (_b = child.textContent) !== null && _b !== void 0 ? _b : '',
                    fixed: child.getAttribute('fixed') === 'true' ? true : undefined,
                });
            }
        }
    }
    // Get existing response declaration or create a default one
    const responseDeclaration = (responseId && (context === null || context === void 0 ? void 0 : context.responseDeclarations.get(responseId)))
        || createDefaultResponseDeclaration(responseId);
    return {
        type: 'qti-inline-choice-interaction',
        children: [{ text: '' }],
        attributes: {
            'response-identifier': responseId,
            shuffle: attributes['shuffle'],
            ...attributes,
        },
        choices,
        responseDeclaration,
    };
}
/**
 * Serialize inline choice interaction to XML
 */
function serializeInlineChoiceInteraction(element, context, _convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-inline-choice-interaction');
    // Track response identifier
    const responseId = element.attributes['response-identifier'];
    if (responseId) {
        context.responseIdentifiers.push(responseId);
        // Add response declaration to context if present
        if (element.responseDeclaration) {
            context.responseDeclarations.set(responseId, element.responseDeclaration);
        }
        // Register interaction config for response processing generation
        context.responseConfigs.set(responseId, config_1.inlineChoiceInteractionConfig);
    }
    else {
        context.errors.push({
            type: 'missing-identifier',
            message: 'Inline choice interaction missing response-identifier',
        });
    }
    // Set interaction attributes (excluding choices which are serialized as child elements)
    setAttributes(xmlElement, element.attributes);
    // Serialize choices as qti-inline-choice child elements
    const choices = element.choices;
    if (choices && choices.length > 0) {
        for (const choice of choices) {
            const choiceElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-inline-choice');
            choiceElement.setAttribute('identifier', choice.identifier);
            if (choice.fixed) {
                choiceElement.setAttribute('fixed', 'true');
            }
            choiceElement.textContent = choice.text;
            xmlElement.appendChild(choiceElement);
        }
    }
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
exports.inlineChoiceParsers = {
    'qti-inline-choice-interaction': parseInlineChoiceInteraction,
};
exports.inlineChoiceSerializers = {
    'qti-inline-choice-interaction': serializeInlineChoiceInteraction,
};
