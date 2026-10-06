// Re-export individual components for direct use if needed
export { TextEntryElement } from './Element.js';
export { TextEntryPropertiesPanel } from './PropertiesPanel.js';

// Re-export from other modules
export { textEntryInteractionConfig } from './config.js';
export { textEntryParsers, textEntrySerializers } from './serialization.js';
export { insertTextEntryInteraction } from './insertion.js';

// Import components for creating maps
import { TextEntryElement } from './Element.js';
import { TextEntryPropertiesPanel } from './PropertiesPanel.js';

// Export objects that can be spread (one per concern)
export const textEntryRenderers = {
  'qti-text-entry-interaction': TextEntryElement,
};

export const textEntryPropertiesPanels = {
  'qti-text-entry-interaction': TextEntryPropertiesPanel,
};
