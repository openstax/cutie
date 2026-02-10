import type { Element } from 'slate';
import type { ElementConfig, FeedbackIdentifier, QtiTextEntryInteraction, XmlNode } from '../../types';
import { parseFeedbackIdentifier } from '../../utils/feedbackIdentifiers';
import { getMaxMappedValue, hasMapping } from '../../utils/mappingDeclaration';
import { hasCorrectResponse } from '../../utils/responseDeclaration';
import {
  createMapResponseEqualElement,
  createMapResponseGtZeroElement,
  createMatchElement,
  createSetFeedbackElement,
} from '../../utils/responseProcessingGenerator';

const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

export const textEntryInteractionConfig: ElementConfig = {
  type: 'qti-text-entry-interaction',
  xmlTagName: 'qti-text-entry-interaction',
  isVoid: true,
  isInline: true,
  needsSpacers: false, // Inline elements don't need spacers
  categories: ['interaction'],
  forbidDescendants: [], // Void element, can't have descendants
  matches: (element: Element) => 'type' in element && element.type === 'qti-text-entry-interaction',

  getFeedbackIdentifiers: (element: Element) => {
    const el = element as QtiTextEntryInteraction;
    const responseId = el.attributes['response-identifier'] || 'RESPONSE';
    const identifiers: FeedbackIdentifier[] = [];

    // Only add correct/incorrect if the interaction has a correct response configured
    if (el.responseDeclaration && hasCorrectResponse(el.responseDeclaration)) {
      identifiers.push({
        id: `${responseId}_correct`,
        label: `${responseId} is correct`,
        description: 'Shown when response matches correct value',
      });

      identifiers.push({
        id: `${responseId}_incorrect`,
        label: `${responseId} is incorrect`,
        description: 'Shown when response doesn\'t match correct value',
      });

      // Add partial credit feedback when mapping is present
      if (hasMapping(el.responseDeclaration)) {
        identifiers.push({
          id: `${responseId}_partial`,
          label: `${responseId} is partially correct`,
          description: 'Shown when response has some but not full credit',
        });
      }
    }

    return {
      responseIdentifier: responseId,
      interactionType: 'Text Entry Interaction',
      identifiers,
    };
  },

  generateCorrectnessCheck: (responseId: string, responseDecl: XmlNode, doc: Document) => {
    if (hasMapping(responseDecl)) {
      const maxValue = getMaxMappedValue(responseDecl);
      if (maxValue !== null) {
        return createMapResponseEqualElement(responseId, maxValue, doc);
      }
    }
    return createMatchElement(responseId, doc);
  },

  generateFeedbackConditions: (
    responseId: string,
    responseDecl: XmlNode,
    feedbackIds: Set<string>,
    doc: Document
  ): globalThis.Element[] => {
    const conditions: globalThis.Element[] = [];

    const correctId = `${responseId}_correct`;
    const incorrectId = `${responseId}_incorrect`;
    const partialId = `${responseId}_partial`;
    const hasCorrect = feedbackIds.has(correctId);
    const hasIncorrect = feedbackIds.has(incorrectId);
    const hasPartial = feedbackIds.has(partialId);
    const isMapped = hasMapping(responseDecl);

    if (hasCorrect || hasIncorrect || hasPartial) {
      const condition = doc.createElementNS(QTI_NAMESPACE, 'qti-response-condition');

      if (isMapped) {
        const maxValue = getMaxMappedValue(responseDecl);

        // qti-response-if: correct (equal to max)
        const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');
        if (maxValue !== null) {
          responseIf.appendChild(createMapResponseEqualElement(responseId, maxValue, doc));
        } else {
          responseIf.appendChild(createMatchElement(responseId, doc));
        }
        if (hasCorrect) {
          responseIf.appendChild(createSetFeedbackElement(correctId, doc));
        }
        condition.appendChild(responseIf);

        // qti-response-else-if: partial (gt 0) — only if _partial feedback is used
        if (hasPartial) {
          const responseElseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else-if');
          responseElseIf.appendChild(createMapResponseGtZeroElement(responseId, doc));
          responseElseIf.appendChild(createSetFeedbackElement(partialId, doc));
          condition.appendChild(responseElseIf);
        }

        // qti-response-else: incorrect
        if (hasIncorrect) {
          const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
          responseElse.appendChild(createSetFeedbackElement(incorrectId, doc));
          condition.appendChild(responseElse);
        }
      } else {
        // Unmapped: standard two-way via qti-match
        const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');
        responseIf.appendChild(createMatchElement(responseId, doc));
        if (hasCorrect) {
          responseIf.appendChild(createSetFeedbackElement(correctId, doc));
        }
        condition.appendChild(responseIf);

        if (hasIncorrect) {
          const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
          responseElse.appendChild(createSetFeedbackElement(incorrectId, doc));
          condition.appendChild(responseElse);
        }
      }

      conditions.push(condition);
    }

    // Handle any non-standard feedback identifiers (shouldn't happen for text entry)
    for (const feedbackId of feedbackIds) {
      const parsed = parseFeedbackIdentifier(feedbackId);
      if (parsed && parsed.type !== 'correct' && parsed.type !== 'incorrect' && parsed.type !== 'partial') {
        // Unexpected feedback type for text entry — skip
      }
    }

    return conditions;
  },
};
