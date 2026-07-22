import type { StyleManager } from '../transformer/types';

const SVG_NS = 'http://www.w3.org/2000/svg';

// SVG path from Material Symbols Outlined "error" based on
// https://raw.githubusercontent.com/google/material-design-icons/refs/heads/master/symbols/web/error/materialsymbolsoutlined/error_24px.svg
// 24-unit grid, inset by 0.75 per side to match the ink scale of the feedback icons
const WARNING_ICON_PATH =
  'M12.713 16.713C12.9043 16.521 13 16.2833 13 16C13 15.7167 12.904 15.4793 12.712 15.288C12.52 15.0967 12.2827 15.0007 12 15C11.7173 14.9993 11.48 15.0953 11.288 15.288C11.096 15.4807 11 15.718 11 16C11 16.282 11.096 16.5197 11.288 16.713C11.48 16.9063 11.7173 17.002 12 17C12.2827 16.998 12.5203 16.903 12.713 16.713ZM12.713 12.712C12.9043 12.5207 13 12.2833 13 12V8C13 7.71667 12.904 7.47933 12.712 7.288C12.52 7.09667 12.2827 7.00067 12 7C11.7173 6.99933 11.48 7.09533 11.288 7.288C11.096 7.48067 11 7.718 11 8V12C11 12.2833 11.096 12.521 11.288 12.713C11.48 12.905 11.7173 13.0007 12 13C12.2827 12.9993 12.5203 12.9033 12.713 12.712ZM12 22C10.6167 22 9.31667 21.7373 8.1 21.212C6.88334 20.6867 5.825 19.9743 4.925 19.075C4.025 18.1757 3.31267 17.1173 2.788 15.9C2.26333 14.6827 2.00067 13.3827 2 12C1.99933 10.6173 2.262 9.31733 2.788 8.1C3.314 6.88267 4.02633 5.82433 4.925 4.925C5.82367 4.02567 6.882 3.31333 8.1 2.788C9.318 2.26267 10.618 2 12 2C13.382 2 14.682 2.26267 15.9 2.788C17.118 3.31333 18.1763 4.02567 19.075 4.925C19.9737 5.82433 20.6863 6.88267 21.213 8.1C21.7397 9.31733 22.002 10.6173 22 12C21.998 13.3827 21.7353 14.6827 21.212 15.9C20.6887 17.1173 19.9763 18.1757 19.075 19.075C18.1737 19.9743 17.1153 20.687 15.9 21.213C14.6847 21.739 13.3847 22.0013 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z';

const CONSTRAINT_ERROR_CLASS = 'cutie-constraint-error';

const INLINE_REQUIRED_INDICATOR_STYLE_ID = 'cutie-inline-required-indicator';

const INLINE_REQUIRED_INDICATOR_STYLES = `
  .cutie-required-indicator {
    font-size: 1.15em;
    vertical-align: super;
    color: var(--cutie-text-muted);
    cursor: default;
  }

  .cutie-required-indicator.${CONSTRAINT_ERROR_CLASS} {
    color: var(--cutie-feedback-incorrect);
  }
`;

const VALIDATION_DISPLAY_STYLE_ID = 'cutie-validation-display';

const VALIDATION_DISPLAY_STYLES = `
  .cutie-constraint-text {
    display: flex;
    align-items: center;
    gap: 0.3em;
    font-size: 1em;
    color: var(--cutie-text-muted);
    margin-top: 0.5em;
  }

  .cutie-constraint-icon {
    visibility: hidden;
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    transform: translateY(0.05em);
  }

  /* Error state — icon provides non-color signal per WCAG 1.4.1 */
  .cutie-constraint-text.${CONSTRAINT_ERROR_CLASS} {
    color: var(--cutie-feedback-incorrect);
  }

  .cutie-constraint-text.${CONSTRAINT_ERROR_CLASS} .cutie-constraint-icon {
    visibility: visible;
  }

`;

/**
 * Create a constraint message element with a warning icon.
 * The icon is hidden by default and shown when the element has the error class.
 *
 * Registers shared validation display styles via the provided StyleManager (idempotent).
 *
 * @param id - Unique ID for the element (used for aria-describedby linking)
 * @param text - Informational constraint text (e.g., "Select at least 2 choices.")
 * @param styleManager - Optional style manager for registering shared styles
 */
export interface ConstraintMessage {
  element: HTMLElement;
  setError: (isError: boolean) => void;
  setText: (text: string) => void;
}

export function createConstraintMessage(
  id: string,
  text: string,
  styleManager?: StyleManager
): ConstraintMessage {
  if (styleManager && !styleManager.hasStyle(VALIDATION_DISPLAY_STYLE_ID)) {
    styleManager.addStyle(VALIDATION_DISPLAY_STYLE_ID, VALIDATION_DISPLAY_STYLES);
  }

  const container = document.createElement('div');
  container.className = 'cutie-constraint-text';
  container.id = id;
  // Not a live region — this text is read on focus via aria-describedby.
  // Announcing changes is handled explicitly by callers via announce(),
  // since aria-live doesn't reliably re-announce identical repeated text.

  // Warning icon — hidden by default, shown via CSS in error state
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cutie-constraint-icon');
  svg.setAttribute('viewBox', '0.75 0.75 22.5 22.5');
  svg.setAttribute('fill', 'currentColor');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', WARNING_ICON_PATH);
  svg.appendChild(path);
  container.appendChild(svg);

  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  container.appendChild(textSpan);

  const setError = (isError: boolean) => {
    if (isError) {
      container.classList.add(CONSTRAINT_ERROR_CLASS);
    } else {
      container.classList.remove(CONSTRAINT_ERROR_CLASS);
    }
  };

  const setText = (newText: string) => {
    textSpan.textContent = newText;
  };

  return { element: container, setError, setText };
}

/**
 * Create an inline required indicator for inline interactions (text entry, inline choice).
 * Renders a superscript asterisk placed as a sibling after the input/select element.
 *
 * @param id - Unique ID for the element (used for aria-describedby linking)
 * @param title - Tooltip text (e.g., "Selection required" or custom pattern message)
 * @param styleManager - Optional style manager for registering shared styles
 */
export function createInlineRequiredIndicator(
  id: string,
  title: string,
  styleManager?: StyleManager
): ConstraintMessage {
  if (styleManager && !styleManager.hasStyle(INLINE_REQUIRED_INDICATOR_STYLE_ID)) {
    styleManager.addStyle(INLINE_REQUIRED_INDICATOR_STYLE_ID, INLINE_REQUIRED_INDICATOR_STYLES);
  }

  const span = document.createElement('span');
  span.className = 'cutie-required-indicator';
  span.id = id;
  span.textContent = '*';
  // Not a live region — the label is read on focus via aria-describedby.
  // Announcing changes is handled explicitly by callers via announce().
  span.setAttribute('aria-label', title);
  span.title = title;

  const setError = (isError: boolean) => {
    if (isError) {
      span.classList.add(CONSTRAINT_ERROR_CLASS);
    } else {
      span.classList.remove(CONSTRAINT_ERROR_CLASS);
    }
  };

  const setText = (newText: string) => {
    span.title = newText;
    span.setAttribute('aria-label', newText);
  };

  return { element: span, setError, setText };
}
