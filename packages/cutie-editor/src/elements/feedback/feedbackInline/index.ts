export { FeedbackInlineElement } from './Element';
export { FeedbackInlinePropertiesPanel } from './PropertiesPanel';
export { feedbackInlineConfig } from './config';
export { feedbackInlineParsers, feedbackInlineSerializers } from './serialization';
export { insertFeedbackInline, removeFeedbackInline, isInFeedbackInline } from './insertion';

import { FeedbackInlineElement } from './Element';
import { FeedbackInlinePropertiesPanel } from './PropertiesPanel';

export const feedbackInlineRenderers = {
  'qti-feedback-inline': FeedbackInlineElement,
};

export const feedbackInlinePropertiesPanels = {
  'qti-feedback-inline': FeedbackInlinePropertiesPanel,
};
