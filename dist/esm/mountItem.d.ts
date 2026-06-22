import type { ResponseData } from './transformer/types';
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
export declare function mountItem(container: HTMLElement, itemTemplateXml: string, options?: MountItemOptions): MountedItem;
