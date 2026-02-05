import { domToXmlNode } from '../serialization/xmlNode';
import type { ResponseProcessingConfig, ResponseProcessingMode, XmlNode } from '../types';
import { isStandardFeedbackIdentifier } from './feedbackIdentifiers';

/**
 * Known response processing template URLs
 */
const TEMPLATE_PATTERNS = {
  matchCorrect: /match_correct\.xml$/,
  mapResponse: /map_response\.xml$/,
} as const;

/**
 * Classify response processing from a QTI document into a mode.
 *
 * Detection algorithm:
 * 1. Template detection (high confidence):
 *    - match_correct.xml -> allCorrect
 *    - map_response.xml -> sumScores
 *    - Unknown template -> custom
 *
 * 2. Inline pattern detection:
 *    - Single qti-and over qti-match calls -> allCorrect
 *    - qti-sum over qti-map-response or scores -> sumScores
 *    - Anything else -> custom
 *
 * 3. Edge cases:
 *    - No response processing element -> default to allCorrect
 *    - Empty response processing -> default to allCorrect
 *
 * @param doc - The QTI XML document
 * @returns ResponseProcessingConfig with the detected mode
 */
export function classifyResponseProcessing(doc: Document): ResponseProcessingConfig {
  const responseProcessing = doc.querySelector('qti-response-processing');

  // No response processing element -> default to allCorrect
  if (!responseProcessing) {
    return { mode: 'allCorrect' };
  }

  // Check for template attribute first
  const template = responseProcessing.getAttribute('template');
  if (template) {
    const mode = classifyTemplate(template);
    if (mode !== 'custom') {
      return { mode };
    }
    // Unknown template -> preserve as custom
    return {
      mode: 'custom',
      customXml: domToXmlNode(responseProcessing),
    };
  }

  // No template - check inline content
  // Empty response processing -> default to allCorrect
  if (!responseProcessing.children.length) {
    return { mode: 'allCorrect' };
  }

  // Try to classify inline patterns
  const inlineMode = classifyInlinePattern(responseProcessing);
  if (inlineMode === 'custom') {
    // Unrecognized scoring pattern -> preserve as custom
    return {
      mode: 'custom',
      customXml: domToXmlNode(responseProcessing),
    };
  }

  // Check if feedback patterns are standard (we can manage them)
  if (!areFeedbackPatternsStandard(responseProcessing)) {
    // Unrecognized feedback pattern -> preserve entire response processing as custom
    return {
      mode: 'custom',
      customXml: domToXmlNode(responseProcessing),
    };
  }

  return { mode: inlineMode };
}

/**
 * Classify a template URL into a mode
 */
function classifyTemplate(templateUrl: string): ResponseProcessingMode {
  if (TEMPLATE_PATTERNS.matchCorrect.test(templateUrl)) {
    return 'allCorrect';
  }
  if (TEMPLATE_PATTERNS.mapResponse.test(templateUrl)) {
    return 'sumScores';
  }
  return 'custom';
}

/**
 * Classify inline response processing patterns.
 *
 * Recognized patterns:
 *
 * allCorrect pattern (single interaction):
 *   <qti-response-condition>
 *     <qti-response-if>
 *       <qti-match><qti-variable/><qti-correct/></qti-match>
 *       <qti-set-outcome-value identifier="SCORE">1</qti-set-outcome-value>
 *     </qti-response-if>
 *     <qti-response-else>
 *       <qti-set-outcome-value identifier="SCORE">0</qti-set-outcome-value>
 *     </qti-response-else>
 *   </qti-response-condition>
 *
 * allCorrect pattern (multiple interactions):
 *   <qti-response-condition>
 *     <qti-response-if>
 *       <qti-and>
 *         <qti-match>...</qti-match>
 *         <qti-match>...</qti-match>
 *       </qti-and>
 *       <qti-set-outcome-value identifier="SCORE">1</qti-set-outcome-value>
 *     </qti-response-if>
 *     ...
 *   </qti-response-condition>
 *
 * sumScores pattern:
 *   <qti-set-outcome-value identifier="SCORE">
 *     <qti-sum>
 *       <qti-map-response/>  or  <qti-variable identifier="*_SCORE"/>
 *       ...
 *     </qti-sum>
 *   </qti-set-outcome-value>
 */
