"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gapMatchSerializers = exports.gapMatchParsers = void 0;
const xmlUtils_1 = require("../../serialization/xmlUtils");
const config_1 = require("./config");
/**
 * Create a default response declaration for a gap-match interaction
 */
function createDefaultResponseDeclaration(responseIdentifier) {
    return {
        tagName: 'qti-response-declaration',
        attributes: {
            identifier: responseIdentifier,
            cardinality: 'multiple',
            'base-type': 'directedPair',
        },
        children: [],
    };
}
/**
 * Parse QTI gap-match interaction from XML
 */
function parseGapMatchInteraction(element, convertChildren, _convertChildrenStructural, context) {
    var _a;
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    const responseId = attributes['response-identifier'] || '';
    // Get existing response declaration or create a default one
    const responseDeclaration = (responseId && (context === null || context === void 0 ? void 0 : context.responseDeclarations.get(responseId))) ||
        createDefaultResponseDeclaration(responseId);
    // Separate choice elements from content
    const children = Array.from(element.childNodes);
    const choiceElements = [];
    const contentElements = [];
    for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child;
            const tagName = el.tagName.toLowerCase();
            if (tagName === 'qti-gap-text' || tagName === 'qti-gap-img') {
                choiceElements.push(child);
            }
            else if (tagName === 'qti-prompt') {
                // Skip prompt - gap-match doesn't support prompt per plan
                // (instructional text should be in content or before interaction)
            }
            else {
                contentElements.push(child);
            }
        }
        else if (child.nodeType === Node.TEXT_NODE) {
            // Include text nodes in content if they have meaningful content
            const text = (_a = child.textContent) === null || _a === void 0 ? void 0 : _a.trim();
            if (text) {
                contentElements.push(child);
            }
        }
    }
    // Convert choices
    const choices = convertChildren(choiceElements);
    // Convert content (which includes qti-gap elements)
    const content = convertChildren(contentElements);
    return {
        type: 'qti-gap-match-interaction',
        children: [
            {
                type: 'gap-match-choices',
                children: choices.length > 0 ? choices : [createDefaultGapText('A')],
            },
            {
                type: 'gap-match-content',
                children: content.length > 0 ? content : [{ type: 'paragraph', children: [{ text: '' }], attributes: {} }],
            },
        ],
        attributes: {
            'response-identifier': responseId,
            shuffle: attributes['shuffle'],
            ...attributes,
        },
        responseDeclaration,
    };
}
/**
 * Create a default gap-text element
 */
function createDefaultGapText(identifier) {
    return {
        type: 'qti-gap-text',
        children: [{ text: `Choice ${identifier}` }],
        attributes: { identifier, 'match-max': '1' },
    };
}
/**
 * Parse qti-gap-text element
 */
function parseGapText(element, convertChildren, _convertChildrenStructural, _context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    const children = convertChildren(Array.from(element.childNodes));
    return {
        type: 'qti-gap-text',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes: {
            identifier: attributes['identifier'] || '',
            'match-max': attributes['match-max'],
            'match-group': attributes['match-group'],
            fixed: attributes['fixed'],
            ...attributes,
        },
    };
}
/**
 * Parse qti-gap-img element
 */
function parseGapImg(element, _convertChildren, _convertChildrenStructural, _context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    // Find the img child element
    const imgElement = element.querySelector('img');
    const imgAttributes = {};
    if (imgElement) {
        for (let i = 0; i < imgElement.attributes.length; i++) {
            const attr = imgElement.attributes[i];
            imgAttributes[attr.name] = attr.value;
        }
    }
    return {
        type: 'qti-gap-img',
        children: [
            {
                type: 'image',
                children: [{ text: '' }],
                attributes: {
                    src: imgAttributes['src'] || '',
                    alt: imgAttributes['alt'],
                    width: imgAttributes['width'],
                    height: imgAttributes['height'],
                    ...imgAttributes,
                },
            },
        ],
        attributes: {
            identifier: attributes['identifier'] || '',
            'match-max': attributes['match-max'],
            'match-group': attributes['match-group'],
            fixed: attributes['fixed'],
            ...attributes,
        },
    };
}
/**
 * Parse qti-gap element (inline void)
 */
