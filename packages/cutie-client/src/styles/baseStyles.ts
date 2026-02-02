import type { StyleManager } from '../transformer/types';

const BASE_STYLES_ID = 'qti-base-styles';

const BASE_STYLES = `
  .qti-item-container img {
    max-width: 100%;
    height: auto;
  }
`;

export function registerBaseStyles(styleManager: StyleManager): void {
  styleManager.addStyle(BASE_STYLES_ID, BASE_STYLES);
}
