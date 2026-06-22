/**
 * Pretty-print an XML DOM tree by inserting whitespace text nodes for indentation.
 *
 * Block elements that contain only block children get their children indented.
 * Elements with mixed content (text + inline elements, like `<p>`) are left as-is.
 *
 * This mutates the DOM in place. Call before XMLSerializer.serializeToString().
 *
 * @param element - The root element to format
 * @param depth - Current indentation depth (default: 0)
 * @param indent - Indentation string per level (default: '  ')
 */
export declare function formatXmlDom(element: Element, depth?: number, indent?: string): void;
