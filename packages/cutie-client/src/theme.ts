/**
 * Theming shared by everything cutie-client mounts.
 */

/**
 * Theming options for mounted QTI content (an item or a stimulus).
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
 * | `feedbackCorrectColor` | Icons, borders, correct-answer text | 4.5:1 (AA) | `bgColor`, `bgAltColor` |
 * | `feedbackIncorrectColor` | Icons, borders, error text | 4.5:1 (AA) | `bgColor`, `bgAltColor` |
 * | `feedbackInfoColor` | Icons, borders | 3:1 (1.4.11) | `bgColor` |
 */
export interface ThemeOptions {
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
  /** Correct feedback icon, border, and correct-answer text color (default `#0d7741`). Must meet 4.5:1 against `bgColor` and `bgAltColor`. */
  feedbackCorrectColor?: string;
  /** Incorrect/error icon, border, and text color (default `#d32f2f`). Must meet 4.5:1 against `bgColor` and `bgAltColor`. */
  feedbackIncorrectColor?: string;
  /** Info feedback icon and border color (default `#4a90e2`). Must meet 3:1 against `bgColor`. */
  feedbackInfoColor?: string;
}

const CSS_VAR_MAP: Array<[keyof ThemeOptions, string]> = [
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

/**
 * Sets the theme's CSS custom properties on the container
 */
export function applyThemeVars(container: HTMLElement, options?: ThemeOptions): void {
  for (const [key, prop] of CSS_VAR_MAP) {
    const value = options?.[key];
    if (value) {
      container.style.setProperty(prop, value);
    }
  }
}

/**
 * Removes the theme's CSS custom properties from the container
 */
export function removeThemeVars(container: HTMLElement): void {
  for (const [, prop] of CSS_VAR_MAP) {
    container.style.removeProperty(prop);
  }
}
