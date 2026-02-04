// Re-export individual components for direct use if needed
export {
  GapMatchInteractionElement,
  GapMatchChoicesElement,
  GapMatchContentElement,
  GapTextElement,
  GapImgElement,
  GapElement,
} from './Element';
export {
  GapMatchPropertiesPanel,
  GapTextPropertiesPanel,
  GapImgPropertiesPanel,
  GapPropertiesPanel,
} from './PropertiesPanel';

// Re-export from other modules
export {
  gapMatchInteractionConfig,
  gapMatchChoicesConfig,
  gapMatchContentConfig,
  gapTextConfig,
  gapImgConfig,
  gapConfig,
} from './config';
export { gapMatchParsers, gapMatchSerializers } from './serialization';
export { insertGapMatchInteraction, insertGapAtSelection, generateGapId, generateChoiceId } from './insertion';

// Import components for creating maps
import {
  GapElement,
  GapImgElement,
  GapMatchChoicesElement,
  GapMatchContentElement,
  GapMatchInteractionElement,
  GapTextElement,
} from './Element';
import {
  GapImgPropertiesPanel,
  GapMatchPropertiesPanel,
  GapPropertiesPanel,
  GapTextPropertiesPanel,
} from './PropertiesPanel';

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
