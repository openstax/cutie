export { ImageElement } from './Element';
export { ImagePropertiesPanel } from './PropertiesPanel';
export { imageConfig } from './config';

import { ImageElement } from './Element';
import { ImagePropertiesPanel } from './PropertiesPanel';

export const imageRenderers = {
  image: ImageElement,
};

export const imagePropertiesPanels = {
  image: ImagePropertiesPanel,
};
