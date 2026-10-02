import { parseQtiStimulusXml } from './parser/xmlParser';
import { renderToContainer } from './renderer/domRenderer';
import { registerBaseStyles } from './styles';
import { applyThemeVars, removeThemeVars, type ThemeOptions } from './theme';
import { createTransformContext, transformChildren } from './transformer/elementTransformer';
import { DefaultStyleManager } from './transformer/styleManager';

/**
 * Options for a mounted QTI stimulus: its theme (see ThemeOptions).
 */
export type MountStimulusOptions = ThemeOptions;

/**
 * Controller object for a mounted QTI stimulus
 */
export interface MountedStimulus {
  /**
   * Unmount the stimulus and clean up resources
   */
  unmount: () => void;

  /**
   * Re-render the stimulus with new stimulus XML, preserving persistent state
   */
  update: (stimulusXml: string) => void;
}

/**
 * Mount a shared QTI stimulus into a DOM container: one the delivery system
 * places itself, outside the items that reference it. A stimulus an item docks
 * in its body arrives inlined in the item's template, and renders with the item.
 *
 * @param container - The HTML element to render into
 * @param stimulusXml - The sanitized QTI stimulus XML string from cutie-core's renderStimulus
 * @returns Controller object for managing the mounted stimulus
 */
export function mountStimulus(
  container: HTMLElement,
  stimulusXml: string,
  options?: MountStimulusOptions
): MountedStimulus {
  // Persistent state bag — survives across update() calls, cleared on unmount()
  const state = new Map<string, unknown>();

  // Unmount callbacks — for resources that persist across renders, called on unmount()
  const unmountCallbacks: Array<() => void> = [];

  // Current render's teardown — called on update() and unmount()
  let teardownCurrentRender: (() => void) | null = null;

  function doRender(xml: string): void {
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
      styleManager.cleanup();
      unmountDom?.();
    };

    const parsed = parseQtiStimulusXml(xml);

    const context = createTransformContext({
      styleManager,
      onMount: (cb) => mountCallbacks.push(cb),
      onCleanup: (cb) => cleanupCallbacks.push(cb),
      onUnmount: (cb) => unmountCallbacks.push(cb),
      containerElement: container,
      state,
    });

    const fragment = transformChildren(parsed.stimulusBody, context);

    unmountDom = renderToContainer(container, fragment);

    for (const cb of mountCallbacks) cb();
  }

  // Initial render. If it throws there is no handle to unmount with, so undo
  // everything the mount took first
  try {
    doRender(stimulusXml);
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
  };
}
