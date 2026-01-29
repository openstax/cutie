// Re-export individual components for direct use if needed
export { ChoiceElement } from './Element';
export { ChoicePropertiesPanel } from './PropertiesPanel';

// Re-export from other modules
export { choiceInteractionConfig } from './config';
export { choiceParsers, choiceSerializers } from './serialization';
export { insertChoiceInteraction } from './insertion';

// Import components for creating maps
import { ChoiceElement } from './Element';
import { ChoicePropertiesPanel } from './PropertiesPanel';

// Export objects that can be spread (one per concern)
export const choiceRenderers = {
  'qti-choice-interaction': ChoiceElement,
  // qti-prompt, qti-simple-choice, choice-id-label, choice-content removed - now in /src/elements
};

export const choicePropertiesPanels = {
  'qti-choice-interaction': ChoicePropertiesPanel,
};
