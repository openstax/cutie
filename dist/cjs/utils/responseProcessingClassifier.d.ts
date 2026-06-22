import type { ResponseProcessingConfig, XmlNode } from '../types';
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
export declare function classifyResponseProcessing(doc: Document): ResponseProcessingConfig;
/**
 * Check if a response declaration has a mapping element
 */
export declare function hasMapping(responseDeclaration: XmlNode): boolean;
