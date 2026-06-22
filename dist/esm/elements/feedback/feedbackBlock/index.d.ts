export { FeedbackBlockElement } from './Element';
export { FeedbackBlockPropertiesPanel } from './PropertiesPanel';
export { feedbackBlockConfig } from './config';
export { feedbackBlockParsers, feedbackBlockSerializers } from './serialization';
export { insertFeedbackBlock, isInFeedbackBlock } from './insertion';
import { FeedbackBlockElement } from './Element';
import { FeedbackBlockPropertiesPanel } from './PropertiesPanel';
export declare const feedbackBlockRenderers: {
    'qti-feedback-block': typeof FeedbackBlockElement;
};
export declare const feedbackBlockPropertiesPanels: {
    'qti-feedback-block': typeof FeedbackBlockPropertiesPanel;
};
