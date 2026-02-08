import { xmlNodeToDom } from '../serialization/xmlNode';
import type { ResponseProcessingConfig, XmlNode } from '../types';
import { parseFeedbackIdentifier } from './feedbackIdentifiers';
import { hasMapping } from './responseProcessingClassifier';

/**
 * QTI namespace URI
 */
const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

/**
 * Standard template URLs
 */
const TEMPLATES = {
  matchCorrect: 'https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml',
  mapResponse: 'https://www.imsglobal.org/question/qti_v3p0/rptemplates/map_response.xml',
} as const;

/**
 * Generate response processing XML from mode configuration.
 *
 * @param config - The response processing configuration
 * @param responseIdentifiers - List of response identifiers in the item
 * @param responseDeclarations - Map of response identifier to XmlNode declarations
 * @param outcomeDeclarations - Map to populate with intermediate score outcome declarations
 * @param doc - The XML document to create elements in
 * @param feedbackIdentifiersUsed - Set of feedback identifiers used by feedback elements
 * @returns The generated qti-response-processing element, or null if none needed
 */
export function generateResponseProcessingXml(
  config: ResponseProcessingConfig,
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  outcomeDeclarations: Map<string, XmlNode>,
  doc: Document,
  feedbackIdentifiersUsed?: Set<string>
): Element | null {
  // No interactions -> no response processing needed (unless we have feedback)
  if (responseIdentifiers.length === 0 && (!feedbackIdentifiersUsed || feedbackIdentifiersUsed.size === 0)) {
    return null;
  }

  switch (config.mode) {
    case 'custom':
      return generateCustomXml(config, doc);
    case 'allCorrect':
      return generateAllCorrectXml(responseIdentifiers, responseDeclarations, doc, feedbackIdentifiersUsed);
    case 'sumScores':
      return generateSumScoresXml(responseIdentifiers, responseDeclarations, outcomeDeclarations, doc, feedbackIdentifiersUsed);
    default:
      return null;
  }
}

/**
 * Generate custom response processing by restoring preserved XML
 */
function generateCustomXml(config: ResponseProcessingConfig, doc: Document): Element | null {
  if (!config.customXml) {
    return null;
  }
  return xmlNodeToDom(config.customXml, doc);
}

/**
 * Generate allCorrect response processing.
 *
 * For single interaction: use template (unless feedback is used)
 * For multiple interactions: generate inline qti-and pattern
 */
function generateAllCorrectXml(
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  doc: Document,
  feedbackIdentifiersUsed?: Set<string>
): Element {
  const responseProcessing = doc.createElementNS(QTI_NAMESPACE, 'qti-response-processing');
  const hasFeedback = feedbackIdentifiersUsed && feedbackIdentifiersUsed.size > 0;

  // Single interaction with standard identifier and no feedback: use template
  // The match_correct template requires identifier to be exactly "RESPONSE"
  if (responseIdentifiers.length === 1 && responseIdentifiers[0] === 'RESPONSE' && !hasFeedback) {
    responseProcessing.setAttribute('template', TEMPLATES.matchCorrect);
    return responseProcessing;
  }

  // Generate inline pattern when we have multiple interactions or feedback
  if (responseIdentifiers.length > 0) {
    // <qti-response-condition>
    //   <qti-response-if>
    //     <qti-and>
    //       <qti-match><qti-variable identifier="RESP1"/><qti-correct identifier="RESP1"/></qti-match>
    //       ...
    //     </qti-and>
    //     <qti-set-outcome-value identifier="SCORE">
    //       <qti-base-value base-type="float">1</qti-base-value>
    //     </qti-set-outcome-value>
    //   </qti-response-if>
    //   <qti-response-else>
    //     <qti-set-outcome-value identifier="SCORE">
    //       <qti-base-value base-type="float">0</qti-base-value>
    //     </qti-set-outcome-value>
    //   </qti-response-else>
    // </qti-response-condition>

    const condition = doc.createElementNS(QTI_NAMESPACE, 'qti-response-condition');

    // Response if
    const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');

    if (responseIdentifiers.length === 1) {
      // Single interaction: use qti-match directly
      responseIf.appendChild(createMatchElement(responseIdentifiers[0], doc));
    } else {
      // Multiple interactions: use qti-and
      const and = doc.createElementNS(QTI_NAMESPACE, 'qti-and');
      for (const id of responseIdentifiers) {
        and.appendChild(createMatchElement(id, doc));
      }
      responseIf.appendChild(and);
    }

    // Set score to 1
    responseIf.appendChild(createSetScoreElement('1', doc));

    condition.appendChild(responseIf);

    // Response else - set score to 0
    const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
    responseElse.appendChild(createSetScoreElement('0', doc));
    condition.appendChild(responseElse);

    responseProcessing.appendChild(condition);
  }

  // Generate feedback processing rules if feedback elements are used
  if (hasFeedback) {
    const feedbackConditions = generateFeedbackProcessingXml(
      responseIdentifiers,
      responseDeclarations,
      feedbackIdentifiersUsed,
      doc
    );
    for (const fc of feedbackConditions) {
      responseProcessing.appendChild(fc);
    }
  }

  return responseProcessing;
}

