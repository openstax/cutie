import { canMappingBeNegative, inferExpressionMaxScore, inferResponseMaxScore } from '@openstax/cutie-core';
import { xmlNodeToDom } from '../serialization/xmlNode.js';
import type { ElementConfig, ResponseProcessingConfig, XmlNode } from '../types.js';
import { ITEM_COMPLETED_FEEDBACK_ID, parseFeedbackIdentifier } from './feedbackIdentifiers.js';
import { getMaxMappedValue, getResponseDeclaration, isMappedResponse } from './mappingDeclaration.js';
import { effectiveMaximumScore } from './maximumScore.js';

/**
 * QTI namespace URI
 */
const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

/**
 * Standard template URLs
 */
export const TEMPLATES = {
  matchCorrect: 'https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml',
  mapResponse: 'https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml',
} as const;

/**
 * Generated response processing, with what it tells us about the item's score
 */
export interface GeneratedResponseProcessing {
  /** The generated qti-response-processing element, or null if none is needed */
  responseProcessing: Element | null;
  /**
   * For the modes that manage it, the item's maximum score, declared as MAXSCORE
   * (value null: not known, so no MAXSCORE). Absent for the other modes, which
   * leave MAXSCORE as loaded.
   */
  declaredMaximumScore?: { value: number | null };
  /**
   * For sumScores: the maximum score calculated from the responses, ignoring
   * any maximum set by the author, or null when it can't be calculated
   */
  calculatedMaximumScore?: number | null;
}

/**
 * Generate response processing XML from mode configuration.
 *
 * @param config - The response processing configuration
 * @param responseIdentifiers - List of response identifiers in the item
 * @param responseDeclarations - Map of response identifier to XmlNode declarations
 * @param outcomeDeclarations - Map to populate with intermediate score outcome declarations
 * @param doc - The item document, with its response declarations and item body
 *   up to date (the maximum score is inferred from them)
 * @param feedbackIdentifiersUsed - Set of feedback identifiers used by feedback elements
 * @returns The generated response processing and the item's maximum score
 */
