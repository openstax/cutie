import { parseQtiXml } from './parser/xmlParser';
import { renderToContainer } from './renderer/domRenderer';
import { ItemStateImpl } from './state/itemState';
import { registerBaseStyles } from './styles';
import { createTransformContext, transformChildren, transformNode } from './transformer/elementTransformer';
import { DefaultStyleManager } from './transformer/styleManager';
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

  // Create style manager and register base styles
  const styleManager = new DefaultStyleManager();
  registerBaseStyles(styleManager);

  // Parse QTI XML
  const parsed = parseQtiXml(itemTemplateXml);

  // Create transform context once for all transformations
  const context = createTransformContext({ itemState, styleManager });

  // Transform item body children
  const fragment = transformChildren(parsed.itemBody, context);

  // Transform modal feedback elements (the elements themselves, not just children)
  for (const modalFeedback of parsed.modalFeedbacks) {
    fragment.appendChild(transformNode(modalFeedback, context));
  }

  // Render to container
  const unmountDom = renderToContainer(container, fragment);

  // Return controller object
  return {
    unmount: () => {
      itemState.clear();
      styleManager.cleanup();
      unmountDom();
    },
    collectResponses: () => itemState.collectAll(),
    setInteractionsEnabled: (enabled: boolean) => itemState.setInteractionsEnabled(enabled),
    getResponseIdentifiers: () => itemState.getResponseIdentifiers(),
  };
}
