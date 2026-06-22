"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementConfigs = void 0;
exports.elementNeedsSpacers = elementNeedsSpacers;
exports.getElementCategories = getElementCategories;
exports.getElementForbiddenDescendants = getElementForbiddenDescendants;
exports.normalizeElement = normalizeElement;
exports.getElementFeedbackIdentifiers = getElementFeedbackIdentifiers;
exports.isElementInline = isElementInline;
exports.collectExistingResponseIds = collectExistingResponseIds;
exports.withQtiInteractions = withQtiInteractions;
const slate_1 = require("slate");
const config_1 = require("../elements/contentBody/config");
const config_2 = require("../elements/feedback/feedbackBlock/config");
const config_3 = require("../elements/feedback/feedbackInline/config");
const config_4 = require("../elements/feedback/modalFeedback/config");
const config_5 = require("../elements/image/config");
const config_6 = require("../elements/prompt/config");
const config_7 = require("../elements/simpleChoice/config");
const config_8 = require("../interactions/choice/config");
const config_9 = require("../interactions/extendedText/config");
const config_10 = require("../interactions/gapMatch/config");
const config_11 = require("../interactions/inlineChoice/config");
const config_12 = require("../interactions/match/config");
const config_13 = require("../interactions/textEntry/config");
exports.elementConfigs = [
    // Interaction configs
    config_8.choiceInteractionConfig,
    config_13.textEntryInteractionConfig,
    config_11.inlineChoiceInteractionConfig,
    config_9.extendedTextInteractionConfig,
    config_10.gapMatchInteractionConfig,
    config_12.matchInteractionConfig,
    // Element configs
    config_6.promptConfig,
    config_7.simpleChoiceConfig,
    config_7.choiceIdLabelConfig,
    config_7.choiceContentConfig,
    config_10.gapMatchChoicesConfig,
    config_10.gapMatchContentConfig,
    config_10.gapTextConfig,
    config_10.gapImgConfig,
    config_10.gapConfig,
    config_12.matchSourceSetConfig,
    config_12.matchTargetSetConfig,
    config_12.simpleAssociableChoiceConfig,
    config_5.imageConfig,
    config_1.contentBodyConfig,
    // Feedback element configs
    config_3.feedbackInlineConfig,
    config_2.feedbackBlockConfig,
    config_4.modalFeedbackConfig,
];
/**
 * Check if an element needs spacer paragraphs around it for cursor positioning.
 * Block-level interactions that don't allow inline text editing need spacers.
 */
function elementNeedsSpacers(element) {
    var _a;
    if (!('type' in element))
        return false;
    const config = exports.elementConfigs.find(c => c.matches(element));
    return (_a = config === null || config === void 0 ? void 0 : config.needsSpacers) !== null && _a !== void 0 ? _a : false;
}
/**
 * Get the categories for an element (e.g., ['interaction'])
 */
function getElementCategories(element) {
    var _a;
    if (!('type' in element))
        return [];
    const config = exports.elementConfigs.find(c => c.matches(element));
    return (_a = config === null || config === void 0 ? void 0 : config.categories) !== null && _a !== void 0 ? _a : [];
}
/**
 * Get the forbidden descendant categories for an element
 */
function getElementForbiddenDescendants(element) {
    var _a;
    if (!('type' in element))
        return [];
    const config = exports.elementConfigs.find(c => c.matches(element));
    return (_a = config === null || config === void 0 ? void 0 : config.forbidDescendants) !== null && _a !== void 0 ? _a : [];
}
/**
 * Run the element-specific normalize hook if one exists.
 * Returns true if normalization was performed (caller should return early).
 * Returns false if no normalization was needed.
 */
function normalizeElement(editor, element, path) {
    if (!('type' in element))
        return false;
    const config = exports.elementConfigs.find(c => c.matches(element));
    if (config === null || config === void 0 ? void 0 : config.normalize) {
        return config.normalize(editor, element, path);
    }
    return false;
}
/**
 * Get feedback identifiers for an element if it provides them.
 */
function getElementFeedbackIdentifiers(element) {
    if (!('type' in element))
        return null;
    const config = exports.elementConfigs.find(c => c.matches(element));
    if (config === null || config === void 0 ? void 0 : config.getFeedbackIdentifiers) {
        return config.getFeedbackIdentifiers(element);
    }
    return null;
}
/**
 * Inline element types that don't have configs but are known to be inline.
 * Used as a fallback when no config is found.
 */
const FALLBACK_INLINE_TYPES = ['span', 'strong', 'em', 'line-break', 'qti-unknown'];
/**
 * Check if an element is inline based on its config or known inline types.
 * This is the source of truth for inline detection - use this instead of
 * hardcoding inline type lists elsewhere.
 */
function isElementInline(element) {
    if (!('type' in element))
        return false;
    const config = exports.elementConfigs.find(c => c.matches(element));
    if (config)
        return config.isInline;
    const type = element.type;
    return FALLBACK_INLINE_TYPES.includes(type);
}
/**
 * Collect all existing response identifiers from the editor.
 * Uses the element config registry to find all interactions.
 */
function collectExistingResponseIds(editor) {
    const existingIds = new Set();
    for (const [node] of slate_1.Editor.nodes(editor, {
        at: [],
        match: (n) => {
            if (!slate_1.Element.isElement(n))
                return false;
            const categories = getElementCategories(n);
            return categories.includes('interaction');
        },
    })) {
        if (slate_1.Element.isElement(node) && 'attributes' in node) {
            const attrs = node.attributes;
            if (attrs === null || attrs === void 0 ? void 0 : attrs['response-identifier']) {
                existingIds.add(attrs['response-identifier']);
            }
        }
    }
    return existingIds;
}
/**
 * Plugin to handle QTI interaction-specific behavior
 */
function withQtiInteractions(editor) {
    const { isVoid, isInline } = editor;
    // Mark certain interactions as void
    editor.isVoid = (element) => {
        if ('type' in element) {
            const config = exports.elementConfigs.find(c => c.matches(element));
            if (config)
                return config.isVoid;
            const type = element.type;
            const voidTypes = ['image', 'line-break', 'document-metadata', 'horizontal-rule'];
            if (voidTypes.includes(type)) {
                return true;
            }
            // Check if unknown QTI element is marked as void
            if (type === 'qti-unknown' && 'isVoid' in element && element.isVoid) {
                return true;
            }
        }
        return isVoid(element);
    };
    // Mark certain elements as inline
    editor.isInline = (element) => {
        if (isElementInline(element)) {
            return true;
        }
        return isInline(element);
    };
    return editor;
}
