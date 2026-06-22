"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCK_ELEMENTS_FOR_WHITESPACE = void 0;
exports.parseXmlToSlate = parseXmlToSlate;
exports.stripStructuralWhitespace = stripStructuralWhitespace;
const contentBody_1 = require("../elements/contentBody");
const feedbackBlock_1 = require("../elements/feedback/feedbackBlock");
const feedbackInline_1 = require("../elements/feedback/feedbackInline");
const modalFeedback_1 = require("../elements/feedback/modalFeedback");
const prompt_1 = require("../elements/prompt");
const simpleChoice_1 = require("../elements/simpleChoice");
const choice_1 = require("../interactions/choice");
const extendedText_1 = require("../interactions/extendedText");
const gapMatch_1 = require("../interactions/gapMatch");
const inlineChoice_1 = require("../interactions/inlineChoice");
const match_1 = require("../interactions/match");
const textEntry_1 = require("../interactions/textEntry");
const withQtiInteractions_1 = require("../plugins/withQtiInteractions");
const responseProcessingClassifier_1 = require("../utils/responseProcessingClassifier");
const xmlNode_1 = require("./xmlNode");
const xmlUtils_1 = require("./xmlUtils");
// Single contact point per interaction: spread all parser objects
const interactionParsers = {
    ...choice_1.choiceParsers,
    ...textEntry_1.textEntryParsers,
    ...inlineChoice_1.inlineChoiceParsers,
    ...extendedText_1.extendedTextParsers,
    ...gapMatch_1.gapMatchParsers,
    ...match_1.matchParsers,
    ...prompt_1.promptParsers,
    ...simpleChoice_1.simpleChoiceParsers,
    ...feedbackInline_1.feedbackInlineParsers,
    ...feedbackBlock_1.feedbackBlockParsers,
    ...modalFeedback_1.modalFeedbackParsers,
    ...contentBody_1.contentBodyParsers,
};
/**
 * Create a default empty document structure for new items
 */
function createEmptyDocument() {
    const metadataNode = {
        type: 'document-metadata',
        children: [{ text: '' }],
        responseProcessing: { mode: 'allCorrect' },
    };
    return [
        metadataNode,
        { type: 'paragraph', children: [{ text: '' }] },
    ];
}
/**
 * Parse QTI XML to Slate document structure
 *
 * @param xml - Full QTI XML document (qti-assessment-item)
 * @returns Array of Slate descendants representing qti-item-body content
 *          with a document-metadata node at position [0]
 */
function parseXmlToSlate(xml) {
    // Handle empty input - return default empty document structure
    if (!xml || !xml.trim()) {
        return createEmptyDocument();
    }
    const doc = (0, xmlUtils_1.parseXml)(xml);
    if (!doc) {
        throw new Error('Failed to parse QTI XML');
    }
    // Find qti-item-body element
    const itemBody = doc.querySelector('qti-item-body');
    if (!itemBody) {
        throw new Error('No qti-item-body found in QTI XML document');
    }
    // Extract response declarations into a map (once, upfront)
    const responseDeclarations = new Map();
    for (const decl of doc.querySelectorAll('qti-response-declaration')) {
        const id = decl.getAttribute('identifier');
        if (id) {
            responseDeclarations.set(id, (0, xmlNode_1.domToXmlNode)(decl));
        }
    }
    const context = { responseDeclarations };
    // Classify response processing to determine mode
    const responseProcessing = (0, responseProcessingClassifier_1.classifyResponseProcessing)(doc);
    // Create document metadata node
    const metadataNode = {
        type: 'document-metadata',
        children: [{ text: '' }],
        responseProcessing,
    };
    // Convert children of qti-item-body to Slate nodes
    const contentNodes = convertNodesToSlate(Array.from(itemBody.childNodes), true, context);
    // Parse modal feedback from outside qti-item-body (direct children of qti-assessment-item)
    const assessmentItem = doc.querySelector('qti-assessment-item');
    const modalFeedbackNodes = [];
    if (assessmentItem) {
        const modalFeedbackElements = assessmentItem.querySelectorAll(':scope > qti-modal-feedback');
        for (const el of modalFeedbackElements) {
            const parser = interactionParsers['qti-modal-feedback'];
            if (parser) {
                const convertChildren = (nodes) => convertNodesToSlate(nodes, false, context);
                const convertChildrenStructural = (nodes) => stripStructuralWhitespace(convertNodesToSlate(nodes, false, context));
                const parsed = parser(el, convertChildren, convertChildrenStructural, context);
                if (Array.isArray(parsed)) {
                    modalFeedbackNodes.push(...parsed);
                }
                else {
                    modalFeedbackNodes.push(parsed);
                }
            }
        }
    }
    // Return metadata node at [0] followed by content nodes and modal feedback
    return [metadataNode, ...contentNodes, ...modalFeedbackNodes];
}
/**
 * Check if a Slate node is an inline element that needs to be wrapped in a paragraph
 * when it appears at the root level of the document.
 */
