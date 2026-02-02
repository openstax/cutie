export { ImageElement } from './Element';
export { ImagePropertiesPanel } from './PropertiesPanel';
export { imageConfig } from './config';
export { insertImage } from './insertion';

import { ImageElement } from './Element';
import { ImagePropertiesPanel } from './PropertiesPanel';

export const imageRenderers = {
  image: ImageElement,
};

export const imagePropertiesPanels = {
  image: ImagePropertiesPanel,
};
