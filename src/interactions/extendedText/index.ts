// Re-export individual components for direct use if needed
export { ExtendedTextElement } from './Element';
export { ExtendedTextPropertiesPanel } from './PropertiesPanel';

// Re-export from other modules
export { extendedTextInteractionConfig } from './config';
export { extendedTextParsers, extendedTextSerializers } from './serialization';
export { insertExtendedTextInteraction } from './insertion';

// Import components for creating maps
import { ExtendedTextElement } from './Element';
import { ExtendedTextPropertiesPanel } from './PropertiesPanel';

// Export objects that can be spread (one per concern)
export const extendedTextRenderers = {
  'qti-extended-text-interaction': ExtendedTextElement,
};

export const extendedTextPropertiesPanels = {
  'qti-extended-text-interaction': ExtendedTextPropertiesPanel,
};