function classifyInlinePattern(responseProcessing: Element): ResponseProcessingMode {
  // Check for sumScores pattern: qti-set-outcome-value with qti-sum
  if (isSumScoresPattern(responseProcessing)) {
    return 'sumScores';
  }

  // Check for allCorrect pattern
  if (isAllCorrectPattern(responseProcessing)) {
    return 'allCorrect';
  }

  return 'custom';
}

/**
 * Check if the response processing follows the sumScores pattern:
 * A qti-set-outcome-value for SCORE containing a qti-sum,
 * optionally followed by feedback-only conditions
 */
function isSumScoresPattern(responseProcessing: Element): boolean {
  let foundSumScores = false;

  // Process all top-level children
  for (const child of responseProcessing.children) {
    const tagName = child.tagName.toLowerCase();

    if (tagName === 'qti-set-outcome-value') {
      const identifier = child.getAttribute('identifier');
      if (identifier === 'SCORE') {
        const sum = child.querySelector('qti-sum');
        if (sum) {
          // Verify it contains map-response or variable references
          const mapResponses = sum.querySelectorAll('qti-map-response');
          const variables = sum.querySelectorAll('qti-variable');
          if (mapResponses.length > 0 || variables.length > 0) {
            foundSumScores = true;
            continue;
          }
        }
      }
      // Non-sum SCORE setter or SCORE setter without valid sum -> not sumScores
      return false;
    }

    if (tagName === 'qti-response-condition') {
      // Any response condition after sum must be feedback-only
      if (foundSumScores) {
        if (!isFeedbackOnlyCondition(child)) {
          return false;
        }
      } else {
        // Response condition before sum pattern -> not sumScores
        return false;
      }
    }
  }

  return foundSumScores;
}

/**
 * Check if the response processing follows the allCorrect pattern:
 * A condition that checks all responses match correct and sets SCORE to 1 or 0,
 * optionally followed by feedback-only conditions
 */
