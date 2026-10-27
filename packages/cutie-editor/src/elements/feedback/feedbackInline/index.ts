export { FeedbackInlineElement } from './Element.js';
export { FeedbackInlinePropertiesPanel } from './PropertiesPanel.js';
export { feedbackInlineConfig } from './config.js';
export { feedbackInlineParsers, feedbackInlineSerializers } from './serialization.js';
export { insertFeedbackInline, removeFeedbackInline, isInFeedbackInline } from './insertion.js';

import { FeedbackInlineElement } from './Element.js';
import { FeedbackInlinePropertiesPanel } from './PropertiesPanel.js';

export const feedbackInlineRenderers = {
  'qti-feedback-inline': FeedbackInlineElement,
};

export const feedbackInlinePropertiesPanels = {
  'qti-feedback-inline': FeedbackInlinePropertiesPanel,
};
