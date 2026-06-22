export { InlineChoiceElement } from './Element';
export { InlineChoicePropertiesPanel } from './PropertiesPanel';
export { inlineChoiceInteractionConfig } from './config';
export { inlineChoiceParsers, inlineChoiceSerializers } from './serialization';
export { insertInlineChoiceInteraction } from './insertion';
import { InlineChoiceElement } from './Element';
import { InlineChoicePropertiesPanel } from './PropertiesPanel';
export declare const inlineChoiceRenderers: {
    'qti-inline-choice-interaction': typeof InlineChoiceElement;
};
export declare const inlineChoicePropertiesPanels: {
    'qti-inline-choice-interaction': typeof InlineChoicePropertiesPanel;
};
