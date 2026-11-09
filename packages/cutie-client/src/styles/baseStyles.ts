// spell-checker: ignore fullwidth
import { ERROR_DISPLAY_STYLES } from '../errors/errorDisplay.js';
import type { StyleManager } from '../transformer/types.js';
import { CONTENT_CONTAINER } from './breakpoints.js';

const BASE_STYLES_ID = 'cutie-base-styles';
const ERROR_DISPLAY_STYLES_ID = 'cutie-error-display';

/* QTI layout rows: 12 tracks, sized in rem so breakpoints are plain numbers */
const LAYOUT_COLUMNS = 12;
const LAYOUT_GAP_REM = 1;
/** A row stacks when any of its columns would be narrower than this */
const LAYOUT_COLUMN_MIN_WIDTH_REM = 28;

/**
 * A row stacks to one column once any of its columns would be too narrow. A
 * column spanning `span` tracks reaches the minimum at a row width of
 * `(12 / span) * (min + gap) - gap`. The row and its columns query their
 * nearest content container, the row's parent, which is the row's width.
 */
const LAYOUT_STACKING = Array.from({ length: LAYOUT_COLUMNS }, (_, i) => {
  const span = i + 1;
  const width = (LAYOUT_COLUMNS / span) * (LAYOUT_COLUMN_MIN_WIDTH_REM + LAYOUT_GAP_REM) - LAYOUT_GAP_REM;
  const row = `.qti-layout-row:has(> .qti-layout-col${span})`;
  return `
  @container ${CONTENT_CONTAINER} (width < ${Number(width.toFixed(3))}rem) {
    ${row} { grid-template-columns: 1fr; }
    ${row} > * { grid-column: 1 / -1; }
  }`;
}).join('\n');

const BASE_STYLES = `
  /*
   * The item is a query container, so content responds to the space the host
   * gives it rather than the viewport. The host element must get its width
   * from its parent: inline-size containment ignores the content's width.
   */
  .cutie-item-container {
    container: ${CONTENT_CONTAINER} / inline-size;
  }

  .cutie-item-container {
    --cutie-text: #333;
    --cutie-text-muted: #666;
    --cutie-bg: #fff;
    --cutie-bg-alt: #f5f5f5;
    --cutie-border: #767676;
    --cutie-primary: #1976d2;
    --cutie-primary-fg: #fff;
    --cutie-primary-hover: #1e88e5;
    --cutie-feedback-correct: #0d7741;
    --cutie-feedback-incorrect: #d32f2f;
    --cutie-feedback-info: #4a90e2;
    --cutie-line-height: 1.5;
    /* Size of supporting text around interactions: errors, validation messages, counters */
    --cutie-supporting-text-size: 0.85em;
    /* Width of the colored leading border that marks feedback */
    --cutie-feedback-rail-width: 0.5em;
    /*
     * Room reserved above an answer option (a choice's text, a gap) for its
     * correct-answer overline, so showing the overline shifts nothing.
     * Clearance from the line above, the overline's line box (see
     * .cutie-correct-answer-overline--value), and a gap above the option.
     */
    --cutie-overline-clearance: 0.5em;
    --cutie-overline-slot: calc(var(--cutie-overline-clearance) + 0.875em * 1.5 + 0.25em);
    /* Keyboard focus indicator, shared by every focusable control */
    --cutie-focus-ring: 3px solid var(--cutie-primary);
    --cutie-focus-ring-offset: 2px;
    color: var(--cutie-text);
    background-color: var(--cutie-bg);
    line-height: var(--cutie-line-height);
  }

  .cutie-item-container img {
    max-width: 100%;
    height: auto;
  }

  .cutie-item-container table {
    border-collapse: collapse;
    margin: 0.75rem 0;
  }

  .cutie-item-container caption {
    text-align: left;
    font-weight: 600;
    padding: 0.5rem 0;
  }

  .cutie-item-container th,
  .cutie-item-container td {
    border: 1px solid var(--cutie-border);
    padding: 0.5rem 0.75rem;
    text-align: left;
    vertical-align: top;
  }

  .cutie-item-container thead th {
    background-color: var(--cutie-bg-alt);
  }
  
  /*
   * QTI Vocab §1.1.3 Layout: https://www.imsglobal.org/spec/qti/v3p0/vocab
   */
  .qti-layout-row {
    display: grid;
    grid-template-columns: repeat(${LAYOUT_COLUMNS}, 1fr);
    gap: ${LAYOUT_GAP_REM}rem;
    margin: 1em 0;
    align-items: start;
  }

  .qti-layout-col1 { grid-column: span 1; }
  .qti-layout-col2 { grid-column: span 2; }
  .qti-layout-col3 { grid-column: span 3; }
  .qti-layout-col4 { grid-column: span 4; }
  .qti-layout-col5 { grid-column: span 5; }
  .qti-layout-col6 { grid-column: span 6; }
  .qti-layout-col7 { grid-column: span 7; }
  .qti-layout-col8 { grid-column: span 8; }
  .qti-layout-col9 { grid-column: span 9; }
  .qti-layout-col10 { grid-column: span 10; }
  .qti-layout-col11 { grid-column: span 11; }
  .qti-layout-col12 { grid-column: span 12; }

  /* Content in a column responds to the column's width (see .cutie-item-container) */
  .qti-layout-row > [class*="qti-layout-col"] {
    container: ${CONTENT_CONTAINER} / inline-size;
  }

${LAYOUT_STACKING}

  /*
   * QTI Vocab §1.1.4.3 Full Width: https://www.imsglobal.org/spec/qti/v3p0/vocab
   */
  .qti-fullwidth { width: 100%; }
`;

export function registerBaseStyles(styleManager: StyleManager): void {
  styleManager.addStyle(BASE_STYLES_ID, BASE_STYLES);
  styleManager.addStyle(ERROR_DISPLAY_STYLES_ID, ERROR_DISPLAY_STYLES);
}
