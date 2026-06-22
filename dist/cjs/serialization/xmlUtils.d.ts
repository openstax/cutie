/**
 * Create a new XML document with QTI namespace
 *
 * @returns XMLDocument with QTI namespace
 */
export declare function createXmlDocument(): XMLDocument;
/**
 * Create an XML element with proper QTI namespace
 *
 * @param doc - XML document
 * @param tagName - Element tag name
 * @returns Element with QTI namespace
 */
export declare function createXmlElement(doc: XMLDocument, tagName: string): Element;
/**
 * Parse HTML string to DOM
 *
 * @param html - HTML string
 * @returns Parsed DocumentFragment
 */
export declare function parseHtml(html: string): DocumentFragment;
/**
 * Serialize DOM element to string
 *
 * @param element - Element to serialize
 * @returns XML string
 */
export declare function serializeElement(element: Element): string;
/**
 * Parse XML string to DOM
 *
 * @param xml - XML string
 * @returns Parsed Document or DocumentFragment
 */
export declare function parseXml(xml: string): Document | null;
/**
 * Escape HTML special characters
 *
 * @param text - Text to escape
 * @returns Escaped text
 */
export declare function escapeHtml(text: string): string;
/**
 * Check if a tag name is a QTI element
 *
 * @param tagName - Tag name to check
 * @returns True if QTI element
 */
export declare function isQtiElement(tagName: string): boolean;
/**
 * Normalize tag name (lowercase, handle namespace prefixes)
 *
 * @param tagName - Tag name to normalize
 * @returns Normalized tag name
 */
export declare function normalizeTagName(tagName: string): string;
/**
 * Extract XHTML content from qti-item-body element
 *
 * @param qtiXml - Full QTI XML or just item body
 * @returns XHTML content from inside qti-item-body (not converted to HTML)
 */
export declare function extractItemBodyXml(qtiXml: string): string;
/**
 * Convert HTML content back to XHTML (HTML to XHTML)
 *
 * @param html - HTML content from TinyMCE
 * @returns XHTML string suitable for embedding in QTI XML
 */
export declare function htmlToXhtml(html: string): string;
