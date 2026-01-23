import { parseQtiXml } from './parser/xmlParser';
import { renderToContainer } from './renderer/domRenderer';
import { ItemStateImpl } from './state/itemState';
import { transformElement } from './transformer/elementTransformer';
import type { ResponseData } from './transformer/types';

/**
 * Controller object for a mounted QTI item
 */
export interface MountedItem {
  /**
   * Unmount the item and clean up resources
   */
  unmount: () => void;

  /**
   * Collect all response data from registered interactions
   */
  collectResponses: () => ResponseData;

  /**
   * Enable or disable all interactions
   */
  setInteractionsEnabled: (enabled: boolean) => void;

  /**
   * Get all registered response identifiers
   */
  getResponseIdentifiers: () => string[];
}

/**
 * Mount a QTI item into a DOM container
 *
 * @param container - The HTML element to render into
 * @param itemTemplateXml - The sanitized QTI XML string from cutie-core
 * @returns Controller object for managing the mounted item
 */
export function mountItem(
  container: HTMLElement,
  itemTemplateXml: string
): MountedItem {
  // Create item state manager
  const itemState = new ItemStateImpl();

  // Parse QTI XML
  const parsed = parseQtiXml(itemTemplateXml);

  // Transform to DocumentFragment with itemState in context
  const fragment = transformElement(parsed.itemBody, { itemState });

  // Render to container
  const unmountDom = renderToContainer(container, fragment);

  // Return controller object
  return {
    unmount: () => {
      itemState.clear();
      unmountDom();
    },
    collectResponses: () => itemState.collectAll(),
    setInteractionsEnabled: (enabled: boolean) => itemState.setInteractionsEnabled(enabled),
    getResponseIdentifiers: () => itemState.getResponseIdentifiers(),
  };
}
