/**
 * QTI namespace URI
 */
const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

/**
 * Generic XML node representation (JSON-serializable)
 * Used for storing response declarations and other metadata that doesn't
 * need to be edited as rich text in the Slate editor.
 */
export interface XmlNode {
  tagName: string;
  attributes: Record<string, string>;
  children: Array<XmlNode | string>; // XmlNode for elements, string for text
}

/**
 * Convert DOM Element to XmlNode (recursive)
 */
export function domToXmlNode(element: Element): XmlNode {
  const attributes: Record<string, string> = {};
  for (const attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }

  const children: Array<XmlNode | string> = [];
  for (const child of element.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(domToXmlNode(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text.trim()) {
        children.push(text);
      }
    }
  }

  return { tagName: element.tagName.toLowerCase(), attributes, children };
}

/**
 * Convert XmlNode back to DOM Element (recursive)
 */
export function xmlNodeToDom(node: XmlNode, doc: Document): Element {
  const element = doc.createElementNS(QTI_NAMESPACE, node.tagName);
  for (const [key, value] of Object.entries(node.attributes)) {
    element.setAttribute(key, value);
  }
  for (const child of node.children) {
    if (typeof child === 'string') {
      element.appendChild(doc.createTextNode(child));
    } else {
      element.appendChild(xmlNodeToDom(child, doc));
    }
  }
  return element;
}

/**
 * Helper to find child element by tag name
 */
export function findChild(node: XmlNode, tagName: string): XmlNode | undefined {
  return node.children.find(
    (c): c is XmlNode => typeof c !== 'string' && c.tagName === tagName
  );
}

/**
 * Helper to find all children by tag name
 */
export function findChildren(node: XmlNode, tagName: string): XmlNode[] {
  return node.children.filter(
    (c): c is XmlNode => typeof c !== 'string' && c.tagName === tagName
  );
}
