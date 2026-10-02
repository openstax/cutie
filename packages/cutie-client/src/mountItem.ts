import { parseQtiXml } from './parser/xmlParser';
import { renderToContainer } from './renderer/domRenderer';
import { ItemStateImpl } from './state/itemState';
import { registerBaseStyles } from './styles';
import { applyThemeVars, removeThemeVars, type ThemeOptions } from './theme';
import { createTransformContext, transformChildren, transformNode } from './transformer/elementTransformer';
import { announceItemVerdict } from './transformer/handlers/evaluation';
import { beginFeedbackRender, endFeedbackRender } from './transformer/handlers/feedback/feedbackAnnouncer';
import { DefaultStyleManager } from './transformer/styleManager';
import type { ResponseData, TransformContext } from './transformer/types';
import { acquireLiveRegions, announce } from './utils/liveRegion';

/**
 * Options for a mounted QTI item: its theme (see ThemeOptions) and behavior.
 */
export interface MountItemOptions extends ThemeOptions {
  /**
   * Called after every learner edit, with the current value of every interaction —
   * whether or not the response is valid to submit.
   */
  onResponseChange?: (responses: ResponseData) => void;
  /**
   * Whether interactions start enabled (default `true`). Change it later with
   * `setInteractionsEnabled`; `update()` keeps the current setting.
   */
  interactionsEnabled?: boolean;
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
   * Collect all response data from registered interactions.
   * Returns undefined if any interaction has invalid responses.
   */
  collectResponses: () => ResponseData | undefined;

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

  // Unmount callbacks — for resources that persist across renders, called on unmount()
  const unmountCallbacks: Array<() => void> = [];

  // The shared live regions, held for as long as this item is mounted
  unmountCallbacks.push(acquireLiveRegions(state));

  // Mutable reference to current render's itemState and context
  let currentItemState: ItemStateImpl | null = null;
  let currentContext: TransformContext | null = null;

  // Current render's teardown — called on update() and unmount()
  let teardownCurrentRender: (() => void) | null = null;

  function doRender(xml: string): void {
    const itemState = new ItemStateImpl(currentItemState ?? undefined, {
      onResponseChange: options?.onResponseChange,
      interactionsEnabled: options?.interactionsEnabled,
    });
    currentItemState = itemState;

    const styleManager = new DefaultStyleManager();
    registerBaseStyles(styleManager);

    applyThemeVars(container, options);

    const mountCallbacks: Array<() => void> = [];
    // This render's cleanup callbacks — called when it is torn down (update() or unmount())
    const cleanupCallbacks: Array<() => void> = [];
    let unmountDom: (() => void) | null = null;

    // Set before anything can throw, so a render that fails part way is still torn down
    teardownCurrentRender = () => {
      for (const cb of cleanupCallbacks) cb();
      itemState.clear();
      styleManager.cleanup();
      unmountDom?.();
    };

    const parsed = parseQtiXml(xml);

    const context = createTransformContext({
      itemState,
      styleManager,
      onMount: (cb) => mountCallbacks.push(cb),
      onCleanup: (cb) => cleanupCallbacks.push(cb),
      onUnmount: (cb) => unmountCallbacks.push(cb),
      containerElement: container,
      state,
    });
    currentContext = context;

    // Announced before the feedback the render announces
    announceItemVerdict(parsed.itemBody, context);
    beginFeedbackRender(state);

    const fragment = transformChildren(parsed.itemBody, context);

    for (const modalFeedback of parsed.modalFeedbacks) {
      fragment.appendChild(transformNode(modalFeedback, context));
    }
    endFeedbackRender(state);

    unmountDom = renderToContainer(container, fragment);

    for (const cb of mountCallbacks) cb();
  }

  // Initial render. If it throws there is no handle to unmount with, so undo
  // everything the mount took (including its hold on the live regions) first
  try {
    doRender(itemTemplateXml);
  } catch (error) {
    // (doRender sets it; TypeScript can't see that from here)
    (teardownCurrentRender as (() => void) | null)?.();
    for (const cb of unmountCallbacks) cb();
    state.clear();
    removeThemeVars(container);
    throw error;
  }
  state.set('isUpdate', true);

  return {
    unmount: () => {
      teardownCurrentRender?.();
      teardownCurrentRender = null;
      currentItemState = null;
      currentContext = null;
      for (const cb of unmountCallbacks) cb();
      unmountCallbacks.length = 0;
      state.clear();
      removeThemeVars(container);
    },
    update: (xml: string) => {
      teardownCurrentRender?.();
      teardownCurrentRender = null;
      doRender(xml);
    },
    collectResponses: () => {
      const result = currentItemState?.collectAll();
      if (!result) return undefined;
      if (!result.valid && currentContext) {
        const plural = result.invalidCount === 1 ? 'problem' : 'problems';
        announce(currentContext, `${result.invalidCount} ${plural} with submission. Please review the highlighted fields.`, 'assertive');
        return undefined;
      }
      return result.valid ? result.responses : undefined;
    },
    setInteractionsEnabled: (enabled: boolean) => {
      currentItemState?.setInteractionsEnabled(enabled);
    },
    getResponseIdentifiers: () => currentItemState?.getResponseIdentifiers() ?? [],
  };
}
