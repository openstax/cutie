// Re-export individual components for direct use if needed
export {
  MatchInteractionElement,
  MatchSourceSetElement,
  MatchTargetSetElement,
  SimpleAssociableChoiceElement,
} from './Element.js';
export {
  MatchPropertiesPanel,
  SimpleAssociableChoicePropertiesPanel,
} from './PropertiesPanel.js';

// Re-export from other modules
export {
  matchInteractionConfig,
  matchSourceSetConfig,
  matchTargetSetConfig,
  simpleAssociableChoiceConfig,
} from './config.js';
export { matchParsers, matchSerializers } from './serialization.js';
export { insertMatchInteraction, generateSourceId, generateTargetId } from './insertion.js';

// Import components for creating maps
import {
  MatchInteractionElement,
  MatchSourceSetElement,
  MatchTargetSetElement,
  SimpleAssociableChoiceElement,
} from './Element.js';
import {
  MatchPropertiesPanel,
  SimpleAssociableChoicePropertiesPanel,
} from './PropertiesPanel.js';

// Export objects that can be spread (one per concern)
export const matchRenderers = {
  'qti-match-interaction': MatchInteractionElement,
  'match-source-set': MatchSourceSetElement,
  'match-target-set': MatchTargetSetElement,
  'qti-simple-associable-choice': SimpleAssociableChoiceElement,
};

export const matchPropertiesPanels = {
  'qti-match-interaction': MatchPropertiesPanel,
  'qti-simple-associable-choice': SimpleAssociableChoicePropertiesPanel,
};
