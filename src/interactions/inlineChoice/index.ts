// Re-export individual components for direct use if needed
export { InlineChoiceElement } from './Element';
export { InlineChoicePropertiesPanel } from './PropertiesPanel';

// Re-export from other modules
export { inlineChoiceInteractionConfig } from './config';
export { inlineChoiceParsers, inlineChoiceSerializers } from './serialization';
export { insertInlineChoiceInteraction } from './insertion';

// Import components for creating maps
import { InlineChoiceElement } from './Element';
import { InlineChoicePropertiesPanel } from './PropertiesPanel';

// Export objects that can be spread (one per concern)
export const inlineChoiceRenderers = {
  'qti-inline-choice-interaction': InlineChoiceElement,
};

export const inlineChoicePropertiesPanels = {
  'qti-inline-choice-interaction': InlineChoicePropertiesPanel,
};
