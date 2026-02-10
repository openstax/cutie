import type { Descendant, Element } from 'slate';
import { getElementFeedbackIdentifiers } from '../plugins/withQtiInteractions';
import type { FeedbackIdentifier, FeedbackIdentifierSource, SlateElement } from '../types';

// Re-export types for convenience
export type { FeedbackIdentifier, FeedbackIdentifierSource };

/**
 * Get available feedback identifiers for a single interaction element.
 * Uses the registry-based approach via element configs.
 */
export function getFeedbackIdentifiersForInteraction(
  element: SlateElement
): FeedbackIdentifierSource | null {
  return getElementFeedbackIdentifiers(element as Element);
}

/**
 * Recursively collect all feedback identifiers from all interactions in a document
 */
export function collectFeedbackIdentifiers(nodes: Descendant[]): FeedbackIdentifierSource[] {
  const sources: FeedbackIdentifierSource[] = [];

  function traverse(node: Descendant): void {
    if ('type' in node) {
      const element = node as SlateElement;
      const source = getFeedbackIdentifiersForInteraction(element);
      if (source) {
        sources.push(source);
      }

      // Traverse children
      if ('children' in element && Array.isArray(element.children)) {
        for (const child of element.children) {
          traverse(child as Descendant);
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
export function getAllFeedbackIdentifierIds(nodes: Descendant[]): Set<string> {
  const sources = collectFeedbackIdentifiers(nodes);
  const ids = new Set<string>();

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
export function getAllFeedbackIdentifierOptions(
  nodes: Descendant[]
): Array<{ id: string; label: string; description: string; interactionType: string; responseIdentifier: string }> {
  const sources = collectFeedbackIdentifiers(nodes);
  const options: Array<{
    id: string;
    label: string;
    description: string;
    interactionType: string;
    responseIdentifier: string;
  }> = [];

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
export function parseFeedbackIdentifier(
  identifier: string
): { responseIdentifier: string; type: 'correct' | 'incorrect' | 'partial' | 'choice'; choiceId?: string } | null {
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
export function isStandardFeedbackIdentifier(identifier: string): boolean {
  return parseFeedbackIdentifier(identifier) !== null;
}
