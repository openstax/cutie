import type { StyleManager } from '../transformer/types';

const BASE_STYLES_ID = 'qti-base-styles';

const BASE_STYLES = `
  .qti-item-container {
    --cutie-primary: #1976d2;
    --cutie-primary-fg: #fff;
    --cutie-primary-hover: #1e88e5;
    --cutie-border: #767676;
    --cutie-border-hover: #595959;
  }

  .qti-item-container img {
    max-width: 100%;
    height: auto;
  }
`;

export function registerBaseStyles(styleManager: StyleManager): void {
  styleManager.addStyle(BASE_STYLES_ID, BASE_STYLES);
}
