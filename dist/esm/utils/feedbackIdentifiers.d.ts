import type { Descendant } from 'slate';
import type { FeedbackIdentifier, FeedbackIdentifierSource, SlateElement } from '../types';
export type { FeedbackIdentifier, FeedbackIdentifierSource };
/**
 * Get available feedback identifiers for a single interaction element.
 * Uses the registry-based approach via element configs.
 */
export declare function getFeedbackIdentifiersForInteraction(element: SlateElement): FeedbackIdentifierSource | null;
/**
 * Recursively collect all feedback identifiers from all interactions in a document
 */
export declare function collectFeedbackIdentifiers(nodes: Descendant[]): FeedbackIdentifierSource[];
/**
 * Get all feedback identifier IDs as a flat set
 */
export declare function getAllFeedbackIdentifierIds(nodes: Descendant[]): Set<string>;
/**
 * Find all feedback identifier options as a flat list for dropdowns
 */
export declare function getAllFeedbackIdentifierOptions(nodes: Descendant[]): Array<{
    id: string;
    label: string;
    description: string;
    interactionType: string;
    responseIdentifier: string;
}>;
/**
 * Parse a feedback identifier to extract its components
 * Returns null if not a recognized pattern
 */
export declare function parseFeedbackIdentifier(identifier: string): {
    responseIdentifier: string;
    type: 'correct' | 'incorrect' | 'partial' | 'choice';
    choiceId?: string;
} | null;
/**
 * Check if a feedback identifier follows the standard naming pattern
 * that we can manage (regenerate) in response processing
 */
export declare function isStandardFeedbackIdentifier(identifier: string): boolean;
