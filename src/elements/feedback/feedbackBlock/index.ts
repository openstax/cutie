export { FeedbackBlockElement } from './Element';
export { FeedbackBlockPropertiesPanel } from './PropertiesPanel';
export { feedbackBlockConfig } from './config';
export { feedbackBlockParsers, feedbackBlockSerializers } from './serialization';
export { insertFeedbackBlock, isInFeedbackBlock } from './insertion';

import { FeedbackBlockElement } from './Element';
import { FeedbackBlockPropertiesPanel } from './PropertiesPanel';

export const feedbackBlockRenderers = {
  'qti-feedback-block': FeedbackBlockElement,
};

export const feedbackBlockPropertiesPanels = {
  'qti-feedback-block': FeedbackBlockPropertiesPanel,
};
