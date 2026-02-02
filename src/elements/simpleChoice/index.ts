export { SimpleChoiceElement } from './Element';
export { ChoiceIdLabel } from './ChoiceIdLabel';
export { ChoiceContent } from './ChoiceContent';
export { SimpleChoicePropertiesPanel } from './PropertiesPanel';
export {
  choiceContentConfig,
  choiceIdLabelConfig,
  simpleChoiceConfig,
} from './config';
export { simpleChoiceParsers, simpleChoiceSerializers } from './serialization';

import { ChoiceContent } from './ChoiceContent';
import { ChoiceIdLabel } from './ChoiceIdLabel';
import { SimpleChoiceElement } from './Element';
import { SimpleChoicePropertiesPanel } from './PropertiesPanel';

export const simpleChoiceRenderers = {
  'qti-simple-choice': SimpleChoiceElement,
  'choice-id-label': ChoiceIdLabel,
  'choice-content': ChoiceContent,
};

export const simpleChoicePropertiesPanels = {
  'qti-simple-choice': SimpleChoicePropertiesPanel,
};
