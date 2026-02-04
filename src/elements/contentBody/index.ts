export { ContentBodyElement } from './Element';
export { contentBodyConfig } from './config';
export { contentBodyParsers, contentBodySerializers } from './serialization';

import { ContentBodyElement } from './Element';

export const contentBodyRenderers = {
  'qti-content-body': ContentBodyElement,
};