/**
 * Create an outcome declaration XmlNode for an intermediate score variable.
 * These are used for unmapped responses in sumScores mode.
 */
function createOutcomeDeclaration(identifier: string): XmlNode {
  return {
    tagName: 'qti-outcome-declaration',
    attributes: {
      identifier,
      cardinality: 'single',
      'base-type': 'float',
    },
    children: [
      {
        tagName: 'qti-default-value',
        attributes: {},
        children: [
          {
            tagName: 'qti-value',
            attributes: {},
            children: ['0'],
          },
        ],
      },
    ],
  };
}

/**
 * Generate sumScores response processing.
 *
 * For single interaction with mapping: use map_response template (unless feedback is used)
 * For single interaction without mapping: use match_correct template (1 if correct, 0 otherwise)
 * For multiple interactions: generate inline qti-sum pattern
 */
function generateSumScoresXml(
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  outcomeDeclarations: Map<string, XmlNode>,
  doc: Document,
  feedbackIdentifiersUsed?: Set<string>
): Element {
  const responseProcessing = doc.createElementNS(QTI_NAMESPACE, 'qti-response-processing');
  const hasFeedback = feedbackIdentifiersUsed && feedbackIdentifiersUsed.size > 0;

  // Single interaction with standard identifier and no feedback: use template
  // Both match_correct and map_response templates require identifier to be exactly "RESPONSE"
  if (responseIdentifiers.length === 1 && responseIdentifiers[0] === 'RESPONSE' && !hasFeedback) {
    const id = responseIdentifiers[0];
    const decl = responseDeclarations.get(id);
    const hasMappingDefined = decl && hasMapping(decl);

    if (hasMappingDefined) {
      responseProcessing.setAttribute('template', TEMPLATES.mapResponse);
    } else {
      // No mapping -> use match_correct (1 if correct, 0 if not)
      responseProcessing.setAttribute('template', TEMPLATES.matchCorrect);
    }
    return responseProcessing;
  }

  // Multiple interactions or has feedback: generate inline pattern
  // First, determine which responses have mappings and which don't
  const withMapping: string[] = [];
  const withoutMapping: string[] = [];

  for (const id of responseIdentifiers) {
    const decl = responseDeclarations.get(id);
    if (decl && hasMapping(decl)) {
      withMapping.push(id);
    } else {
      withoutMapping.push(id);
    }
  }

  // For responses without mapping, we need to create intermediate score variables
  // and condition blocks to set them
  for (const id of withoutMapping) {
    // Create outcome declaration for the intermediate score variable
    const scoreId = `${id}_SCORE`;
    outcomeDeclarations.set(scoreId, createOutcomeDeclaration(scoreId));

    responseProcessing.appendChild(createScoreConditionForUnmapped(id, doc));
  }

  // Now create the sum that adds all scores together
  // <qti-set-outcome-value identifier="SCORE">
  //   <qti-sum>
  //     <qti-map-response identifier="RESP1"/>  (for mapped)
  //     <qti-variable identifier="RESP2_SCORE"/>  (for unmapped)
  //   </qti-sum>
  // </qti-set-outcome-value>

  const setScore = doc.createElementNS(QTI_NAMESPACE, 'qti-set-outcome-value');
  setScore.setAttribute('identifier', 'SCORE');

  const sum = doc.createElementNS(QTI_NAMESPACE, 'qti-sum');

  // Add map-response for responses with mapping
  for (const id of withMapping) {
    const mapResponse = doc.createElementNS(QTI_NAMESPACE, 'qti-map-response');
    mapResponse.setAttribute('identifier', id);
    sum.appendChild(mapResponse);
  }

  // Add variable references for responses without mapping
  for (const id of withoutMapping) {
    const variable = doc.createElementNS(QTI_NAMESPACE, 'qti-variable');
    variable.setAttribute('identifier', `${id}_SCORE`);
    sum.appendChild(variable);
  }

  setScore.appendChild(sum);
  responseProcessing.appendChild(setScore);

  // Generate feedback processing rules if feedback elements are used
  if (hasFeedback) {
    const feedbackConditions = generateFeedbackProcessingXml(
      responseIdentifiers,
      responseDeclarations,
      feedbackIdentifiersUsed,
      doc,
      new Set(withMapping)
    );
    for (const fc of feedbackConditions) {
      responseProcessing.appendChild(fc);
    }
  }

  return responseProcessing;
}

