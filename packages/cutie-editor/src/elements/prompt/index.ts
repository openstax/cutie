export { PromptElement } from './Element';
export { promptParsers, promptSerializers } from './serialization';

import { PromptElement } from './Element';

export const promptRenderers = {
  'qti-prompt': PromptElement,
};
