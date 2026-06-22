import type { Descendant } from 'slate';
import { type XmlNode } from './xmlNode';
/**
 * Parser context for passing response declarations to interaction parsers
 */
export interface ParserContext {
    responseDeclarations: Map<string, XmlNode>;
}
/**
 * Function type for converting child nodes to Slate descendants
 */
export type ConvertChildrenFn = (nodes: Node[]) => Descendant[];
/**
 * Parse QTI XML to Slate document structure
 *
 * @param xml - Full QTI XML document (qti-assessment-item)
 * @returns Array of Slate descendants representing qti-item-body content
 *          with a document-metadata node at position [0]
 */
export declare function parseXmlToSlate(xml: string): Descendant[];
/**
 * Block elements for fallback whitespace handling.
 * Includes XHTML block elements and qti-item-body (container without a dedicated parser).
 * Other QTI elements are NOT included - their parsers handle whitespace directly.
 */
export declare const BLOCK_ELEMENTS_FOR_WHITESPACE: string[];
/**
 * Strip structural whitespace from Slate nodes.
 * Use this in element parsers whose children are structural (not flow content).
 */
export declare function stripStructuralWhitespace(nodes: Descendant[]): Descendant[];
