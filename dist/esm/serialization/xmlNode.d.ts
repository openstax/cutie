/**
 * Generic XML node representation (JSON-serializable)
 * Used for storing response declarations and other metadata that doesn't
 * need to be edited as rich text in the Slate editor.
 */
export interface XmlNode {
    tagName: string;
    attributes: Record<string, string>;
    children: Array<XmlNode | string>;
}
/**
 * Convert DOM Element to XmlNode (recursive)
 */
export declare function domToXmlNode(element: Element): XmlNode;
/**
 * Convert XmlNode back to DOM Element (recursive)
 */
export declare function xmlNodeToDom(node: XmlNode, doc: Document): Element;
/**
 * Helper to find child element by tag name
 */
export declare function findChild(node: XmlNode, tagName: string): XmlNode | undefined;
/**
 * Helper to find all children by tag name
 */
export declare function findChildren(node: XmlNode, tagName: string): XmlNode[];
