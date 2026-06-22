export { FeedbackInlineElement } from './Element';
export { FeedbackInlinePropertiesPanel } from './PropertiesPanel';
export { feedbackInlineConfig } from './config';
export { feedbackInlineParsers, feedbackInlineSerializers } from './serialization';
export { insertFeedbackInline, removeFeedbackInline, isInFeedbackInline } from './insertion';
import { FeedbackInlineElement } from './Element';
import { FeedbackInlinePropertiesPanel } from './PropertiesPanel';
export declare const feedbackInlineRenderers: {
    'qti-feedback-inline': typeof FeedbackInlineElement;
};
export declare const feedbackInlinePropertiesPanels: {
    'qti-feedback-inline': typeof FeedbackInlinePropertiesPanel;
};
