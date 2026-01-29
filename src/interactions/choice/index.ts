// Re-export individual components for direct use if needed
export { ChoiceElement } from './Element';
export { ChoicePropertiesPanel } from './PropertiesPanel';
export { ChoiceIdLabel } from './ChoiceIdLabel';
export { ChoiceContent } from './ChoiceContent';
export { SimpleChoiceElement } from './SimpleChoiceElement';
export { PromptElement } from './PromptElement';

// Re-export from other modules
export { choiceInteractionConfig } from './config';
export { choiceParsers, choiceSerializers } from './serialization';
export { insertChoiceInteraction } from './insertion';

// Import components for creating maps
import { ChoiceContent } from './ChoiceContent';
import { ChoiceIdLabel } from './ChoiceIdLabel';
import { ChoiceElement } from './Element';
import { PromptElement } from './PromptElement';
import { ChoicePropertiesPanel } from './PropertiesPanel';
import { SimpleChoiceElement } from './SimpleChoiceElement';

// Export objects that can be spread (one per concern)
export const choiceRenderers = {
  'qti-choice-interaction': ChoiceElement,
  'qti-simple-choice': SimpleChoiceElement,
  'qti-prompt': PromptElement,
  'choice-id-label': ChoiceIdLabel,
  'choice-content': ChoiceContent,
};

export const choicePropertiesPanels = {
  'qti-choice-interaction': ChoicePropertiesPanel,
};
