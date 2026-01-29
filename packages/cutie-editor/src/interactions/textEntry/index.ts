// Re-export individual components for direct use if needed
export { TextEntryElement } from './Element';
export { TextEntryPropertiesPanel } from './PropertiesPanel';

// Re-export from other modules
export { textEntryInteractionConfig } from './config';
export { textEntryParsers, textEntrySerializers } from './serialization';
export { insertTextEntryInteraction } from './insertion';

// Import components for creating maps
import { TextEntryElement } from './Element';
import { TextEntryPropertiesPanel } from './PropertiesPanel';

// Export objects that can be spread (one per concern)
export const textEntryRenderers = {
  'qti-text-entry-interaction': TextEntryElement,
};

export const textEntryPropertiesPanels = {
  'qti-text-entry-interaction': TextEntryPropertiesPanel,
};
