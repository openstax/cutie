import type {
  ParagraphValidationAggregator,
  ParagraphValidationField,
  StyleManager,
} from '../transformer/types';

const SVG_NS = 'http://www.w3.org/2000/svg';

// SVG path from Material Symbols Outlined "warning"
// https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/warning/materialsymbolsoutlined/warning_24px.svg
const WARNING_ICON_PATH =
  'm40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z';

const CONSTRAINT_ERROR_CLASS = 'cutie-constraint-error';

/** Warning icon — hidden by default, shown via CSS in error state. */
function createWarningIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cutie-constraint-icon');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('fill', 'currentColor');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', WARNING_ICON_PATH);
  svg.appendChild(path);

  return svg;
}

const INLINE_REQUIRED_INDICATOR_STYLE_ID = 'cutie-inline-required-indicator';

const INLINE_REQUIRED_INDICATOR_STYLES = `
  .cutie-required-indicator {
    font-size: 0.75em;
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
    font-size: 0.85em;
    color: var(--cutie-text-muted);
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
  // Live region so this text (already linked via aria-describedby) is
  // announced when it changes, even if focus isn't on the described input —
  // e.g. validation run from a submit action elsewhere on the page.
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'true');

  container.appendChild(createWarningIcon());

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
  // Live region so the label is announced when it changes, even if focus
  // isn't on the associated input.
  span.setAttribute('aria-live', 'polite');
  span.setAttribute('aria-atomic', 'true');
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

const PARAGRAPH_VALIDATION_STYLE_ID = 'cutie-paragraph-validation';

const PARAGRAPH_VALIDATION_STYLES = `
  .cutie-paragraph-validation {
    margin-bottom: 0.5em;
  }

  .cutie-paragraph-validation-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }

  /* Each row is hidden until it is the currently-erroring field, so the
     summary only ever shows actual errors, not every possible constraint. */
  .cutie-paragraph-validation-item {
    display: none;
    align-items: center;
    gap: 0.3em;
    font-size: 0.85em;
    color: var(--cutie-feedback-incorrect);
  }

  .cutie-paragraph-validation-item.${CONSTRAINT_ERROR_CLASS} {
    display: flex;
  }
`;

/** Module-level counter for paragraph validation row IDs. */
let paragraphValidationRowCounter = 0;

/**
 * Create an aggregator that renders one consolidated validation message
 * block for all constrained inline interactions (text entry, inline choice)
 * within a single enclosing paragraph. Intended to be rendered as a
 * preceding sibling of that paragraph — see htmlPassthrough.ts.
 *
 * Each registered field gets its own always-present <li> (created once,
 * never removed) whose visibility is toggled via setError, so revealing an
 * error inside the live region is picked up by screen readers.
 *
 * @param styleManager - Optional style manager for registering shared styles
 */
export function createParagraphValidationAggregator(
  styleManager?: StyleManager
): ParagraphValidationAggregator {
  if (styleManager && !styleManager.hasStyle(PARAGRAPH_VALIDATION_STYLE_ID)) {
    styleManager.addStyle(PARAGRAPH_VALIDATION_STYLE_ID, PARAGRAPH_VALIDATION_STYLES);
  }

  let ordinalCounter = 0;
  let fieldCount = 0;

  const container = document.createElement('div');
  container.className = 'cutie-paragraph-validation';
  // Live region so newly-revealed rows are announced even if focus isn't on
  // the associated input (e.g. validation run from a submit action
  // elsewhere on the page). No aria-atomic, so fixing one field doesn't
  // cause every other still-invalid field's text to be re-announced.
  container.setAttribute('aria-live', 'polite');

  const list = document.createElement('ul');
  list.className = 'cutie-paragraph-validation-list';
  container.appendChild(list);

  return {
    nextOrdinal: () => ++ordinalCounter,
    registerField: (ordinal: number, message: string): ParagraphValidationField => {
      fieldCount++;
      const li = document.createElement('li');
      li.className = 'cutie-paragraph-validation-item';
      li.id = `cutie-paragraph-validation-row-${++paragraphValidationRowCounter}`;

      li.appendChild(createWarningIcon());

      const textSpan = document.createElement('span');
      textSpan.textContent = `Blank ${ordinal}: ${message}`;
      li.appendChild(textSpan);

      list.appendChild(li);

      return {
        id: li.id,
        setError: (isError: boolean) => {
          li.classList.toggle(CONSTRAINT_ERROR_CLASS, isError);
        },
      };
    },
    hasFields: () => fieldCount > 0,
    element: container,
  };
}
