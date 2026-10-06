// Re-export individual components for direct use if needed
export { ExtendedTextElement } from './Element.js';
export { ExtendedTextPropertiesPanel } from './PropertiesPanel.js';

// Re-export from other modules
export { extendedTextInteractionConfig } from './config.js';
export { extendedTextParsers, extendedTextSerializers } from './serialization.js';
export { insertExtendedTextInteraction } from './insertion.js';

// Import components for creating maps
import { ExtendedTextElement } from './Element.js';
import { ExtendedTextPropertiesPanel } from './PropertiesPanel.js';

// Export objects that can be spread (one per concern)
export const extendedTextRenderers = {
  'qti-extended-text-interaction': ExtendedTextElement,
};

export const extendedTextPropertiesPanels = {
  'qti-extended-text-interaction': ExtendedTextPropertiesPanel,
};
