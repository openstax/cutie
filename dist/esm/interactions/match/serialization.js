import { createXmlElement } from '../../serialization/xmlUtils';
import { matchInteractionConfig } from './config';
/**
 * Create a default response declaration for a match interaction
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
 * Create a default simple associable choice
 */
function createDefaultAssociableChoice(identifier, text) {
    return {
        type: 'qti-simple-associable-choice',
        children: [{ text }],
        attributes: { identifier, 'match-max': '1' },
    };
}
/**
 * Parse QTI match interaction from XML
 */
function parseMatchInteraction(element, convertChildren, _convertChildrenStructural, context) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    const responseId = attributes['response-identifier'] || '';
    // Get existing response declaration or create a default one
    const responseDeclaration = (responseId && (context === null || context === void 0 ? void 0 : context.responseDeclarations.get(responseId))) ||
        createDefaultResponseDeclaration(responseId);
    // Process children
    const children = Array.from(element.childNodes);
    let promptElement = null;
    const matchSets = [];
    for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child;
            const tagName = el.tagName.toLowerCase();
            if (tagName === 'qti-prompt') {
                // Parse the prompt
                const promptChildren = convertChildren(Array.from(el.childNodes));
                promptElement = {
                    type: 'qti-prompt',
                    children: promptChildren.length > 0 ? promptChildren : [{ text: '' }],
                    attributes: {},
                };
            }
            else if (tagName === 'qti-simple-match-set') {
                matchSets.push(el);
            }
        }
    }
    // Parse the two match sets (first = source, second = target)
    const sourceChoices = [];
    const targetChoices = [];
    if (matchSets[0]) {
        const choiceElements = matchSets[0].querySelectorAll('qti-simple-associable-choice');
        for (const choiceEl of choiceElements) {
            sourceChoices.push(parseSimpleAssociableChoice(choiceEl, convertChildren));
        }
    }
    if (matchSets[1]) {
        const choiceElements = matchSets[1].querySelectorAll('qti-simple-associable-choice');
        for (const choiceEl of choiceElements) {
            targetChoices.push(parseSimpleAssociableChoice(choiceEl, convertChildren));
        }
    }
    // Build children array
    const resultChildren = [];
    if (promptElement) {
        resultChildren.push(promptElement);
    }
    resultChildren.push({
        type: 'match-source-set',
        children: sourceChoices.length > 0
            ? sourceChoices
            : [
                createDefaultAssociableChoice('sourceA', 'Source A'),
                createDefaultAssociableChoice('sourceB', 'Source B'),
            ],
    });
    resultChildren.push({
        type: 'match-target-set',
        children: targetChoices.length > 0
            ? targetChoices
            : [
                createDefaultAssociableChoice('targetX', 'Target X'),
                createDefaultAssociableChoice('targetY', 'Target Y'),
            ],
    });
    return {
        type: 'qti-match-interaction',
        children: resultChildren,
        attributes: {
            'response-identifier': responseId,
            'max-associations': attributes['max-associations'],
            'min-associations': attributes['min-associations'],
            shuffle: attributes['shuffle'],
            ...attributes,
        },
        responseDeclaration,
    };
}
/**
 * Parse qti-simple-associable-choice element
 */
function parseSimpleAssociableChoice(element, convertChildren) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    const children = convertChildren(Array.from(element.childNodes));
    return {
        type: 'qti-simple-associable-choice',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes: {
            identifier: attributes['identifier'] || '',
            'match-max': attributes['match-max'],
            'match-min': attributes['match-min'],
            fixed: attributes['fixed'],
            ...attributes,
        },
    };
}
/**
 * Serialize match interaction to XML
 */
function serializeMatchInteraction(element, context, convertChildren) {
    const xmlElement = createXmlElement(context.doc, 'qti-match-interaction');
    // Track response identifier
    const responseId = element.attributes['response-identifier'];
    if (responseId) {
        context.responseIdentifiers.push(responseId);
        // Add response declaration to context if present
        if (element.responseDeclaration) {
            context.responseDeclarations.set(responseId, element.responseDeclaration);
        }
        // Register interaction config for response processing generation
        context.responseConfigs.set(responseId, matchInteractionConfig);
    }
    else {
        context.errors.push({
            type: 'missing-identifier',
            message: 'Match interaction missing response-identifier',
        });
    }
    // Set attributes
    for (const [key, value] of Object.entries(element.attributes)) {
        if (value !== undefined) {
            xmlElement.setAttribute(key, value);
        }
    }
    // Serialize children
    for (const child of element.children) {
        if ('type' in child) {
            if (child.type === 'qti-prompt') {
                // Serialize prompt directly
                const promptEl = createXmlElement(context.doc, 'qti-prompt');
                convertChildren(child.children, promptEl);
                xmlElement.appendChild(promptEl);
            }
            else if (child.type === 'match-source-set') {
                // Unwrap to qti-simple-match-set
                const matchSet = createXmlElement(context.doc, 'qti-simple-match-set');
                convertChildren(child.children, matchSet);
                xmlElement.appendChild(matchSet);
            }
            else if (child.type === 'match-target-set') {
                // Unwrap to qti-simple-match-set
                const matchSet = createXmlElement(context.doc, 'qti-simple-match-set');
                convertChildren(child.children, matchSet);
                xmlElement.appendChild(matchSet);
            }
        }
    }
    return xmlElement;
}
/**
 * Serialize simple associable choice to XML
 */
function serializeSimpleAssociableChoice(element, context, convertChildren) {
    const xmlElement = createXmlElement(context.doc, 'qti-simple-associable-choice');
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
 * Serialize match-source-set (editor-only wrapper) - returns DocumentFragment
 */
function serializeMatchSourceSet(element, context, convertChildren) {
    const fragment = context.doc.createDocumentFragment();
    convertChildren(element.children, fragment);
    return fragment;
}
/**
 * Serialize match-target-set (editor-only wrapper) - returns DocumentFragment
 */
function serializeMatchTargetSet(element, context, convertChildren) {
    const fragment = context.doc.createDocumentFragment();
    convertChildren(element.children, fragment);
    return fragment;
}
/**
 * Export parsers and serializers as objects that can be spread
 */
export const matchParsers = {
    'qti-match-interaction': parseMatchInteraction,
};
export const matchSerializers = {
    'qti-match-interaction': serializeMatchInteraction,
    'qti-simple-associable-choice': serializeSimpleAssociableChoice,
    'match-source-set': serializeMatchSourceSet,
    'match-target-set': serializeMatchTargetSet,
};
