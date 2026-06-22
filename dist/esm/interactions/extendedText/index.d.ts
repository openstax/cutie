export { ExtendedTextElement } from './Element';
export { ExtendedTextPropertiesPanel } from './PropertiesPanel';
export { extendedTextInteractionConfig } from './config';
export { extendedTextParsers, extendedTextSerializers } from './serialization';
export { insertExtendedTextInteraction } from './insertion';
import { ExtendedTextElement } from './Element';
import { ExtendedTextPropertiesPanel } from './PropertiesPanel';
export declare const extendedTextRenderers: {
    'qti-extended-text-interaction': typeof ExtendedTextElement;
};
export declare const extendedTextPropertiesPanels: {
    'qti-extended-text-interaction': typeof ExtendedTextPropertiesPanel;
};
