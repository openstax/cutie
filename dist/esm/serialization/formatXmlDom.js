import { elementConfigs } from '../plugins/withQtiInteractions';
import { BLOCK_ELEMENTS_FOR_WHITESPACE } from './xmlToSlate';
/**
 * QTI structural elements that appear outside qti-item-body
 * (response declarations, outcome declarations, response processing, etc.)
 */
const QTI_STRUCTURAL_ELEMENTS = [
    'qti-assessment-item',
    'qti-response-declaration',
    'qti-outcome-declaration',
    'qti-correct-response',
    'qti-default-value',
    'qti-mapping',
    'qti-response-processing',
    'qti-response-condition',
    'qti-response-if',
    'qti-response-else-if',
    'qti-response-else',
    'qti-set-outcome-value',
    'qti-simple-match-set',
];
/**
 * Build the set of block element tag names used for formatting decisions.
 *
 * Combines:
 * 1. Non-inline QTI element configs (using xmlTagName)
 * 2. XHTML block elements from BLOCK_ELEMENTS_FOR_WHITESPACE
 * 3. QTI structural elements (declarations, response processing)
 */
function buildBlockElementSet() {
    var _a;
    const blockSet = new Set();
    // Add non-inline QTI elements from configs
    for (const config of elementConfigs) {
        if (!config.isInline) {
            const tagName = (_a = config.xmlTagName) !== null && _a !== void 0 ? _a : config.type;
            blockSet.add(tagName);
        }
    }
    // Add XHTML block elements
    for (const tag of BLOCK_ELEMENTS_FOR_WHITESPACE) {
        blockSet.add(tag);
    }
    // Add QTI structural elements
    for (const tag of QTI_STRUCTURAL_ELEMENTS) {
        blockSet.add(tag);
    }
    return blockSet;
}
let cachedBlockSet = null;
function getBlockElementSet() {
    if (!cachedBlockSet) {
        cachedBlockSet = buildBlockElementSet();
    }
    return cachedBlockSet;
}
/**
 * Check if a tag name is a block element for formatting purposes.
 */
function isBlock(tagName) {
    return getBlockElementSet().has(tagName.toLowerCase());
}
/**
 * Check if all children of an element are block elements (or whitespace-only text nodes).
 * Returns false if the element has any inline element children or non-whitespace text nodes.
 */
function hasOnlyBlockChildren(element) {
    var _a;
    for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (child.nodeType === 1) {
            // Element node — must be a block element
            if (!isBlock(child.tagName)) {
                return false;
            }
        }
        else if (child.nodeType === 3) {
            // Text node — must be whitespace-only
            if (((_a = child.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== '') {
                return false;
            }
        }
    }
    return true;
}
/**
 * Pretty-print an XML DOM tree by inserting whitespace text nodes for indentation.
 *
 * Block elements that contain only block children get their children indented.
 * Elements with mixed content (text + inline elements, like `<p>`) are left as-is.
 *
 * This mutates the DOM in place. Call before XMLSerializer.serializeToString().
 *
 * @param element - The root element to format
 * @param depth - Current indentation depth (default: 0)
 * @param indent - Indentation string per level (default: '  ')
 */
export function formatXmlDom(element, depth = 0, indent = '  ') {
    var _a;
    const tagName = element.tagName.toLowerCase();
    if (isBlock(tagName) && hasOnlyBlockChildren(element)) {
        const doc = element.ownerDocument;
        // Remove existing whitespace-only text nodes
        const toRemove = [];
        for (let i = 0; i < element.childNodes.length; i++) {
            const child = element.childNodes[i];
            if (child.nodeType === 3 && ((_a = child.textContent) === null || _a === void 0 ? void 0 : _a.trim()) === '') {
                toRemove.push(child);
            }
        }
        for (const node of toRemove) {
            element.removeChild(node);
        }
        // Insert indentation before each child element and after the last one
        const childIndent = indent.repeat(depth + 1);
        const closingIndent = indent.repeat(depth);
        const children = Array.from(element.childNodes);
        for (const child of children) {
            element.insertBefore(doc.createTextNode('\n' + childIndent), child);
        }
        // Add newline + indent before closing tag
        if (children.length > 0) {
            element.appendChild(doc.createTextNode('\n' + closingIndent));
        }
    }
    // Recurse into all element children
    for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (child.nodeType === 1) {
            formatXmlDom(child, depth + 1, indent);
        }
    }
}
