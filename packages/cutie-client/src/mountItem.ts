import { parseQtiXml } from './parser/xmlParser';
import { renderToContainer } from './renderer/domRenderer';
import { ItemStateImpl } from './state/itemState';
import { registerBaseStyles } from './styles';
import { createTransformContext, transformChildren, transformNode } from './transformer/elementTransformer';
import { DefaultStyleManager } from './transformer/styleManager';
import type { ResponseData, TransformContext } from './transformer/types';
import { announce } from './utils/liveRegion';

/**
 * Theming options for a mounted QTI item.
 *
 * All colors are exposed as CSS custom properties on `.cutie-item-container`
 * so consumers can override them for branding or dark mode.
 *
 * **Consumer contrast contract (WCAG 2.1 AA):**
 *
 * | Variable | Used as | Min contrast | Against |
 * |---|---|---|---|
 * | `textColor` | Body text | 4.5:1 (AA) | `bgColor`, `bgAltColor` |
 * | `textMutedColor` | Secondary text | 4.5:1 (AA) | `bgColor` |
 * | `borderColor` | Non-text UI | 3:1 (1.4.11) | `bgColor`, `bgAltColor` |
 * | `primaryColor` | Non-text UI + accent text | 3:1 (1.4.11) | `bgColor` |
 * | `feedbackCorrectColor` | Icons, borders | 3:1 (1.4.11) | `bgColor` |
 * | `feedbackIncorrectColor` | Icons, borders, error text | 4.5:1 (AA) | `bgColor`, `bgAltColor` |
 * | `feedbackInfoColor` | Icons, borders | 3:1 (1.4.11) | `bgColor` |
 */
export interface MountItemOptions {
  /** Primary content text (default `#333`). Must meet 4.5:1 against `bgColor` and `bgAltColor`. */
  textColor?: string;
  /** Secondary/hint text, labels (default `#666`). Must meet 4.5:1 against `bgColor`. */
  textMutedColor?: string;
  /** Default surface color (default `#fff`). */
  bgColor?: string;
  /** Secondary surfaces, hover, disabled, containers (default `#f5f5f5`). */
  bgAltColor?: string;
  /** Form control border color (default `#767676`). Must meet 3:1 against `bgColor` and `bgAltColor`. */
  borderColor?: string;
  /** Brand accent color (default `#1976d2`). Must meet 3:1 against `bgColor`. */
  primaryColor?: string;
  /** Text on primary backgrounds (default `#fff`). */
  primaryFgColor?: string;
  /** Hover shade of primary (default `#1e88e5`). */
  primaryHoverColor?: string;
  /** Correct feedback icon and border color (default `#22c55e`). Must meet 3:1 against `bgColor`. */
  feedbackCorrectColor?: string;
  /** Incorrect/error icon, border, and text color (default `#d32f2f`). Must meet 4.5:1 against `bgColor` and `bgAltColor`. */
  feedbackIncorrectColor?: string;
  /** Info feedback icon and border color (default `#4a90e2`). Must meet 3:1 against `bgColor`. */
  feedbackInfoColor?: string;
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

  // Cleanup callbacks — accumulated across renders, all called on unmount()
  const cleanupCallbacks: Array<() => void> = [];

  // Mutable reference to current render's itemState and context
  let currentItemState: ItemStateImpl | null = null;
  let currentContext: TransformContext | null = null;

  // Current render's teardown — called on update() and unmount()
  let teardownCurrentRender: (() => void) | null = null;

  const CSS_VAR_MAP: Array<[keyof MountItemOptions, string]> = [
    ['textColor', '--cutie-text'],
    ['textMutedColor', '--cutie-text-muted'],
    ['bgColor', '--cutie-bg'],
    ['bgAltColor', '--cutie-bg-alt'],
    ['borderColor', '--cutie-border'],
    ['primaryColor', '--cutie-primary'],
    ['primaryFgColor', '--cutie-primary-fg'],
    ['primaryHoverColor', '--cutie-primary-hover'],
    ['feedbackCorrectColor', '--cutie-feedback-correct'],
    ['feedbackIncorrectColor', '--cutie-feedback-incorrect'],
    ['feedbackInfoColor', '--cutie-feedback-info'],
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
    currentContext = context;

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
      currentContext = null;
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