function isInlineSlateNode(node) {
    // Text nodes are inline
    if ('text' in node)
        return true;
    // Use the shared inline detection helper for elements
    if ('type' in node) {
        return (0, withQtiInteractions_1.isElementInline)(node);
    }
    return false;
}
/**
 * Wrap consecutive inline nodes in paragraphs at the root level.
 * This handles cases like standalone <img> tags in the XML.
 */
function wrapInlineNodesInParagraphs(nodes) {
    const result = [];
    let inlineBuffer = [];
    const flushBuffer = () => {
        if (inlineBuffer.length > 0) {
            result.push({
                type: 'paragraph',
                children: inlineBuffer,
            });
            inlineBuffer = [];
        }
    };
    for (const node of nodes) {
        if (isInlineSlateNode(node)) {
            inlineBuffer.push(node);
        }
        else {
            flushBuffer();
            result.push(node);
        }
    }
    flushBuffer();
    return result;
}
/**
 * Convert a list of DOM nodes to Slate descendants
 * @param nodes - DOM nodes to convert
 * @param isRootLevel - Whether this is the document root level (requires at least one node)
 * @param context - Parser context with response declarations
 */
function convertNodesToSlate(nodes, isRootLevel = false, context) {
    const result = [];
    for (const node of nodes) {
        const converted = convertNodeToSlate(node, context);
        if (converted) {
            if (Array.isArray(converted)) {
                result.push(...converted);
            }
            else {
                result.push(converted);
            }
        }
    }
    // At root level, wrap any inline nodes in paragraphs
    // This handles cases like standalone <img> tags in the XML
    const normalized = isRootLevel ? wrapInlineNodesInParagraphs(result) : result;
    // Ensure we have at least one node at root level (Slate requirement)
    if (isRootLevel && normalized.length === 0) {
        normalized.push({
            type: 'paragraph',
            children: [{ text: '' }],
        });
    }
    return normalized;
}
/**
 * Block elements for fallback whitespace handling.
 * Includes XHTML block elements and qti-item-body (container without a dedicated parser).
 * Other QTI elements are NOT included - their parsers handle whitespace directly.
 */
exports.BLOCK_ELEMENTS_FOR_WHITESPACE = [
    'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre',
    'qti-item-body', // Container element without dedicated parser
];
/**
 * Check if an element is a block-level element for whitespace handling.
 * Used only for fallback whitespace handling of elements without dedicated parsers.
 */
function isBlockElementForWhitespace(element) {
    return exports.BLOCK_ELEMENTS_FOR_WHITESPACE.includes(element.tagName.toLowerCase());
}
/**
 * Strip structural whitespace from Slate nodes.
 * Use this in element parsers whose children are structural (not flow content).
 */
function stripStructuralWhitespace(nodes) {
    return nodes.filter(node => {
        // Keep all non-text nodes
        if (!('text' in node))
            return true;
        // Keep text nodes that aren't just whitespace
        return node.text.trim() !== '';
    });
}
/**
 * Check if a text node is structural whitespace (XML formatting)
 * Returns true if the text node appears between block-level elements.
 * Note: Most QTI elements handle their own whitespace via convertChildrenStructural.
 */
function isStructuralWhitespace(node) {
    const parent = node.parentElement;
    if (!parent)
        return false;
    // Check if parent is a block-level element
    if (!isBlockElementForWhitespace(parent))
        return false;
    // Check if this text node is surrounded by block-level siblings
    // (or is at the start/end of the parent with block siblings)
    const siblings = Array.from(parent.childNodes);
    const nodeIndex = siblings.findIndex(sibling => sibling === node);
    // Look at adjacent siblings
    const prevSibling = nodeIndex > 0 ? siblings[nodeIndex - 1] : null;
    const nextSibling = nodeIndex < siblings.length - 1 ? siblings[nodeIndex + 1] : null;
    const prevIsBlock = (prevSibling === null || prevSibling === void 0 ? void 0 : prevSibling.nodeType) === Node.ELEMENT_NODE &&
        isBlockElementForWhitespace(prevSibling);
    const nextIsBlock = (nextSibling === null || nextSibling === void 0 ? void 0 : nextSibling.nodeType) === Node.ELEMENT_NODE &&
        isBlockElementForWhitespace(nextSibling);
    // If between two block elements, or at boundary with a block element, it's structural
    return prevIsBlock || nextIsBlock || nodeIndex === 0 || nodeIndex === siblings.length - 1;
}
/**
 * Convert a single DOM node to Slate node(s)
 * @param node - DOM node to convert
 * @param context - Parser context with response declarations
 */
