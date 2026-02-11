import { parseQtiXml } from './parser/xmlParser';
import { renderToContainer } from './renderer/domRenderer';
import { ItemStateImpl } from './state/itemState';
import { registerBaseStyles } from './styles';
import { createTransformContext, transformChildren, transformNode } from './transformer/elementTransformer';
import { DefaultStyleManager } from './transformer/styleManager';
import type { ResponseData } from './transformer/types';

/**
 * Theming options for a mounted QTI item.
 *
 * `primaryColor` is the main brand accent used for borders, outlines, focus
 * rings, and chip accent text. Interactive hover/selected states use neutral
 * greys — the primary color only appears in borders and outlines.
 *
 * `primaryFgColor` and `primaryHoverColor` are reserved for future button
 * components and are not currently referenced by interaction CSS.
 *
 * **Consumer contrast contract:**
 * 1. `primaryColor` must have >= 3:1 contrast against white (used as
 *    border / accent text on white backgrounds).
 * 2. `primaryFgColor` and `primaryHoverColor` are reserved for future use.
 */
export interface MountItemOptions {
  /** Brand accent color (default `#1976d2`). Focus outlines, borders, chip text. */
  primaryColor?: string;
  /** Text on primary backgrounds (default `#fff`). Reserved for future button components. */
  primaryFgColor?: string;
  /** Hover shade of primary (default `#1e88e5`). Reserved for future button components. */
  primaryHoverColor?: string;
}

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
  itemTemplateXml: string,
  options?: MountItemOptions
): MountedItem {
  // Persistent state bag — survives across update() calls, cleared on unmount()
  const state = new Map<string, unknown>();

  // Cleanup callbacks — accumulated across renders, all called on unmount()
  const cleanupCallbacks: Array<() => void> = [];

  // Mutable reference to current render's itemState
  let currentItemState: ItemStateImpl | null = null;

  // Current render's teardown — called on update() and unmount()
  let teardownCurrentRender: (() => void) | null = null;

  const CSS_VAR_MAP: Array<[keyof MountItemOptions, string]> = [
    ['primaryColor', '--cutie-primary'],
    ['primaryFgColor', '--cutie-primary-fg'],
    ['primaryHoverColor', '--cutie-primary-hover'],
  ];

  function applyThemeVars(): void {
    for (const [key, prop] of CSS_VAR_MAP) {
      const value = options?.[key];
      if (value) {
        container.style.setProperty(prop, value);
      }
    }
  }

  function removeThemeVars(): void {
    for (const [, prop] of CSS_VAR_MAP) {
      container.style.removeProperty(prop);
    }
  }

  function doRender(xml: string): void {
    const itemState = new ItemStateImpl(currentItemState ?? undefined);
    currentItemState = itemState;

    const styleManager = new DefaultStyleManager();
    registerBaseStyles(styleManager);

    applyThemeVars();

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
      removeThemeVars();
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
