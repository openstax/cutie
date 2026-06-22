export { TextEntryElement } from './Element';
export { TextEntryPropertiesPanel } from './PropertiesPanel';
export { textEntryInteractionConfig } from './config';
export { textEntryParsers, textEntrySerializers } from './serialization';
export { insertTextEntryInteraction } from './insertion';
import { TextEntryElement } from './Element';
import { TextEntryPropertiesPanel } from './PropertiesPanel';
export declare const textEntryRenderers: {
    'qti-text-entry-interaction': typeof TextEntryElement;
};
export declare const textEntryPropertiesPanels: {
    'qti-text-entry-interaction': typeof TextEntryPropertiesPanel;
};
