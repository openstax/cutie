import type { Descendant } from 'slate';
import type { ElementConfig, ResponseProcessingConfig, SerializationResult, ValidationError } from '../types';
import { type XmlNode } from './xmlNode';
/**
 * Internal result type that includes response declarations and processing config
 */
interface InternalSerializationResult extends SerializationResult {
    responseDeclarations: Map<string, XmlNode>;
    outcomeDeclarations: Map<string, XmlNode>;
    responseProcessingConfig?: ResponseProcessingConfig;
    feedbackIdentifiersUsed: Set<string>;
    /** Modal feedback elements to be inserted outside qti-item-body */
    modalFeedbackElements: Element[];
    /** Map of response identifier to its interaction's ElementConfig */
    responseConfigs: Map<string, ElementConfig>;
}
/**
 * Serialize Slate document to QTI XML
 *
 * @param nodes - Slate descendants
 * @returns Serialization result with XML string, identifiers, and errors
 */
export declare function serializeSlateToXml(nodes: Descendant[]): InternalSerializationResult;
/**
 * Serialization context for tracking state
 */
export interface SerializationContext {
    doc: XMLDocument;
    responseIdentifiers: string[];
    errors: ValidationError[];
    responseDeclarations: Map<string, XmlNode>;
    outcomeDeclarations: Map<string, XmlNode>;
    feedbackIdentifiersUsed: Set<string>;
    /** Container for modal feedback elements (serialized outside item-body) */
    modalFeedbackElements: Element[];
    /** Map of response identifier to its interaction's ElementConfig */
    responseConfigs: Map<string, ElementConfig>;
}
/**
 * Serialize Slate document back to full QTI XML document
 *
 * This function takes the original QTI XML and Slate nodes (representing item-body content),
 * and returns a complete QTI document with the item-body updated.
 *
 * @param nodes - Slate descendants representing the edited item-body content
 * @param originalQtiXml - Original full QTI XML document
 * @returns Serialization result with full QTI XML string, identifiers, and errors
 */
export declare function serializeSlateToQti(nodes: Descendant[], originalQtiXml: string): SerializationResult;
export {};
