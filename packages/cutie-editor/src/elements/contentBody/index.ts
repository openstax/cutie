export { ContentBodyElement } from './Element.js';
export { contentBodyConfig } from './config.js';
export { contentBodyParsers, contentBodySerializers } from './serialization.js';

import { ContentBodyElement } from './Element.js';

export const contentBodyRenderers = {
  'qti-content-body': ContentBodyElement,
};
