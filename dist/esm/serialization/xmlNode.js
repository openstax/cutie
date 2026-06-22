/**
 * QTI namespace URI
 */
const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';
/**
 * Convert DOM Element to XmlNode (recursive)
 */
export function domToXmlNode(element) {
    const attributes = {};
    for (const attr of element.attributes) {
        attributes[attr.name] = attr.value;
    }
    const children = [];
    for (const child of element.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            children.push(domToXmlNode(child));
        }
        else if (child.nodeType === Node.TEXT_NODE) {
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
export function xmlNodeToDom(node, doc) {
    const element = doc.createElementNS(QTI_NAMESPACE, node.tagName);
    for (const [key, value] of Object.entries(node.attributes)) {
        element.setAttribute(key, value);
    }
    for (const child of node.children) {
        if (typeof child === 'string') {
            element.appendChild(doc.createTextNode(child));
        }
        else {
            element.appendChild(xmlNodeToDom(child, doc));
        }
    }
    return element;
}
/**
 * Helper to find child element by tag name
 */
export function findChild(node, tagName) {
    return node.children.find((c) => typeof c !== 'string' && c.tagName === tagName);
}
/**
 * Helper to find all children by tag name
 */
export function findChildren(node, tagName) {
    return node.children.filter((c) => typeof c !== 'string' && c.tagName === tagName);
}
