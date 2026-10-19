export { FeedbackBlockElement } from './Element.js';
export { FeedbackBlockPropertiesPanel } from './PropertiesPanel.js';
export { feedbackBlockConfig } from './config.js';
export { feedbackBlockParsers, feedbackBlockSerializers } from './serialization.js';
export { insertFeedbackBlock, isInFeedbackBlock } from './insertion.js';

import { FeedbackBlockElement } from './Element.js';
import { FeedbackBlockPropertiesPanel } from './PropertiesPanel.js';

export const feedbackBlockRenderers = {
  'qti-feedback-block': FeedbackBlockElement,
};

export const feedbackBlockPropertiesPanels = {
  'qti-feedback-block': FeedbackBlockPropertiesPanel,
};
