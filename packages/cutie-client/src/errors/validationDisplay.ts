import type { StyleManager } from '../transformer/types';

const SVG_NS = 'http://www.w3.org/2000/svg';

// SVG path from Material Symbols Outlined "warning"
// https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/warning/materialsymbolsoutlined/warning_24px.svg
const WARNING_ICON_PATH =
  'm40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z';

const CONSTRAINT_ERROR_CLASS = 'cutie-constraint-error';

const INLINE_REQUIRED_INDICATOR_STYLE_ID = 'cutie-inline-required-indicator';

const INLINE_REQUIRED_INDICATOR_STYLES = `
  .cutie-required-indicator {
    font-size: 0.75em;
    vertical-align: super;
    color: #666;
    cursor: default;
  }

  .cutie-required-indicator.${CONSTRAINT_ERROR_CLASS} {
    color: #d32f2f;
  }
`;

const VALIDATION_DISPLAY_STYLE_ID = 'cutie-validation-display';

const VALIDATION_DISPLAY_STYLES = `
  .cutie-constraint-text {
    display: flex;
    align-items: center;
    gap: 0.3em;
    font-size: 0.85em;
    color: #666;
    margin-top: 0.5em;
  }

  .cutie-constraint-icon {
    visibility: hidden;
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }

  /* Error state — icon provides non-color signal per WCAG 1.4.1 */
  .cutie-constraint-text.${CONSTRAINT_ERROR_CLASS} {
    color: #d32f2f;
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
  container.setAttribute('aria-hidden', 'true');

  // Warning icon — hidden by default, shown via CSS in error state
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cutie-constraint-icon');
  svg.setAttribute('viewBox', '0 -960 960 960');
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

  return { element: container, setError };
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
  span.setAttribute('aria-hidden', 'true');
  span.title = title;

  const setError = (isError: boolean) => {
    if (isError) {
      span.classList.add(CONSTRAINT_ERROR_CLASS);
    } else {
      span.classList.remove(CONSTRAINT_ERROR_CLASS);
    }
  };

  return { element: span, setError };
}
