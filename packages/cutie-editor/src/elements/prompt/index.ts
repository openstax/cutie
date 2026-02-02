export { PromptElement } from './Element';
export { promptConfig } from './config';
export { promptParsers, promptSerializers } from './serialization';

import { PromptElement } from './Element';

export const promptRenderers = {
  'qti-prompt': PromptElement,
};
