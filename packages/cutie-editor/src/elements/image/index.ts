export { ImageElement } from './Element.js';
export { ImagePropertiesPanel } from './PropertiesPanel.js';
export { imageConfig } from './config.js';
export { insertImage } from './insertion.js';

import { ImageElement } from './Element.js';
import { ImagePropertiesPanel } from './PropertiesPanel.js';

export const imageRenderers = {
  image: ImageElement,
};

export const imagePropertiesPanels = {
  image: ImagePropertiesPanel,
};