function isAllCorrectPattern(responseProcessing: Element): boolean {
  const conditions = responseProcessing.querySelectorAll(':scope > qti-response-condition');

  if (conditions.length === 0) {
    return false;
  }

  // First condition must be the scoring condition
  const firstCondition = conditions[0];
  if (!isAllCorrectScoringCondition(firstCondition)) {
    return false;
  }

  // Additional conditions must be feedback-only conditions
  for (let i = 1; i < conditions.length; i++) {
    if (!isFeedbackOnlyCondition(conditions[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a condition follows the allCorrect scoring pattern:
 * A qti-and over qti-match calls (multiple interactions) or
 * a single qti-match call (single interaction)
 */
function isAllCorrectScoringCondition(condition: Element): boolean {
  const responseIf = condition.querySelector(':scope > qti-response-if');
  if (!responseIf) {
    return false;
  }

  // Check if the condition is a qti-and (multiple interactions) or qti-match (single interaction)
  const and = responseIf.querySelector(':scope > qti-and');
  const match = responseIf.querySelector(':scope > qti-match');

  if (and) {
    // Multiple interactions: all children should be qti-match elements
    const matches = and.querySelectorAll(':scope > qti-match');
    if (matches.length === 0) {
      return false;
    }
    // Verify all matches compare variable to correct
    for (const m of matches) {
      if (!isMatchVariableToCorrect(m)) {
        return false;
      }
    }
    return true;
  }

  if (match) {
    // Single interaction: verify it compares variable to correct
    return isMatchVariableToCorrect(match);
  }

  return false;
}

/**
 * Check if a qti-match element compares a variable to its correct value
 * Pattern: <qti-match><qti-variable identifier="X"/><qti-correct identifier="X"/></qti-match>
 */
function isMatchVariableToCorrect(match: Element): boolean {
  const variable = match.querySelector('qti-variable');
  const correct = match.querySelector('qti-correct');

  if (!variable || !correct) {
    return false;
  }

  const varId = variable.getAttribute('identifier');
  const correctId = correct.getAttribute('identifier');

  // The identifiers should match
  return varId !== null && varId === correctId;
}

/**
 * Check if a response declaration has a mapping element
 */
export function hasMapping(responseDeclaration: XmlNode): boolean {
  return responseDeclaration.children.some(
    (child): child is XmlNode =>
      typeof child !== 'string' && child.tagName === 'qti-mapping'
  );
}

/**
 * Check if all feedback patterns in the response processing are standard
 * (i.e., patterns we can recognize and regenerate).
 *
 * Standard feedback pattern:
 * - Sets FEEDBACK outcome variable
 * - Uses accumulation pattern with qti-multiple
 * - Identifier values match {responseId}_{type} pattern
 *
 * If there are no feedback patterns, returns true (no feedback is valid).
 */
function areFeedbackPatternsStandard(responseProcessing: Element): boolean {
  // Find all qti-set-outcome-value elements that set FEEDBACK
  const feedbackSetters = responseProcessing.querySelectorAll(
    'qti-set-outcome-value[identifier="FEEDBACK"]'
  );

  // No feedback setters -> no feedback patterns -> standard (nothing to manage)
  if (feedbackSetters.length === 0) {
    return true;
  }

  // Check each feedback setter
  for (const setter of feedbackSetters) {
    if (!isStandardFeedbackSetter(setter)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a qti-response-condition only sets FEEDBACK outcome variables
 * using standard patterns. This is used to recognize feedback-only conditions
 * that follow the scoring condition.
 */
function isFeedbackOnlyCondition(condition: Element): boolean {
  // Get all set-outcome-value elements anywhere in the condition
  const setters = condition.querySelectorAll('qti-set-outcome-value');

  // Must have at least one setter
  if (setters.length === 0) {
    return false;
  }

  // All setters must be for FEEDBACK and follow standard pattern
  for (const setter of setters) {
    const identifier = setter.getAttribute('identifier');
    if (identifier !== 'FEEDBACK') {
      return false;
    }
    if (!isStandardFeedbackSetter(setter)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a qti-set-outcome-value for FEEDBACK follows the standard pattern:
 *
 * <qti-set-outcome-value identifier="FEEDBACK">
 *   <qti-multiple>
 *     <qti-variable identifier="FEEDBACK"/>
 *     <qti-base-value base-type="identifier">{responseId}_{type}</qti-base-value>
 *   </qti-multiple>
 * </qti-set-outcome-value>
 */
function isStandardFeedbackSetter(setter: Element): boolean {
  // Must have qti-multiple child
  const multiple = setter.querySelector(':scope > qti-multiple');
  if (!multiple) {
    return false;
  }

  // Must have exactly 2 children: qti-variable and qti-base-value
  const children = Array.from(multiple.children);
  if (children.length !== 2) {
    return false;
  }

  // First child should be qti-variable referencing FEEDBACK (accumulation pattern)
  const variable = multiple.querySelector(':scope > qti-variable');
  if (!variable || variable.getAttribute('identifier') !== 'FEEDBACK') {
    return false;
  }

  // Second child should be qti-base-value with identifier base-type
  const baseValue = multiple.querySelector(':scope > qti-base-value');
  if (!baseValue) {
    return false;
  }

  const baseType = baseValue.getAttribute('base-type');
  if (baseType !== 'identifier') {
    return false;
  }

  // The identifier value should match our standard pattern
  const identifierValue = baseValue.textContent?.trim() || '';
  if (!isStandardFeedbackIdentifier(identifierValue)) {
    return false;
  }

  return true;
}
