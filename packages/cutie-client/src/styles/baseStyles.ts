import { ERROR_DISPLAY_STYLES } from '../errors/errorDisplay';
import type { StyleManager } from '../transformer/types';

const BASE_STYLES_ID = 'cutie-base-styles';
const ERROR_DISPLAY_STYLES_ID = 'cutie-error-display';

const BASE_STYLES = `
  .cutie-item-container {
    --cutie-text: #333;
    --cutie-text-muted: #666;
    --cutie-bg: #fff;
    --cutie-bg-alt: #f5f5f5;
    --cutie-border: #767676;
    --cutie-primary: #1976d2;
    --cutie-primary-fg: #fff;
    --cutie-primary-hover: #1e88e5;
    --cutie-feedback-correct: #22c55e;
    --cutie-feedback-incorrect: #d32f2f;
    --cutie-feedback-info: #4a90e2;
    --cutie-line-height: 1.5;
    color: var(--cutie-text);
    background-color: var(--cutie-bg);
    line-height: var(--cutie-line-height);
  }

  .cutie-item-container img {
    max-width: 100%;
    height: auto;
  }

  /*
   * QTI shared-vocabulary layout grid: qti-layout-row lays its columns out on
   * a 12-track grid; qti-layout-col-{1..12} sets a column's width and
   * qti-layout-offset-{1..11} shifts it right by that many tracks. Columns
   * collapse to full width on narrow screens.
   *
   * QTI Vocab §1.1.3 Layout: https://www.imsglobal.org/spec/qti/v3p0/vocab
   */
  .qti-layout-row {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5em;
    margin: 1em 0;
    align-items: start;
  }

  .qti-layout-col-1 { grid-column: span 1; }
  .qti-layout-col-2 { grid-column: span 2; }
  .qti-layout-col-3 { grid-column: span 3; }
  .qti-layout-col-4 { grid-column: span 4; }
  .qti-layout-col-5 { grid-column: span 5; }
  .qti-layout-col-6 { grid-column: span 6; }
  .qti-layout-col-7 { grid-column: span 7; }
  .qti-layout-col-8 { grid-column: span 8; }
  .qti-layout-col-9 { grid-column: span 9; }
  .qti-layout-col-10 { grid-column: span 10; }
  .qti-layout-col-11 { grid-column: span 11; }
  .qti-layout-col-12 { grid-column: span 12; }

  .qti-layout-offset-1 { grid-column-start: 2; }
  .qti-layout-offset-2 { grid-column-start: 3; }
  .qti-layout-offset-3 { grid-column-start: 4; }
  .qti-layout-offset-4 { grid-column-start: 5; }
  .qti-layout-offset-5 { grid-column-start: 6; }
  .qti-layout-offset-6 { grid-column-start: 7; }
  .qti-layout-offset-7 { grid-column-start: 8; }
  .qti-layout-offset-8 { grid-column-start: 9; }
  .qti-layout-offset-9 { grid-column-start: 10; }
  .qti-layout-offset-10 { grid-column-start: 11; }
  .qti-layout-offset-11 { grid-column-start: 12; }

  @media (max-width: 40em) {
    .qti-layout-row {
      grid-template-columns: 1fr;
    }

    /* Higher specificity than the col/offset rules, so columns stack full-width */
    .qti-layout-row > * {
      grid-column: 1 / -1;
    }
  }
`;

export function registerBaseStyles(styleManager: StyleManager): void {
  styleManager.addStyle(BASE_STYLES_ID, BASE_STYLES);
  styleManager.addStyle(ERROR_DISPLAY_STYLES_ID, ERROR_DISPLAY_STYLES);
}
