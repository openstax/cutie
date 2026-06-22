export { ChoiceElement } from './Element';
export { ChoicePropertiesPanel } from './PropertiesPanel';
export { choiceInteractionConfig } from './config';
export { choiceParsers, choiceSerializers } from './serialization';
export { insertChoiceInteraction } from './insertion';
import { ChoiceElement } from './Element';
import { ChoicePropertiesPanel } from './PropertiesPanel';
export declare const choiceRenderers: {
    'qti-choice-interaction': typeof ChoiceElement;
};
export declare const choicePropertiesPanels: {
    'qti-choice-interaction': typeof ChoicePropertiesPanel;
};
