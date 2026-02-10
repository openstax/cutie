import { Element, Transforms } from 'slate';
import type {
  CustomEditor,
  ElementConfig,
  FeedbackIdentifier,
  QtiChoiceInteraction,
  QtiSimpleChoice,
  XmlNode,
} from '../../types';
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

export const choiceInteractionConfig: ElementConfig = {
  type: 'qti-choice-interaction',
  xmlTagName: 'qti-choice-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-choice-interaction',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // Ensure choice interaction always has a qti-prompt as first child
    const firstChild = node.children[0];
    const hasPrompt =
      firstChild &&
      Element.isElement(firstChild) &&
      'type' in firstChild &&
      firstChild.type === 'qti-prompt';

    if (!hasPrompt) {
      Transforms.insertNodes(
        editor,
        {
          type: 'qti-prompt',
          children: [
            { type: 'paragraph', children: [{ text: '' }], attributes: {} },
          ],
        } as Element,
        { at: path.concat(0) }
      );
      return true;
    }

    return false;
  },

  getFeedbackIdentifiers: (element: Element) => {
    const el = element as QtiChoiceInteraction;
    const responseId = el.attributes['response-identifier'] || 'RESPONSE';
    const identifiers: FeedbackIdentifier[] = [];

    // Only add correct/incorrect if the interaction has a correct response configured
    if (el.responseDeclaration && hasCorrectResponse(el.responseDeclaration)) {
      identifiers.push({
        id: `${responseId}_correct`,
        label: `${responseId} is correct`,
        description: 'Shown when all selected choices are correct',
      });

      identifiers.push({
        id: `${responseId}_incorrect`,
        label: `${responseId} is incorrect`,
        description: 'Shown when at least one choice is wrong',
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

    // Add per-choice identifiers
    for (const child of el.children) {
      if ('type' in child && child.type === 'qti-simple-choice') {
        const choice = child as QtiSimpleChoice;
        const choiceId = choice.attributes.identifier;
        if (choiceId) {
          identifiers.push({
            id: `${responseId}_choice_${choiceId}`,
            label: `${responseId} is "${choiceId}"`,
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
  },

  generateFeedbackConditions: (
    responseId: string,
    responseDecl: XmlNode,
    feedbackIds: Set<string>,
    doc: Document
  ): globalThis.Element[] => {
    const conditions: globalThis.Element[] = [];
    const cardinality = responseDecl.attributes?.cardinality || 'single';

    // Check for correct/incorrect/partial feedback
    const correctId = `${responseId}_correct`;
    const incorrectId = `${responseId}_incorrect`;
    const partialId = `${responseId}_partial`;
    const hasCorrectFb = feedbackIds.has(correctId);
    const hasIncorrectFb = feedbackIds.has(incorrectId);
    const hasPartialFb = feedbackIds.has(partialId);
    const isMapped = hasMapping(responseDecl);

    if (hasCorrectFb || hasIncorrectFb || hasPartialFb) {
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
        if (hasCorrectFb) {
          responseIf.appendChild(createSetFeedbackElement(correctId, doc));
        }
        condition.appendChild(responseIf);

        // qti-response-else-if: partial (gt 0) — only if _partial feedback is used
        if (hasPartialFb) {
          const responseElseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else-if');
          responseElseIf.appendChild(createMapResponseGtZeroElement(responseId, doc));
          responseElseIf.appendChild(createSetFeedbackElement(partialId, doc));
          condition.appendChild(responseElseIf);
        }

        // qti-response-else: incorrect
        if (hasIncorrectFb) {
          const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
          responseElse.appendChild(createSetFeedbackElement(incorrectId, doc));
          condition.appendChild(responseElse);
        }
      } else {
        // Unmapped: standard two-way via qti-match
        const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');
        responseIf.appendChild(createMatchElement(responseId, doc));
        if (hasCorrectFb) {
          responseIf.appendChild(createSetFeedbackElement(correctId, doc));
        }
        condition.appendChild(responseIf);

        if (hasIncorrectFb) {
          const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
          responseElse.appendChild(createSetFeedbackElement(incorrectId, doc));
          condition.appendChild(responseElse);
        }
      }

      conditions.push(condition);
    }

    // Check for per-choice feedback
    for (const feedbackId of feedbackIds) {
      const parsed = parseFeedbackIdentifier(feedbackId);
      if (parsed?.type === 'choice' && parsed.choiceId) {
        const condition = doc.createElementNS(QTI_NAMESPACE, 'qti-response-condition');
        const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');

        if (cardinality === 'multiple' || cardinality === 'ordered') {
          // qti-member checks if a value is in a container
          const member = doc.createElementNS(QTI_NAMESPACE, 'qti-member');

          const baseValue = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
          baseValue.setAttribute('base-type', 'identifier');
          baseValue.textContent = parsed.choiceId;
          member.appendChild(baseValue);

          const variable = doc.createElementNS(QTI_NAMESPACE, 'qti-variable');
          variable.setAttribute('identifier', responseId);
          member.appendChild(variable);

          responseIf.appendChild(member);
        } else {
          // qti-match checks if two single values are equal
          const match = doc.createElementNS(QTI_NAMESPACE, 'qti-match');

          const variable = doc.createElementNS(QTI_NAMESPACE, 'qti-variable');
          variable.setAttribute('identifier', responseId);
          match.appendChild(variable);

          const baseValue = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
          baseValue.setAttribute('base-type', 'identifier');
          baseValue.textContent = parsed.choiceId;
          match.appendChild(baseValue);

          responseIf.appendChild(match);
        }

        responseIf.appendChild(createSetFeedbackElement(feedbackId, doc));
        condition.appendChild(responseIf);
        conditions.push(condition);
      }
    }

    return conditions;
  },
};
