export { SimpleChoiceElement } from './Element';
export { ChoiceIdLabel } from './ChoiceIdLabel';
export { ChoiceContent } from './ChoiceContent';
export { simpleChoiceParsers, simpleChoiceSerializers } from './serialization';

import { ChoiceContent } from './ChoiceContent';
import { ChoiceIdLabel } from './ChoiceIdLabel';
import { SimpleChoiceElement } from './Element';

export const simpleChoiceRenderers = {
  'qti-simple-choice': SimpleChoiceElement,
  'choice-id-label': ChoiceIdLabel,
  'choice-content': ChoiceContent,
};
