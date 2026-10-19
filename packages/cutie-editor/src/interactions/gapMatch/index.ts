// Re-export individual components for direct use if needed
export {
  GapMatchInteractionElement,
  GapMatchChoicesElement,
  GapMatchContentElement,
  GapTextElement,
  GapImgElement,
  GapElement,
} from './Element.js';
export {
  GapMatchPropertiesPanel,
  GapTextPropertiesPanel,
  GapImgPropertiesPanel,
  GapPropertiesPanel,
} from './PropertiesPanel.js';

// Re-export from other modules
export {
  gapMatchInteractionConfig,
  gapMatchChoicesConfig,
  gapMatchContentConfig,
  gapTextConfig,
  gapImgConfig,
  gapConfig,
} from './config.js';
export { gapMatchParsers, gapMatchSerializers } from './serialization.js';
export { insertGapMatchInteraction, insertGapAtSelection, generateGapId, generateChoiceId } from './insertion.js';

// Import components for creating maps
import {
  GapElement,
  GapImgElement,
  GapMatchChoicesElement,
  GapMatchContentElement,
  GapMatchInteractionElement,
  GapTextElement,
} from './Element.js';
import {
  GapImgPropertiesPanel,
  GapMatchPropertiesPanel,
  GapPropertiesPanel,
  GapTextPropertiesPanel,
} from './PropertiesPanel.js';

// Export objects that can be spread (one per concern)
export const gapMatchRenderers = {
  'qti-gap-match-interaction': GapMatchInteractionElement,
  'gap-match-choices': GapMatchChoicesElement,
  'gap-match-content': GapMatchContentElement,
  'qti-gap-text': GapTextElement,
  'qti-gap-img': GapImgElement,
  'qti-gap': GapElement,
};

export const gapMatchPropertiesPanels = {
  'qti-gap-match-interaction': GapMatchPropertiesPanel,
  'qti-gap-text': GapTextPropertiesPanel,
  'qti-gap-img': GapImgPropertiesPanel,
  'qti-gap': GapPropertiesPanel,
};
