/**
 * QTI namespace URI
 */
const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

/**
 * Create a new XML document with QTI namespace
 *
 * @returns XMLDocument with QTI namespace
 */
export function createXmlDocument(): XMLDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<qti-item-body xmlns="${QTI_NAMESPACE}"></qti-item-body>`,
    'application/xml'
  );
  return doc;
}

/**
 * Create an XML element with proper QTI namespace
 *
 * @param doc - XML document
 * @param tagName - Element tag name
 * @returns Element with QTI namespace
 */
export function createXmlElement(doc: XMLDocument, tagName: string): Element {
  return doc.createElementNS(QTI_NAMESPACE, tagName);
}

/**
 * Parse HTML string to DOM
 *
 * @param html - HTML string
 * @returns Parsed DocumentFragment
 */
export function parseHtml(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

/**
 * Serialize DOM element to string
 *
 * @param element - Element to serialize
 * @returns XML string
 */
export function serializeElement(element: Element): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(element);
}

/**
 * Parse XML string to DOM
 *
 * @param xml - XML string
 * @returns Parsed Document or DocumentFragment
 */
export function parseXml(xml: string): Document | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml.trim(), 'application/xml');

  // Check for parsing errors
  // spell-checker: disable-next-line
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    console.error('XML parsing error:', parserError.textContent);
    return null;
  }

  return doc;
}

/**
 * Escape HTML special characters
 *
 * @param text - Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check if a tag name is a QTI element
 *
 * @param tagName - Tag name to check
 * @returns True if QTI element
 */
export function isQtiElement(tagName: string): boolean {
  return tagName.toLowerCase().startsWith('qti-');
}

/**
 * Normalize tag name (lowercase, handle namespace prefixes)
 *
 * @param tagName - Tag name to normalize
 * @returns Normalized tag name
 */
export function normalizeTagName(tagName: string): string {
  // Remove namespace prefix if present
  const parts = tagName.split(':');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Extract XHTML content from qti-item-body element
 *
 * @param qtiXml - Full QTI XML or just item body
 * @returns XHTML content from inside qti-item-body (not converted to HTML)
 */
export function extractItemBodyXml(qtiXml: string): string {
  const doc = parseXml(qtiXml);
  if (!doc) {
    throw new Error('Failed to parse QTI XML');
  }

  // Find qti-item-body element
  const itemBody = doc.querySelector('qti-item-body');
  if (!itemBody) {
    // Maybe it's already just the body content
    return qtiXml;
  }

  // Serialize children as XHTML using XMLSerializer
  const serializer = new XMLSerializer();
  let xhtml = '';
  for (const child of Array.from(itemBody.childNodes)) {
    xhtml += serializer.serializeToString(child);
  }

  return xhtml;
}

/**
 * Convert HTML content back to XHTML (HTML to XHTML)
 *
 * @param html - HTML content from TinyMCE
 * @returns XHTML string suitable for embedding in QTI XML
 */
export function htmlToXhtml(html: string): string {
  // Parse as HTML
  const htmlDoc = document.implementation.createHTMLDocument('');
  const container = htmlDoc.createElement('div');
  container.innerHTML = html;

  // Create XML document and import HTML nodes into XML context
  const xmlDoc = createXmlDocument();
  const xmlContainer = createXmlElement(xmlDoc, 'div');

  for (const child of Array.from(container.childNodes)) {
    // Import node from HTML document to XML context
    const imported = xmlDoc.importNode(child, true);
    xmlContainer.appendChild(imported);
  }

  // Serialize as XML (which will use XHTML rules like self-closing tags)
  const serializer = new XMLSerializer();
  let xhtml = '';
  for (const child of Array.from(xmlContainer.childNodes)) {
    xhtml += serializer.serializeToString(child);
  }

  return xhtml;
}
