import type { ElementConfig, ResponseProcessingConfig, XmlNode } from '../types';
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
export declare function generateResponseProcessingXml(config: ResponseProcessingConfig, responseIdentifiers: string[], responseDeclarations: Map<string, XmlNode>, outcomeDeclarations: Map<string, XmlNode>, doc: Document, feedbackIdentifiersUsed?: Set<string>, responseConfigs?: Map<string, ElementConfig>): Element | null;
/**
 * Create a qti-match element that compares a variable to its correct value
 */
export declare function createMatchElement(identifier: string, doc: Document): Element;
/**
 * Create a qti-equal element that checks if a mapped response equals a specific value.
 * Used for allCorrect correctness checks on mapped responses.
 *
 * <qti-equal>
 *   <qti-map-response identifier="ID"/>
 *   <qti-base-value base-type="float">{value}</qti-base-value>
 * </qti-equal>
 */
export declare function createMapResponseEqualElement(identifier: string, value: number, doc: Document): Element;
/**
 * Create a qti-gt element that checks if a mapped response score is greater than 0.
 * Used for feedback conditions on responses with mappings, so that feedback
 * uses the same case-insensitive matching as the scoring.
 */
export declare function createMapResponseGtZeroElement(identifier: string, doc: Document): Element;
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
export declare function createSetFeedbackElement(feedbackId: string, doc: Document): Element;
