import { Editor, Element } from 'slate';
import { contentBodyConfig } from '../elements/contentBody/config';
import { feedbackBlockConfig } from '../elements/feedback/feedbackBlock/config';
import { feedbackInlineConfig } from '../elements/feedback/feedbackInline/config';
import { modalFeedbackConfig } from '../elements/feedback/modalFeedback/config';
import { imageConfig } from '../elements/image/config';
import { promptConfig } from '../elements/prompt/config';
import { choiceContentConfig, choiceIdLabelConfig, simpleChoiceConfig, } from '../elements/simpleChoice/config';
import { choiceInteractionConfig } from '../interactions/choice/config';
import { extendedTextInteractionConfig } from '../interactions/extendedText/config';
import { gapConfig, gapImgConfig, gapMatchChoicesConfig, gapMatchContentConfig, gapMatchInteractionConfig, gapTextConfig, } from '../interactions/gapMatch/config';
import { inlineChoiceInteractionConfig } from '../interactions/inlineChoice/config';
import { matchInteractionConfig, matchSourceSetConfig, matchTargetSetConfig, simpleAssociableChoiceConfig, } from '../interactions/match/config';
import { textEntryInteractionConfig } from '../interactions/textEntry/config';
export const elementConfigs = [
    // Interaction configs
    choiceInteractionConfig,
    textEntryInteractionConfig,
    inlineChoiceInteractionConfig,
    extendedTextInteractionConfig,
    gapMatchInteractionConfig,
    matchInteractionConfig,
    // Element configs
    promptConfig,
    simpleChoiceConfig,
    choiceIdLabelConfig,
    choiceContentConfig,
    gapMatchChoicesConfig,
    gapMatchContentConfig,
    gapTextConfig,
    gapImgConfig,
    gapConfig,
    matchSourceSetConfig,
    matchTargetSetConfig,
    simpleAssociableChoiceConfig,
    imageConfig,
    contentBodyConfig,
    // Feedback element configs
    feedbackInlineConfig,
    feedbackBlockConfig,
    modalFeedbackConfig,
];
/**
 * Check if an element needs spacer paragraphs around it for cursor positioning.
 * Block-level interactions that don't allow inline text editing need spacers.
 */
export function elementNeedsSpacers(element) {
    var _a;
    if (!('type' in element))
        return false;
    const config = elementConfigs.find(c => c.matches(element));
    return (_a = config === null || config === void 0 ? void 0 : config.needsSpacers) !== null && _a !== void 0 ? _a : false;
}
/**
 * Get the categories for an element (e.g., ['interaction'])
 */
export function getElementCategories(element) {
    var _a;
    if (!('type' in element))
        return [];
    const config = elementConfigs.find(c => c.matches(element));
    return (_a = config === null || config === void 0 ? void 0 : config.categories) !== null && _a !== void 0 ? _a : [];
}
/**
 * Get the forbidden descendant categories for an element
 */
export function getElementForbiddenDescendants(element) {
    var _a;
    if (!('type' in element))
        return [];
    const config = elementConfigs.find(c => c.matches(element));
    return (_a = config === null || config === void 0 ? void 0 : config.forbidDescendants) !== null && _a !== void 0 ? _a : [];
}
/**
 * Run the element-specific normalize hook if one exists.
 * Returns true if normalization was performed (caller should return early).
 * Returns false if no normalization was needed.
 */
export function normalizeElement(editor, element, path) {
    if (!('type' in element))
        return false;
    const config = elementConfigs.find(c => c.matches(element));
    if (config === null || config === void 0 ? void 0 : config.normalize) {
        return config.normalize(editor, element, path);
    }
    return false;
}
/**
 * Get feedback identifiers for an element if it provides them.
 */
export function getElementFeedbackIdentifiers(element) {
    if (!('type' in element))
        return null;
    const config = elementConfigs.find(c => c.matches(element));
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
export function isElementInline(element) {
    if (!('type' in element))
        return false;
    const config = elementConfigs.find(c => c.matches(element));
    if (config)
        return config.isInline;
    const type = element.type;
    return FALLBACK_INLINE_TYPES.includes(type);
}
/**
 * Collect all existing response identifiers from the editor.
 * Uses the element config registry to find all interactions.
 */
export function collectExistingResponseIds(editor) {
    const existingIds = new Set();
    for (const [node] of Editor.nodes(editor, {
        at: [],
        match: (n) => {
            if (!Element.isElement(n))
                return false;
            const categories = getElementCategories(n);
            return categories.includes('interaction');
        },
    })) {
        if (Element.isElement(node) && 'attributes' in node) {
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
export function withQtiInteractions(editor) {
    const { isVoid, isInline } = editor;
    // Mark certain interactions as void
    editor.isVoid = (element) => {
        if ('type' in element) {
            const config = elementConfigs.find(c => c.matches(element));
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
