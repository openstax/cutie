// Re-export individual components for direct use if needed
export { InlineChoiceElement } from './Element.js';
export { InlineChoicePropertiesPanel } from './PropertiesPanel.js';

// Re-export from other modules
export { inlineChoiceInteractionConfig } from './config.js';
export { inlineChoiceParsers, inlineChoiceSerializers } from './serialization.js';
export { insertInlineChoiceInteraction } from './insertion.js';

// Import components for creating maps
import { InlineChoiceElement } from './Element.js';
import { InlineChoicePropertiesPanel } from './PropertiesPanel.js';

// Export objects that can be spread (one per concern)
export const inlineChoiceRenderers = {
  'qti-inline-choice-interaction': InlineChoiceElement,
};

export const inlineChoicePropertiesPanels = {
  'qti-inline-choice-interaction': InlineChoicePropertiesPanel,
};
