"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedbackIdentifiersForInteraction = getFeedbackIdentifiersForInteraction;
exports.collectFeedbackIdentifiers = collectFeedbackIdentifiers;
exports.getAllFeedbackIdentifierIds = getAllFeedbackIdentifierIds;
exports.getAllFeedbackIdentifierOptions = getAllFeedbackIdentifierOptions;
exports.parseFeedbackIdentifier = parseFeedbackIdentifier;
exports.isStandardFeedbackIdentifier = isStandardFeedbackIdentifier;
const withQtiInteractions_1 = require("../plugins/withQtiInteractions");
/**
 * Get available feedback identifiers for a single interaction element.
 * Uses the registry-based approach via element configs.
 */
function getFeedbackIdentifiersForInteraction(element) {
    return (0, withQtiInteractions_1.getElementFeedbackIdentifiers)(element);
}
/**
 * Recursively collect all feedback identifiers from all interactions in a document
 */
function collectFeedbackIdentifiers(nodes) {
    const sources = [];
    function traverse(node) {
        if ('type' in node) {
            const element = node;
            const source = getFeedbackIdentifiersForInteraction(element);
            if (source) {
                sources.push(source);
            }
            // Traverse children
            if ('children' in element && Array.isArray(element.children)) {
                for (const child of element.children) {
                    traverse(child);
                }
            }
        }
    }
    for (const node of nodes) {
        traverse(node);
    }
    return sources;
}
/**
 * Get all feedback identifier IDs as a flat set
 */
function getAllFeedbackIdentifierIds(nodes) {
    const sources = collectFeedbackIdentifiers(nodes);
    const ids = new Set();
    for (const source of sources) {
        for (const identifier of source.identifiers) {
            ids.add(identifier.id);
        }
    }
    return ids;
}
/**
 * Find all feedback identifier options as a flat list for dropdowns
 */
function getAllFeedbackIdentifierOptions(nodes) {
    const sources = collectFeedbackIdentifiers(nodes);
    const options = [];
    for (const source of sources) {
        for (const identifier of source.identifiers) {
            options.push({
                ...identifier,
                interactionType: source.interactionType,
                responseIdentifier: source.responseIdentifier,
            });
        }
    }
    return options;
}
/**
 * Parse a feedback identifier to extract its components
 * Returns null if not a recognized pattern
 */
function parseFeedbackIdentifier(identifier) {
    // Check for _correct suffix
    if (identifier.endsWith('_correct')) {
        return {
            responseIdentifier: identifier.slice(0, -'_correct'.length),
            type: 'correct',
        };
    }
    // Check for _incorrect suffix
    if (identifier.endsWith('_incorrect')) {
        return {
            responseIdentifier: identifier.slice(0, -'_incorrect'.length),
            type: 'incorrect',
        };
    }
    // Check for _partial suffix
    if (identifier.endsWith('_partial')) {
        return {
            responseIdentifier: identifier.slice(0, -'_partial'.length),
            type: 'partial',
        };
    }
    // Check for _choice_{id} pattern
    const choiceMatch = identifier.match(/^(.+)_choice_(.+)$/);
    if (choiceMatch) {
        return {
            responseIdentifier: choiceMatch[1],
            type: 'choice',
            choiceId: choiceMatch[2],
        };
    }
    return null;
}
/**
 * Check if a feedback identifier follows the standard naming pattern
 * that we can manage (regenerate) in response processing
 */
function isStandardFeedbackIdentifier(identifier) {
    return parseFeedbackIdentifier(identifier) !== null;
}
