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
   * Re-render the item with new template XML, preserving persistent state
   */
  update: (itemTemplateXml: string) => void;

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
  // Persistent state bag — survives across update() calls, cleared on unmount()
  const state = new Map<string, unknown>();

  // Cleanup callbacks — accumulated across renders, all called on unmount()
  const cleanupCallbacks: Array<() => void> = [];

  // Mutable reference to current render's itemState
  let currentItemState: ItemStateImpl | null = null;

  // Current render's teardown — called on update() and unmount()
  let teardownCurrentRender: (() => void) | null = null;

  function doRender(xml: string): void {
    const itemState = new ItemStateImpl();
    currentItemState = itemState;

    const styleManager = new DefaultStyleManager();
    registerBaseStyles(styleManager);

    const mountCallbacks: Array<() => void> = [];

    const parsed = parseQtiXml(xml);

    const context = createTransformContext({
      itemState,
      styleManager,
      onMount: (cb) => mountCallbacks.push(cb),
      onCleanup: (cb) => cleanupCallbacks.push(cb),
      containerElement: container,
      state,
    });

    const fragment = transformChildren(parsed.itemBody, context);

    for (const modalFeedback of parsed.modalFeedbacks) {
      fragment.appendChild(transformNode(modalFeedback, context));
    }

    const unmountDom = renderToContainer(container, fragment);

    for (const cb of mountCallbacks) cb();

    teardownCurrentRender = () => {
      itemState.clear();
      styleManager.cleanup();
      unmountDom();
    };
  }

  // Initial render
  doRender(itemTemplateXml);
  state.set('isUpdate', true);

  return {
    unmount: () => {
      teardownCurrentRender?.();
      teardownCurrentRender = null;
      currentItemState = null;
      for (const cb of cleanupCallbacks) cb();
      cleanupCallbacks.length = 0;
      state.clear();
    },
    update: (xml: string) => {
      teardownCurrentRender?.();
      teardownCurrentRender = null;
      doRender(xml);
    },
    collectResponses: () => currentItemState?.collectAll() ?? {},
    setInteractionsEnabled: (enabled: boolean) => {
      currentItemState?.setInteractionsEnabled(enabled);
    },
    getResponseIdentifiers: () => currentItemState?.getResponseIdentifiers() ?? [],
  };
}
