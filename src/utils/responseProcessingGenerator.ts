import { xmlNodeToDom } from '../serialization/xmlNode';
import type { ResponseProcessingConfig, XmlNode } from '../types';
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
 * @returns The generated qti-response-processing element, or null if none needed
 */
export function generateResponseProcessingXml(
  config: ResponseProcessingConfig,
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  outcomeDeclarations: Map<string, XmlNode>,
  doc: Document
): Element | null {
  // No interactions -> no response processing
  if (responseIdentifiers.length === 0) {
    return null;
  }

  switch (config.mode) {
    case 'custom':
      return generateCustomXml(config, doc);
    case 'allCorrect':
      return generateAllCorrectXml(responseIdentifiers, doc);
    case 'sumScores':
      return generateSumScoresXml(responseIdentifiers, responseDeclarations, outcomeDeclarations, doc);
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
 * For single interaction: use template
 * For multiple interactions: generate inline qti-and pattern
 */
function generateAllCorrectXml(responseIdentifiers: string[], doc: Document): Element {
  const responseProcessing = doc.createElementNS(QTI_NAMESPACE, 'qti-response-processing');

  // Single interaction with standard identifier: use template
  // The match_correct template requires identifier to be exactly "RESPONSE"
  if (responseIdentifiers.length === 1 && responseIdentifiers[0] === 'RESPONSE') {
    responseProcessing.setAttribute('template', TEMPLATES.matchCorrect);
    return responseProcessing;
  }

  // Multiple interactions: generate inline pattern
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

  // And element with matches
  const and = doc.createElementNS(QTI_NAMESPACE, 'qti-and');
  for (const id of responseIdentifiers) {
    and.appendChild(createMatchElement(id, doc));
  }
  responseIf.appendChild(and);

  // Set score to 1
  responseIf.appendChild(createSetScoreElement('1', doc));

  condition.appendChild(responseIf);

  // Response else - set score to 0
  const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
  responseElse.appendChild(createSetScoreElement('0', doc));
  condition.appendChild(responseElse);

  responseProcessing.appendChild(condition);

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
 * For single interaction with mapping: use map_response template
 * For single interaction without mapping: use match_correct template (1 if correct, 0 otherwise)
 * For multiple interactions: generate inline qti-sum pattern
 */
function generateSumScoresXml(
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  outcomeDeclarations: Map<string, XmlNode>,
  doc: Document
): Element {
  const responseProcessing = doc.createElementNS(QTI_NAMESPACE, 'qti-response-processing');

  // Single interaction with standard identifier: use template
  // Both match_correct and map_response templates require identifier to be exactly "RESPONSE"
  if (responseIdentifiers.length === 1 && responseIdentifiers[0] === 'RESPONSE') {
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

  // Multiple interactions: generate inline pattern
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
