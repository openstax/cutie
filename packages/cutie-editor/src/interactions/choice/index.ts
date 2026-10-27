// Re-export individual components for direct use if needed
export { ChoiceElement } from './Element.js';
export { ChoicePropertiesPanel } from './PropertiesPanel.js';

// Re-export from other modules
export { choiceInteractionConfig } from './config.js';
export { choiceParsers, choiceSerializers } from './serialization.js';
export { insertChoiceInteraction } from './insertion.js';

// Import components for creating maps
import { ChoiceElement } from './Element.js';
import { ChoicePropertiesPanel } from './PropertiesPanel.js';

// Export objects that can be spread (one per concern)
export const choiceRenderers = {
  'qti-choice-interaction': ChoiceElement,
  // qti-prompt, qti-simple-choice, choice-id-label, choice-content removed - now in /src/elements
};

export const choicePropertiesPanels = {
  'qti-choice-interaction': ChoicePropertiesPanel,
};