function convertNodeToSlate(node, context) {
    // Text node
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        // Normalize whitespace: collapse sequences of spaces, tabs, and newlines to single space
        // This mirrors HTML rendering behavior where XML formatting (indentation, line breaks)
        // should not affect the displayed text
        const normalizedText = text.replace(/[\s\n\r\t]+/g, ' ');
        // Skip if normalized to empty string
        if (normalizedText === '') {
            return null;
        }
        // Skip whitespace-only text that is structural (XML formatting between blocks)
        if (normalizedText === ' ' && isStructuralWhitespace(node)) {
            return null;
        }
        return { text: normalizedText };
    }
    // Element node
    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        const tagName = (0, xmlUtils_1.normalizeTagName)(element.tagName);
        const attributes = extractAttributes(element);
        // Check interaction parsers first
        const parser = interactionParsers[tagName];
        if (parser) {
            const convertChildren = (nodes) => convertNodesToSlate(nodes, false, context);
            const convertChildrenStructural = (nodes) => stripStructuralWhitespace(convertNodesToSlate(nodes, false, context));
            return parser(element, convertChildren, convertChildrenStructural, context);
        }
        // Unknown QTI elements - preserve with warning
        if ((0, xmlUtils_1.isQtiElement)(tagName)) {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            const rawXml = (0, xmlUtils_1.serializeElement)(element);
            return {
                type: 'qti-unknown',
                originalTagName: tagName,
                children: children.length > 0 ? children : [{ text: '' }],
                attributes,
                rawXml,
                isVoid: element.childNodes.length === 0,
            };
        }
        // XHTML elements
        if (tagName === 'p') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            const align = extractAlignment(attributes);
            return {
                type: 'paragraph',
                children: children.length > 0 ? children : [{ text: '' }],
                ...(align && { align }),
                attributes,
            };
        }
        if (tagName === 'div') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            return {
                type: 'div',
                children: children.length > 0 ? children : [{ text: '' }],
                attributes,
            };
        }
        if (tagName === 'span') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            return {
                type: 'span',
                children: children.length > 0 ? children : [{ text: '' }],
                attributes,
            };
        }
        if (tagName.match(/^h[1-6]$/)) {
            const level = parseInt(tagName[1], 10);
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            const align = extractAlignment(attributes);
            return {
                type: 'heading',
                level,
                children: children.length > 0 ? children : [{ text: '' }],
                ...(align && { align }),
                attributes,
            };
        }
        if (tagName === 'strong' || tagName === 'b') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            // Apply bold mark to text children
            return applyMarkToChildren(children, 'bold');
        }
        if (tagName === 'em' || tagName === 'i') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            // Apply italic mark to text children
            return applyMarkToChildren(children, 'italic');
        }
        if (tagName === 'u') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            // Apply underline mark to text children
            return applyMarkToChildren(children, 'underline');
        }
        if (tagName === 'code') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            // Apply code mark to text children
            return applyMarkToChildren(children, 'code');
        }
        if (tagName === 's' || tagName === 'del' || tagName === 'strike') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            // Apply strikethrough mark to text children
            return applyMarkToChildren(children, 'strikethrough');
        }
        if (tagName === 'img') {
            return {
                type: 'image',
                children: [{ text: '' }],
                attributes: {
                    src: attributes['src'] || '',
                    alt: attributes['alt'],
                    width: attributes['width'],
                    height: attributes['height'],
                    ...attributes,
                },
            };
        }
        if (tagName === 'br') {
            return {
                type: 'line-break',
                children: [{ text: '' }],
                attributes,
            };
        }
        if (tagName === 'hr') {
            return {
                type: 'horizontal-rule',
                children: [{ text: '' }],
                attributes,
            };
        }
        if (tagName === 'blockquote') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            const align = extractAlignment(attributes);
            return {
                type: 'blockquote',
                children: children.length > 0 ? children : [{ text: '' }],
                ...(align && { align }),
                attributes,
            };
        }
        if (tagName === 'ul' || tagName === 'ol') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            return {
                type: 'list',
                ordered: tagName === 'ol',
                children: children.filter(child => 'type' in child && child.type === 'list-item'),
                attributes,
            };
        }
        if (tagName === 'li') {
            const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
            return {
                type: 'list-item',
                children: children.length > 0 ? children : [{ text: '' }],
                attributes,
            };
        }
        // Default: treat as div
        const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
        return {
            type: 'div',
            children: children.length > 0 ? children : [{ text: '' }],
            attributes,
        };
    }
    // Other node types (comments, etc.) - skip
    return null;
}
/**
 * Extract all attributes from an element as kebab-case object
 */
function extractAttributes(element) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        // Keep attribute names in original case (usually kebab-case in XML)
        attributes[attr.name] = attr.value;
    }
    return attributes;
}
/**
 * Extract text-align from style attribute
 */
function extractAlignment(attributes) {
    const style = attributes['style'];
    if (!style)
        return undefined;
    const match = style.match(/text-align:\s*(left|center|right)/i);
    return match ? match[1].toLowerCase() : undefined;
}
/**
 * Apply a text mark to all text nodes in children
 */
function applyMarkToChildren(children, mark) {
    return children.map(child => {
        if ('text' in child) {
            const textNode = child;
            return { ...textNode, [mark]: true };
        }
        return child;
    });
}
