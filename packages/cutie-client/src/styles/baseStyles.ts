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
    color: var(--cutie-text);
    background-color: var(--cutie-bg);
    line-height: 1.5;
  }

  .cutie-item-container img {
    max-width: 100%;
    height: auto;
  }
`;

export function registerBaseStyles(styleManager: StyleManager): void {
  styleManager.addStyle(BASE_STYLES_ID, BASE_STYLES);
  styleManager.addStyle(ERROR_DISPLAY_STYLES_ID, ERROR_DISPLAY_STYLES);
}