/**
 * Create a qti-match element that compares a variable to its correct value
 */
function createMatchElement(identifier: string, doc: Document): Element {
  const match = doc.createElementNS(QTI_NAMESPACE, 'qti-match');

  const variable = doc.createElementNS(QTI_NAMESPACE, 'qti-variable');
  variable.setAttribute('identifier', identifier);
  match.appendChild(variable);

  const correct = doc.createElementNS(QTI_NAMESPACE, 'qti-correct');
  correct.setAttribute('identifier', identifier);
  match.appendChild(correct);

  return match;
}

/**
 * Create a qti-set-outcome-value element for SCORE
 */
function createSetScoreElement(value: string, doc: Document): Element {
  const setScore = doc.createElementNS(QTI_NAMESPACE, 'qti-set-outcome-value');
  setScore.setAttribute('identifier', 'SCORE');

  const baseValue = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
  baseValue.setAttribute('base-type', 'float');
  baseValue.textContent = value;
  setScore.appendChild(baseValue);

  return setScore;
}

/**
 * Create a condition block that sets an intermediate score variable for an unmapped response.
 *
 * <qti-response-condition>
 *   <qti-response-if>
 *     <qti-match>
 *       <qti-variable identifier="RESP"/>
 *       <qti-correct identifier="RESP"/>
 *     </qti-match>
 *     <qti-set-outcome-value identifier="RESP_SCORE">
 *       <qti-base-value base-type="float">1</qti-base-value>
 *     </qti-set-outcome-value>
 *   </qti-response-if>
 *   <qti-response-else>
 *     <qti-set-outcome-value identifier="RESP_SCORE">
 *       <qti-base-value base-type="float">0</qti-base-value>
 *     </qti-set-outcome-value>
 *   </qti-response-else>
 * </qti-response-condition>
 */
function createScoreConditionForUnmapped(identifier: string, doc: Document): Element {
  const condition = doc.createElementNS(QTI_NAMESPACE, 'qti-response-condition');

  // Response if
  const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');
  responseIf.appendChild(createMatchElement(identifier, doc));

  const setScore1 = doc.createElementNS(QTI_NAMESPACE, 'qti-set-outcome-value');
  setScore1.setAttribute('identifier', `${identifier}_SCORE`);
  const baseValue1 = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
  baseValue1.setAttribute('base-type', 'float');
  baseValue1.textContent = '1';
  setScore1.appendChild(baseValue1);
  responseIf.appendChild(setScore1);

  condition.appendChild(responseIf);

  // Response else
  const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
  const setScore0 = doc.createElementNS(QTI_NAMESPACE, 'qti-set-outcome-value');
  setScore0.setAttribute('identifier', `${identifier}_SCORE`);
  const baseValue0 = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
  baseValue0.setAttribute('base-type', 'float');
  baseValue0.textContent = '0';
  setScore0.appendChild(baseValue0);
  responseElse.appendChild(setScore0);

  condition.appendChild(responseElse);

  return condition;
}

/**
 * Generate feedback processing rules for the FEEDBACK outcome variable.
 *
 * Creates condition blocks for each response identifier that has feedback identifiers used:
 * - {responseId}_correct / {responseId}_incorrect for correct/incorrect feedback
 * - {responseId}_choice_{choiceId} for per-choice feedback
 *
 * @param responseIdentifiers - List of response identifiers in the item
 * @param responseDeclarations - Map of response identifier to XmlNode declarations
 * @param feedbackIdentifiersUsed - Set of feedback identifiers used by feedback elements
 * @param doc - The XML document to create elements in
 * @returns Array of qti-response-condition elements for feedback processing
 */
