declare const FEEDBACK_TYPES: readonly ["correct", "incorrect", "info"];
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export declare function isFeedbackType(value: string): value is FeedbackType;
export declare function createFeedbackIcon(type: FeedbackType): HTMLSpanElement;
export declare const FEEDBACK_ICON_STYLES = "\n  .cutie-feedback-icon {\n    display: inline-flex;\n    align-items: center;\n  }\n\n  .cutie-feedback-icon--correct {\n    color: var(--cutie-feedback-correct);\n  }\n\n  .cutie-feedback-icon--incorrect {\n    color: var(--cutie-feedback-incorrect);\n  }\n\n  .cutie-feedback-icon--info {\n    color: var(--cutie-feedback-info);\n  }\n\n  .cutie-feedback-icon__svg {\n    width: 1em;\n    height: 1em;\n  }\n\n  .cutie-feedback-sr-text {\n    position: absolute;\n    width: 1px;\n    height: 1px;\n    padding: 0;\n    margin: -1px;\n    overflow: hidden;\n    clip: rect(0, 0, 0, 0);\n    white-space: nowrap;\n    border-width: 0;\n  }\n";
export {};
