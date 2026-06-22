export { SimpleChoiceElement } from './Element';
export { ChoiceIdLabel } from './ChoiceIdLabel';
export { ChoiceContent } from './ChoiceContent';
export { SimpleChoicePropertiesPanel } from './PropertiesPanel';
export { choiceContentConfig, choiceIdLabelConfig, simpleChoiceConfig, } from './config';
export { simpleChoiceParsers, simpleChoiceSerializers } from './serialization';
import { ChoiceContent } from './ChoiceContent';
import { ChoiceIdLabel } from './ChoiceIdLabel';
import { SimpleChoiceElement } from './Element';
import { SimpleChoicePropertiesPanel } from './PropertiesPanel';
export declare const simpleChoiceRenderers: {
    'qti-simple-choice': typeof SimpleChoiceElement;
    'choice-id-label': typeof ChoiceIdLabel;
    'choice-content': typeof ChoiceContent;
};
export declare const simpleChoicePropertiesPanels: {
    'qti-simple-choice': typeof SimpleChoicePropertiesPanel;
};
