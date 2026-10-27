export { PromptElement } from './Element.js';
export { promptConfig } from './config.js';
export { promptParsers, promptSerializers } from './serialization.js';

import { PromptElement } from './Element.js';

export const promptRenderers = {
  'qti-prompt': PromptElement,
};