function parseGap(element, _convertChildren, _convertChildrenStructural, _context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    return {
        type: 'qti-gap',
        children: [{ text: '' }],
        attributes: {
            identifier: attributes['identifier'] || '',
            'match-group': attributes['match-group'],
            ...attributes,
        },
    };
}
/**
 * Serialize gap-match interaction to XML
 */
function serializeGapMatchInteraction(element, context, convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-gap-match-interaction');
    // Track response identifier
    const responseId = element.attributes['response-identifier'];
    if (responseId) {
        context.responseIdentifiers.push(responseId);
        // Add response declaration to context if present
        if (element.responseDeclaration) {
            context.responseDeclarations.set(responseId, element.responseDeclaration);
        }
        // Register interaction config for response processing generation
        context.responseConfigs.set(responseId, config_1.gapMatchInteractionConfig);
    }
    else {
        context.errors.push({
            type: 'missing-identifier',
            message: 'Gap-match interaction missing response-identifier',
        });
    }
    // Set attributes (except response-identifier which we handle specially)
    for (const [key, value] of Object.entries(element.attributes)) {
        if (value !== undefined) {
            xmlElement.setAttribute(key, value);
        }
    }
    // Serialize children - unwrap editor-only wrappers
    for (const child of element.children) {
        if ('type' in child) {
            if (child.type === 'gap-match-choices') {
                // Unwrap: serialize choice children directly to interaction
                convertChildren(child.children, xmlElement);
            }
            else if (child.type === 'gap-match-content') {
                // Unwrap: serialize content children directly to interaction
                convertChildren(child.children, xmlElement);
            }
            else {
                // Other children (shouldn't happen but handle gracefully)
                convertChildren([child], xmlElement);
            }
        }
    }
    return xmlElement;
}
/**
 * Serialize gap-text element to XML
 */
function serializeGapText(element, context, convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-gap-text');
    // Set attributes
    for (const [key, value] of Object.entries(element.attributes)) {
        if (value !== undefined) {
            xmlElement.setAttribute(key, value);
        }
    }
    // Convert children (text content)
    convertChildren(element.children, xmlElement);
    return xmlElement;
}
/**
 * Serialize gap-img element to XML
 */
function serializeGapImg(element, context, convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-gap-img');
    // Set attributes (identifier, match-max, etc. - not image attributes)
    for (const [key, value] of Object.entries(element.attributes)) {
        if (value !== undefined) {
            xmlElement.setAttribute(key, value);
        }
    }
    // Convert children (image element)
    convertChildren(element.children, xmlElement);
    return xmlElement;
}
/**
 * Serialize gap element to XML (self-closing)
 */
function serializeGap(element, context, _convertChildren) {
    const xmlElement = (0, xmlUtils_1.createXmlElement)(context.doc, 'qti-gap');
    // Set attributes
    for (const [key, value] of Object.entries(element.attributes)) {
        if (value !== undefined) {
            xmlElement.setAttribute(key, value);
        }
    }
    return xmlElement;
}
/**
 * Serialize gap-match-choices (editor-only wrapper) - returns DocumentFragment
 */
function serializeGapMatchChoices(element, context, convertChildren) {
    const fragment = context.doc.createDocumentFragment();
    convertChildren(element.children, fragment);
    return fragment;
}
/**
 * Serialize gap-match-content (editor-only wrapper) - returns DocumentFragment
 */
function serializeGapMatchContent(element, context, convertChildren) {
    const fragment = context.doc.createDocumentFragment();
    convertChildren(element.children, fragment);
    return fragment;
}
/**
 * Export parsers and serializers as objects that can be spread
 */
exports.gapMatchParsers = {
    'qti-gap-match-interaction': parseGapMatchInteraction,
    'qti-gap-text': parseGapText,
    'qti-gap-img': parseGapImg,
    'qti-gap': parseGap,
};
exports.gapMatchSerializers = {
    'qti-gap-match-interaction': serializeGapMatchInteraction,
    'qti-gap-text': serializeGapText,
    'qti-gap-img': serializeGapImg,
    'qti-gap': serializeGap,
    'gap-match-choices': serializeGapMatchChoices,
    'gap-match-content': serializeGapMatchContent,
};