function generateFeedbackProcessingXml(
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  feedbackIdentifiersUsed: Set<string>,
  doc: Document,
  mappedResponseIds?: Set<string>
): Element[] {
  const conditions: Element[] = [];

  // Group feedback identifiers by response identifier
  const feedbackByResponse = new Map<string, Set<string>>();
  for (const feedbackId of feedbackIdentifiersUsed) {
    const parsed = parseFeedbackIdentifier(feedbackId);
    if (parsed) {
      if (!feedbackByResponse.has(parsed.responseIdentifier)) {
        feedbackByResponse.set(parsed.responseIdentifier, new Set());
      }
      feedbackByResponse.get(parsed.responseIdentifier)!.add(feedbackId);
    }
  }

  // Generate conditions for each response that has feedback
  for (const responseId of responseIdentifiers) {
    const feedbackIds = feedbackByResponse.get(responseId);
    if (!feedbackIds || feedbackIds.size === 0) continue;

    // Get response declaration to check cardinality
    const responseDecl = responseDeclarations.get(responseId);
    const cardinality = responseDecl?.attributes?.cardinality || 'single';

    // Check for correct/incorrect feedback
    const correctId = `${responseId}_correct`;
    const incorrectId = `${responseId}_incorrect`;
    const hasCorrect = feedbackIds.has(correctId);
    const hasIncorrect = feedbackIds.has(incorrectId);

    if (hasCorrect || hasIncorrect) {
      // For responses with mappings, use qti-map-response > 0 instead of qti-match
      // so that feedback agrees with case-insensitive mapped scoring
      const useMapResponse = mappedResponseIds?.has(responseId) ?? false;
      const condition = createFeedbackCorrectIncorrectCondition(
        responseId,
        hasCorrect ? correctId : null,
        hasIncorrect ? incorrectId : null,
        doc,
        useMapResponse
      );
      conditions.push(condition);
    }

    // Check for per-choice feedback
    for (const feedbackId of feedbackIds) {
      const parsed = parseFeedbackIdentifier(feedbackId);
      if (parsed?.type === 'choice' && parsed.choiceId) {
        const condition = createFeedbackChoiceCondition(
          responseId,
          parsed.choiceId,
          feedbackId,
          cardinality,
          doc
        );
        conditions.push(condition);
      }
    }
  }

  return conditions;
}

/**
 * Create a feedback condition for correct/incorrect responses.
 *
 * For unmapped responses (useMapResponse=false), uses qti-match:
 * <qti-response-condition>
 *   <qti-response-if>
 *     <qti-match>
 *       <qti-variable identifier="RESPONSE"/>
 *       <qti-correct identifier="RESPONSE"/>
 *     </qti-match>
 *     <qti-set-outcome-value identifier="FEEDBACK">...</qti-set-outcome-value>
 *   </qti-response-if>
 *   <qti-response-else>
 *     <qti-set-outcome-value identifier="FEEDBACK">...</qti-set-outcome-value>
 *   </qti-response-else>
 * </qti-response-condition>
 *
 * For mapped responses (useMapResponse=true), uses qti-gt with qti-map-response
 * so that feedback agrees with case-insensitive mapped scoring:
 * <qti-response-condition>
 *   <qti-response-if>
 *     <qti-gt>
 *       <qti-map-response identifier="RESPONSE"/>
 *       <qti-base-value base-type="float">0</qti-base-value>
 *     </qti-gt>
 *     <qti-set-outcome-value identifier="FEEDBACK">...</qti-set-outcome-value>
 *   </qti-response-if>
 *   <qti-response-else>
 *     <qti-set-outcome-value identifier="FEEDBACK">...</qti-set-outcome-value>
 *   </qti-response-else>
 * </qti-response-condition>
 */
function createFeedbackCorrectIncorrectCondition(
  responseId: string,
  correctFeedbackId: string | null,
  incorrectFeedbackId: string | null,
  doc: Document,
  useMapResponse: boolean = false
): Element {
  const condition = doc.createElementNS(QTI_NAMESPACE, 'qti-response-condition');

  // Response if - when correct
  const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');
  if (useMapResponse) {
    responseIf.appendChild(createMapResponseGtZeroElement(responseId, doc));
  } else {
    responseIf.appendChild(createMatchElement(responseId, doc));
  }

  if (correctFeedbackId) {
    responseIf.appendChild(createSetFeedbackElement(correctFeedbackId, doc));
  }

  condition.appendChild(responseIf);

  // Response else - when incorrect
  if (incorrectFeedbackId) {
    const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
    responseElse.appendChild(createSetFeedbackElement(incorrectFeedbackId, doc));
    condition.appendChild(responseElse);
  }

  return condition;
}

