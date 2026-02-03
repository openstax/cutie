import type { Descendant } from 'slate';
import type { QtiChoiceInteraction, QtiSimpleChoice, SlateElement } from '../types';
import { hasCorrectResponse } from './responseDeclaration';

/**
 * Describes a single feedback identifier available from an interaction
 */
export interface FeedbackIdentifier {
  /** The feedback identifier value, e.g., "RESPONSE_correct" */
  id: string;
  /** Human-readable label, e.g., "RESPONSE: Correct" */
  label: string;
  /** Description of when this feedback triggers */
  description: string;
}

/**
 * Collection of feedback identifiers from a single interaction
 */
export interface FeedbackIdentifierSource {
  /** The response identifier of the interaction */
  responseIdentifier: string;
  /** The type of interaction (for display purposes) */
  interactionType: string;
  /** Available feedback identifiers */
  identifiers: FeedbackIdentifier[];
}

/**
 * Get available feedback identifiers for a choice interaction
 */
function getFeedbackIdentifiersForChoiceInteraction(
  element: QtiChoiceInteraction
): FeedbackIdentifierSource {
  const responseId = element.attributes['response-identifier'] || 'RESPONSE';
  const identifiers: FeedbackIdentifier[] = [];

  // Only add correct/incorrect if the interaction has a correct response configured
  if (element.responseDeclaration && hasCorrectResponse(element.responseDeclaration)) {
    identifiers.push({
      id: `${responseId}_correct`,
      label: `${responseId}: Correct`,
      description: 'Shown when all selected choices are correct',
    });

    identifiers.push({
      id: `${responseId}_incorrect`,
      label: `${responseId}: Incorrect`,
      description: 'Shown when at least one choice is wrong',
    });
  }

  // Add per-choice identifiers
  for (const child of element.children) {
    if ('type' in child && child.type === 'qti-simple-choice') {
      const choice = child as QtiSimpleChoice;
      const choiceId = choice.attributes.identifier;
      if (choiceId) {
        identifiers.push({
          id: `${responseId}_choice_${choiceId}`,
          label: `${responseId}: "${choiceId}" selected`,
          description: `Shown when choice "${choiceId}" is selected`,
        });
      }
    }
  }

  return {
    responseIdentifier: responseId,
    interactionType: 'Choice Interaction',
    identifiers,
  };
}

/**
 * Get available feedback identifiers for a text entry interaction
 */
function getFeedbackIdentifiersForTextEntryInteraction(
  element: SlateElement & { type: 'qti-text-entry-interaction'; responseDeclaration?: unknown }
): FeedbackIdentifierSource {
  const responseId = element.attributes['response-identifier'] || 'RESPONSE';
  const identifiers: FeedbackIdentifier[] = [];

  // Only add correct/incorrect if the interaction has a correct response configured
  if (element.responseDeclaration && hasCorrectResponse(element.responseDeclaration as any)) {
    identifiers.push({
      id: `${responseId}_correct`,
      label: `${responseId}: Correct`,
      description: 'Shown when response matches correct value',
    });

    identifiers.push({
      id: `${responseId}_incorrect`,
      label: `${responseId}: Incorrect`,
      description: 'Shown when response doesn\'t match correct value',
    });
  }

  return {
    responseIdentifier: responseId,
    interactionType: 'Text Entry Interaction',
    identifiers,
  };
}

/**
 * Get available feedback identifiers for an extended text interaction
 */
function getFeedbackIdentifiersForExtendedTextInteraction(
  element: SlateElement & { type: 'qti-extended-text-interaction'; responseDeclaration?: unknown }
): FeedbackIdentifierSource {
  const responseId = element.attributes['response-identifier'] || 'RESPONSE';
  const identifiers: FeedbackIdentifier[] = [];

  // Only add correct/incorrect if the interaction has a correct response configured
  if (element.responseDeclaration && hasCorrectResponse(element.responseDeclaration as any)) {
    identifiers.push({
      id: `${responseId}_correct`,
      label: `${responseId}: Correct`,
      description: 'Shown when response matches correct value',
    });

    identifiers.push({
      id: `${responseId}_incorrect`,
      label: `${responseId}: Incorrect`,
      description: 'Shown when response doesn\'t match correct value',
    });
  }

  return {
    responseIdentifier: responseId,
    interactionType: 'Extended Text Interaction',
    identifiers,
  };
}

/**
 * Get available feedback identifiers for a single interaction element
 */
export function getFeedbackIdentifiersForInteraction(
  element: SlateElement
): FeedbackIdentifierSource | null {
  if (!('type' in element)) return null;

  switch (element.type) {
    case 'qti-choice-interaction':
      return getFeedbackIdentifiersForChoiceInteraction(element as QtiChoiceInteraction);
    case 'qti-text-entry-interaction':
      return getFeedbackIdentifiersForTextEntryInteraction(
        element as SlateElement & { type: 'qti-text-entry-interaction' }
      );
    case 'qti-extended-text-interaction':
      return getFeedbackIdentifiersForExtendedTextInteraction(
        element as SlateElement & { type: 'qti-extended-text-interaction' }
      );
    default:
      return null;
  }
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
): { responseIdentifier: string; type: 'correct' | 'incorrect' | 'choice'; choiceId?: string } | null {
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