export function generateResponseProcessingXml(
  config: ResponseProcessingConfig,
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  outcomeDeclarations: Map<string, XmlNode>,
  doc: Document,
  feedbackIdentifiersUsed?: Set<string>,
  responseConfigs?: Map<string, ElementConfig>
): GeneratedResponseProcessing {
  // Custom response processing is kept as loaded, whatever the item's interactions
  if (config.mode === 'custom') {
    return { responseProcessing: generateCustomXml(config, doc) };
  }

  // No interactions -> no response processing needed (unless we have feedback),
  // so SCORE isn't set and has no known maximum
  if (responseIdentifiers.length === 0 && (!feedbackIdentifiersUsed || feedbackIdentifiersUsed.size === 0)) {
    return config.mode === 'allCorrect' || config.mode === 'sumScores'
      ? { responseProcessing: null, declaredMaximumScore: { value: null }, calculatedMaximumScore: null }
      : { responseProcessing: null };
  }

  switch (config.mode) {
    case 'allCorrect':
      return {
        responseProcessing: generateAllCorrectXml(responseIdentifiers, responseDeclarations, doc, feedbackIdentifiersUsed, responseConfigs),
        declaredMaximumScore: { value: responseIdentifiers.length > 0 ? 1 : null },
      };
    case 'sumScores':
      return generateSumScoresXml(config, responseIdentifiers, responseDeclarations, outcomeDeclarations, doc, feedbackIdentifiersUsed, responseConfigs);
    case 'manual':
      // SCORE is set by a person, not by response processing
      return { responseProcessing: null };
    default:
      return { responseProcessing: null };
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
  feedbackIdentifiersUsed?: Set<string>,
  responseConfigs?: Map<string, ElementConfig>
): Element {
  const responseProcessing = doc.createElementNS(QTI_NAMESPACE, 'qti-response-processing');
  const hasFeedback = feedbackIdentifiersUsed && feedbackIdentifiersUsed.size > 0;

  // Check if any response has a mapping
  const anyHasMapping = responseIdentifiers.some((id) => isMappedResponse(doc, id));

  // Template shortcut: only when no mapping, no feedback, and single RESPONSE
  if (responseIdentifiers.length === 1 && responseIdentifiers[0] === 'RESPONSE' && !hasFeedback && !anyHasMapping) {
    responseProcessing.setAttribute('template', TEMPLATES.matchCorrect);
    return responseProcessing;
  }

  // Generate inline pattern
  if (responseIdentifiers.length > 0) {
    const condition = doc.createElementNS(QTI_NAMESPACE, 'qti-response-condition');
    const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');

    if (responseIdentifiers.length === 1) {
      // Single interaction: use correctness check directly
      responseIf.appendChild(createCorrectnessCheckForId(responseIdentifiers[0], responseDeclarations, responseConfigs, doc));
    } else {
      // Multiple interactions: use qti-and
      const and = doc.createElementNS(QTI_NAMESPACE, 'qti-and');
      for (const id of responseIdentifiers) {
        and.appendChild(createCorrectnessCheckForId(id, responseDeclarations, responseConfigs, doc));
      }
      responseIf.appendChild(and);
    }

    // Set score to 1
    responseIf.appendChild(createSetScoreElement(1, doc));
    condition.appendChild(responseIf);

    // Response else - set score to 0
    const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
    responseElse.appendChild(createSetScoreElement(0, doc));
    condition.appendChild(responseElse);

    responseProcessing.appendChild(condition);
  }

  // Generate feedback processing rules if feedback elements are used
  if (hasFeedback) {
    const feedbackConditions = generateFeedbackProcessingXml(
      responseIdentifiers,
      responseDeclarations,
      feedbackIdentifiersUsed,
      doc,
      undefined,
      responseConfigs
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
 * For multiple interactions: generate inline qti-sum pattern (see appendSumScoreRule)
 *
 * A score offset, a maximum score set by the author, or a floor (scores never
 * go below 0) rules out the templates. Without responses, SCORE isn't set.
 *
 * Whether responses are mapped, and their maximum scores, are read from the
 * response declarations in doc, as cutie-core reads them in delivery.
 */
function generateSumScoresXml(
  config: ResponseProcessingConfig,
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  outcomeDeclarations: Map<string, XmlNode>,
  doc: Document,
  feedbackIdentifiersUsed?: Set<string>,
  responseConfigs?: Map<string, ElementConfig>
): GeneratedResponseProcessing {
  const responseProcessing = doc.createElementNS(QTI_NAMESPACE, 'qti-response-processing');
  const hasFeedback = feedbackIdentifiersUsed && feedbackIdentifiersUsed.size > 0;
  const { scoreOffset = 0, maximumScore } = config;
  const floored = canSumBeNegative(scoreOffset, maximumScore, responseIdentifiers, doc);
  const needsInlineRule = scoreOffset !== 0 || maximumScore !== undefined || floored;

  // Single interaction with standard identifier, no feedback and a plain sum: use template
  // Both match_correct and map_response templates require identifier to be exactly "RESPONSE"
  if (responseIdentifiers.length === 1 && responseIdentifiers[0] === 'RESPONSE' && !hasFeedback && !needsInlineRule) {
    const id = responseIdentifiers[0];

    if (isMappedResponse(doc, id)) {
      // The template sets SCORE to the mapped response
      responseProcessing.setAttribute('template', TEMPLATES.mapResponse);
      const calculatedMaximumScore = effectiveMaximumScore(undefined, inferResponseMaxScore(doc, id), false);
      return { responseProcessing, declaredMaximumScore: { value: calculatedMaximumScore }, calculatedMaximumScore };
    }

    // No mapping -> use match_correct (1 if correct, 0 if not)
    responseProcessing.setAttribute('template', TEMPLATES.matchCorrect);
    return { responseProcessing, declaredMaximumScore: { value: 1 }, calculatedMaximumScore: 1 };
  }

  // Multiple interactions or has feedback: generate inline pattern
  const withMapping = responseIdentifiers.filter((id) => isMappedResponse(doc, id));
  const withoutMapping = responseIdentifiers.filter((id) => !withMapping.includes(id));

  // For responses without mapping, we need to create intermediate score variables
  // and condition blocks to set them
  for (const id of withoutMapping) {
    // Create outcome declaration for the intermediate score variable
    const scoreId = `${id}_SCORE`;
    outcomeDeclarations.set(scoreId, createOutcomeDeclaration(scoreId));

    responseProcessing.appendChild(createScoreConditionForUnmapped(id, doc));
  }

  const hasScoreRule = responseIdentifiers.length > 0;
  const inferredMaximumScore = hasScoreRule
    ? appendSumScoreRule(responseProcessing, withMapping, withoutMapping, config, floored, doc)
    : null;

  // Generate feedback processing rules if feedback elements are used
  if (hasFeedback) {
    const feedbackConditions = generateFeedbackProcessingXml(
      responseIdentifiers,
      responseDeclarations,
      feedbackIdentifiersUsed,
      doc,
      new Set(withMapping),
      responseConfigs
    );
    for (const fc of feedbackConditions) {
      responseProcessing.appendChild(fc);
    }
  }

  return {
    responseProcessing,
    declaredMaximumScore: {
      value: hasScoreRule ? effectiveMaximumScore(maximumScore, inferredMaximumScore, floored) : null,
    },
    calculatedMaximumScore: effectiveMaximumScore(undefined, inferredMaximumScore, floored),
  };
}

/**
 * Append the rule that sets SCORE to the sum of the response scores:
 *
 * <qti-set-outcome-value identifier="SCORE">
 *   <qti-max>                                    (when floored)
 *     <qti-base-value base-type="float">0</qti-base-value>
 *     <qti-min>                                  (with a maximum score set by the author)
 *       <qti-base-value base-type="float">{maximumScore}</qti-base-value>
 *       <qti-sum>
 *         <qti-base-value base-type="float">{scoreOffset}</qti-base-value>  (with an offset)
 *         <qti-map-response identifier="RESP1"/>  (for mapped)
 *         <qti-variable identifier="RESP2_SCORE"/>  (for unmapped)
 *       </qti-sum>
 *     </qti-min>
 *   </qti-max>
 * </qti-set-outcome-value>
 *
 * The rule is appended after the conditions that set the intermediate scores,
 * where cutie-core finds them when inferring the sum's maximum.
 *
 * @returns The maximum the sum can reach, inferred by cutie-core (so delivery
 *   agrees), or null when it can't be inferred
 */
function appendSumScoreRule(
  responseProcessing: Element,
  withMapping: string[],
  withoutMapping: string[],
  config: ResponseProcessingConfig,
  floored: boolean,
  doc: Document
): number | null {
  const setScore = doc.createElementNS(QTI_NAMESPACE, 'qti-set-outcome-value');
  setScore.setAttribute('identifier', 'SCORE');

  const sum = doc.createElementNS(QTI_NAMESPACE, 'qti-sum');
  if (config.scoreOffset) {
    sum.appendChild(createFloatBaseValue(config.scoreOffset, doc));
  }
  for (const id of withMapping) {
    sum.appendChild(createMapResponse(id, doc));
  }
  for (const id of withoutMapping) {
    sum.appendChild(createVariable(`${id}_SCORE`, doc));
  }

  setScore.appendChild(sum);
  responseProcessing.appendChild(setScore);

  // The intermediate scores are declared afresh with a default of 0 on save
  const inferredMaximumScore = inferExpressionMaxScore(doc, sum, { ignoreOutcomeDefaults: true });
  if (config.maximumScore !== undefined) {
    wrapScoreExpression(setScore, 'qti-min', config.maximumScore, doc);
  }
  if (floored) {
    wrapScoreExpression(setScore, 'qti-max', 0, doc);
  }
  return inferredMaximumScore;
}

/**
 * Whether the total score could be negative, so it needs a floor at 0: a
 * negative offset or maximum score, or a response whose mapping can award a
 * negative value (unmapped responses score 0 or 1). This errs on the side of
 * yes, since flooring a score that can't go negative changes nothing.
 */
function canSumBeNegative(
  offset: number,
  maximumScore: number | undefined,
  responseIdentifiers: string[],
  doc: Document
): boolean {
  return offset < 0
    || (maximumScore !== undefined && maximumScore < 0)
    || responseIdentifiers.some((id) => canMappingBeNegative(doc, id));
}

/**
 * Wrap the expression a qti-set-outcome-value assigns in a qti-min or qti-max
 * with a constant: <{operator}><qti-base-value>{value}</qti-base-value>{expression}</{operator}>
 */
function wrapScoreExpression(setter: Element, operator: 'qti-min' | 'qti-max', value: number, doc: Document): void {
  const expression = setter.firstElementChild!;
  const wrapper = doc.createElementNS(QTI_NAMESPACE, operator);
  setter.replaceChild(wrapper, expression);
  wrapper.appendChild(createFloatBaseValue(value, doc));
  wrapper.appendChild(expression);
}

/**
 * Create a qti-variable reference
 */
function createVariable(identifier: string, doc: Document): Element {
  const variable = doc.createElementNS(QTI_NAMESPACE, 'qti-variable');
  variable.setAttribute('identifier', identifier);
  return variable;
}

/**
 * Create a qti-map-response for a response
 */
function createMapResponse(identifier: string, doc: Document): Element {
  const mapResponse = doc.createElementNS(QTI_NAMESPACE, 'qti-map-response');
  mapResponse.setAttribute('identifier', identifier);
  return mapResponse;
}

/**
 * Create a float qti-base-value
 */
function createFloatBaseValue(value: number, doc: Document): Element {
  const baseValue = doc.createElementNS(QTI_NAMESPACE, 'qti-base-value');
  baseValue.setAttribute('base-type', 'float');
  baseValue.textContent = String(value);
  return baseValue;
}

/**
 * Create the correctness check element for a given response identifier.
 * Delegates to config.generateCorrectnessCheck if available,
 * otherwise uses mapping-based or match-based default.
 */
function createCorrectnessCheckForId(
  id: string,
  responseDeclarations: Map<string, XmlNode>,
  responseConfigs: Map<string, ElementConfig> | undefined,
  doc: Document
): Element {
  const decl = responseDeclarations.get(id);
  const config = responseConfigs?.get(id);

  // Use config method if available
  if (config?.generateCorrectnessCheck && decl) {
    return config.generateCorrectnessCheck(id, decl, doc);
  }

  // Default: if mapping exists, use qti-equal(qti-map-response, maxValue)
  if (isMappedResponse(doc, id)) {
    const maxValue = getMaxMappedValue(getResponseDeclaration(doc, id)!);
    if (maxValue !== null) {
      return createMapResponseEqualElement(id, maxValue, doc);
    }
  }

  // Default: qti-match(variable, correct)
  return createMatchElement(id, doc);
}

/**
 * Create a qti-match element that compares a variable to its correct value
 */
export function createMatchElement(identifier: string, doc: Document): Element {
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
 * Create a qti-equal element that checks if a mapped response equals a specific value.
 * Used for allCorrect correctness checks on mapped responses.
 *
 * <qti-equal>
 *   <qti-map-response identifier="ID"/>
 *   <qti-base-value base-type="float">{value}</qti-base-value>
 * </qti-equal>
 */
export function createMapResponseEqualElement(identifier: string, value: number, doc: Document): Element {
  const equal = doc.createElementNS(QTI_NAMESPACE, 'qti-equal');
  equal.appendChild(createMapResponse(identifier, doc));
  equal.appendChild(createFloatBaseValue(value, doc));
  return equal;
}

/**
 * Create a qti-set-outcome-value element for SCORE
 */
function createSetScoreElement(value: number, doc: Document): Element {
  return createSetOutcomeElement('SCORE', value, doc);
}

/**
 * Create a qti-set-outcome-value element setting an outcome to a float
 */
function createSetOutcomeElement(identifier: string, value: number, doc: Document): Element {
  const setOutcome = doc.createElementNS(QTI_NAMESPACE, 'qti-set-outcome-value');
  setOutcome.setAttribute('identifier', identifier);
  setOutcome.appendChild(createFloatBaseValue(value, doc));
  return setOutcome;
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

  const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');
  responseIf.appendChild(createMatchElement(identifier, doc));
  responseIf.appendChild(createSetOutcomeElement(`${identifier}_SCORE`, 1, doc));
  condition.appendChild(responseIf);

  const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
  responseElse.appendChild(createSetOutcomeElement(`${identifier}_SCORE`, 0, doc));
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
 * Then, when item-level feedback is used, an unconditional rule that sets
 * ITEM_completed: response processing only runs when a submission completes
 * the (non-adaptive) item.
 *
 * @param responseIdentifiers - List of response identifiers in the item
 * @param responseDeclarations - Map of response identifier to XmlNode declarations
 * @param feedbackIdentifiersUsed - Set of feedback identifiers used by feedback elements
 * @param doc - The XML document to create elements in
 * @returns Array of response rules for feedback processing
 */
function generateFeedbackProcessingXml(
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  feedbackIdentifiersUsed: Set<string>,
  doc: Document,
  mappedResponseIds?: Set<string>,
  responseConfigs?: Map<string, ElementConfig>
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

    const responseDecl = responseDeclarations.get(responseId);
    const config = responseConfigs?.get(responseId);

    // Delegate to config if it provides generateFeedbackConditions
    if (config?.generateFeedbackConditions && responseDecl) {
      const configConditions = config.generateFeedbackConditions(
        responseId, responseDecl, feedbackIds, doc
      );
      conditions.push(...configConditions);
      continue;
    }

    // Default feedback generation
    const cardinality = responseDecl?.attributes?.cardinality || 'single';

    // Check for correct/incorrect/partial feedback
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

  if (feedbackIdentifiersUsed.has(ITEM_COMPLETED_FEEDBACK_ID)) {
    conditions.push(createSetFeedbackElement(ITEM_COMPLETED_FEEDBACK_ID, doc));
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
export function createMapResponseGtZeroElement(identifier: string, doc: Document): Element {
  const gt = doc.createElementNS(QTI_NAMESPACE, 'qti-gt');
  gt.appendChild(createMapResponse(identifier, doc));
  gt.appendChild(createFloatBaseValue(0, doc));
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
export function createSetFeedbackElement(feedbackId: string, doc: Document): Element {
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
