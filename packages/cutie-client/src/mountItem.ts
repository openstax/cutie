import { parseQtiXml } from './parser/xmlParser';
import { renderToContainer } from './renderer/domRenderer';
import { transformElement } from './transformer/elementTransformer';

/**
 * Mount a QTI item into a DOM container
 *
 * @param container - The HTML element to render into
 * @param itemTemplateXml - The sanitized QTI XML string from cutie-core
 * @returns Cleanup function to unmount the item
 */
export function mountItem(
  container: HTMLElement,
  itemTemplateXml: string
): () => void {
  // Parse QTI XML
  const parsed = parseQtiXml(itemTemplateXml);

  // Transform to DocumentFragment
  const fragment = transformElement(parsed.itemBody);

  // Render to container and return cleanup function
  return renderToContainer(container, fragment);
}