/**
 * Create a qti-gt element that checks if a mapped response score is greater than 0.
 * Used for feedback conditions on responses with mappings, so that feedback
 * uses the same case-insensitive matching as the scoring.
 */
function createMapResponseGtZeroElement(identifier: string, doc: Document): Element {
  const gt = doc.createElementNS(QTI_NAMESPACE, 'qti-gt');

  const mapResponse = doc.createElementNS(QTI_NAMESPACE, 'qti-map-response');
  mapResponse.setAttribute('identifier', identifier);
  gt.appendChild(mapResponse);

  const baseValue = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
  baseValue.setAttribute('base-type', 'float');
  baseValue.textContent = '0';
  gt.appendChild(baseValue);

  return gt;
}

/**
 * Create a feedback condition for a specific choice selection.
 *
 * For multiple cardinality (uses qti-member):
 * <qti-response-condition>
 *   <qti-response-if>
 *     <qti-member>
 *       <qti-base-value base-type="identifier">choice_A</qti-base-value>
 *       <qti-variable identifier="RESPONSE"/>
 *     </qti-member>
 *     <qti-set-outcome-value identifier="FEEDBACK">...</qti-set-outcome-value>
 *   </qti-response-if>
 * </qti-response-condition>
 *
 * For single cardinality (uses qti-match):
 * <qti-response-condition>
 *   <qti-response-if>
 *     <qti-match>
 *       <qti-variable identifier="RESPONSE"/>
 *       <qti-base-value base-type="identifier">choice_A</qti-base-value>
 *     </qti-match>
 *     <qti-set-outcome-value identifier="FEEDBACK">...</qti-set-outcome-value>
 *   </qti-response-if>
 * </qti-response-condition>
 */
function createFeedbackChoiceCondition(
  responseId: string,
  choiceId: string,
  feedbackId: string,
  cardinality: string,
  doc: Document
): Element {
  const condition = doc.createElementNS(QTI_NAMESPACE, 'qti-response-condition');

  // Response if - when choice is selected
  const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');

  if (cardinality === 'multiple' || cardinality === 'ordered') {
    // qti-member checks if a value is in a container (for multiple cardinality)
    const member = doc.createElementNS(QTI_NAMESPACE, 'qti-member');

    const baseValue = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
    baseValue.setAttribute('base-type', 'identifier');
    baseValue.textContent = choiceId;
    member.appendChild(baseValue);

    const variable = doc.createElementNS(QTI_NAMESPACE, 'qti-variable');
    variable.setAttribute('identifier', responseId);
    member.appendChild(variable);

    responseIf.appendChild(member);
  } else {
    // qti-match checks if two single values are equal (for single cardinality)
    const match = doc.createElementNS(QTI_NAMESPACE, 'qti-match');

    const variable = doc.createElementNS(QTI_NAMESPACE, 'qti-variable');
    variable.setAttribute('identifier', responseId);
    match.appendChild(variable);

    const baseValue = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
    baseValue.setAttribute('base-type', 'identifier');
    baseValue.textContent = choiceId;
    match.appendChild(baseValue);

    responseIf.appendChild(match);
  }

  responseIf.appendChild(createSetFeedbackElement(feedbackId, doc));

  condition.appendChild(responseIf);

  return condition;
}

/**
 * Create a qti-set-outcome-value element for FEEDBACK using accumulation pattern.
 *
 * <qti-set-outcome-value identifier="FEEDBACK">
 *   <qti-multiple>
 *     <qti-variable identifier="FEEDBACK"/>
 *     <qti-base-value base-type="identifier">{feedbackId}</qti-base-value>
 *   </qti-multiple>
 * </qti-set-outcome-value>
 */
function createSetFeedbackElement(feedbackId: string, doc: Document): Element {
  const setOutcome = doc.createElementNS(QTI_NAMESPACE, 'qti-set-outcome-value');
  setOutcome.setAttribute('identifier', 'FEEDBACK');

  const multiple = doc.createElementNS(QTI_NAMESPACE, 'qti-multiple');

  // Accumulation: include existing FEEDBACK values
  const varRef = doc.createElementNS(QTI_NAMESPACE, 'qti-variable');
  varRef.setAttribute('identifier', 'FEEDBACK');
  multiple.appendChild(varRef);

  // Add the new feedback identifier
  const baseValue = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
  baseValue.setAttribute('base-type', 'identifier');
  baseValue.textContent = feedbackId;
  multiple.appendChild(baseValue);

  setOutcome.appendChild(multiple);

  return setOutcome;
}
