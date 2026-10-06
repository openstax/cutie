export { SimpleChoiceElement } from './Element.js';
export { ChoiceIdLabel } from './ChoiceIdLabel.js';
export { ChoiceContent } from './ChoiceContent.js';
export { SimpleChoicePropertiesPanel } from './PropertiesPanel.js';
export {
  choiceContentConfig,
  choiceIdLabelConfig,
  simpleChoiceConfig,
} from './config.js';
export { simpleChoiceParsers, simpleChoiceSerializers } from './serialization.js';

import { ChoiceContent } from './ChoiceContent.js';
import { ChoiceIdLabel } from './ChoiceIdLabel.js';
import { SimpleChoiceElement } from './Element.js';
import { SimpleChoicePropertiesPanel } from './PropertiesPanel.js';

export const simpleChoiceRenderers = {
  'qti-simple-choice': SimpleChoiceElement,
  'choice-id-label': ChoiceIdLabel,
  'choice-content': ChoiceContent,
};

export const simpleChoicePropertiesPanels = {
  'qti-simple-choice': SimpleChoicePropertiesPanel,
};
