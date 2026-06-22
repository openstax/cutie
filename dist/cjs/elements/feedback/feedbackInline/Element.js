"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackInlineElement = FeedbackInlineElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_react_1 = require("slate-react");
const FeedbackIdentifiersContext_1 = require("../../../contexts/FeedbackIdentifiersContext");
const useStyle_1 = require("../../../hooks/useStyle");
/**
 * Render a feedback inline element
 * Design aligned with text entry interaction - neutral styling with label
 */
function FeedbackInlineElement({ attributes, children, element, }) {
    const el = element;
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    const { availableIdentifiers, identifierLabels, isCustomMode } = (0, FeedbackIdentifiersContext_1.useFeedbackIdentifiers)();
    (0, useStyle_1.useStyle)('feedback-inline', FEEDBACK_INLINE_STYLES);
    const identifier = el.attributes.identifier || '';
    const showHide = el.attributes['show-hide'] || 'show';
    const feedbackType = el.attributes['data-feedback-type'] || '';
    // In custom mode, any non-empty identifier is valid (custom response processing can use arbitrary identifiers)
    const isValid = isCustomMode
        ? Boolean(identifier)
        : identifier && availableIdentifiers.has(identifier);
    const isActive = selected && focused;
    const displayLabel = identifier ? identifierLabels.get(identifier) || identifier : '(not set)';
    const containerClass = [
        'feedback-inline',
        isActive ? 'feedback-inline--active' : '',
        !isValid ? 'feedback-inline--invalid' : '',
        feedbackType ? `feedback-inline--${feedbackType}` : '',
    ].filter(Boolean).join(' ');
    return ((0, jsx_runtime_1.jsxs)("span", { ...attributes, className: containerClass, children: [(0, jsx_runtime_1.jsxs)("span", { contentEditable: false, className: "feedback-inline__label", children: [!isValid && (0, jsx_runtime_1.jsx)("span", { title: "Invalid feedback identifier", children: "\u26A0 " }), showHide === 'hide' ? 'Hide' : 'Show', " when ", displayLabel] }), children] }));
}
const FEEDBACK_INLINE_STYLES = `
  .feedback-inline {
    display: inline-block;
    padding: 3px 9px;
    margin: 0 4px;
    background-color: #f8fafc;
    border: 1px solid #94a3b8;
    border-radius: 4px;
    vertical-align: middle;
  }

  .feedback-inline--active {
    padding: 2px 8px;
    background-color: #eff6ff;
    border: 2px solid #3b82f6;
  }

  .feedback-inline--invalid {
    background-color: #fffbeb;
    border-color: #f59e0b;
  }

  .feedback-inline--invalid.feedback-inline--active {
    background-color: #fef3c7;
    border-color: #3b82f6;
  }

  .feedback-inline--correct {
    border-left: 3px solid #22c55e;
  }

  .feedback-inline--incorrect {
    border-left: 3px solid #ef4444;
  }

  .feedback-inline--info {
    border-left: 3px solid #4a90e2;
  }

  .feedback-inline__label {
    display: inline;
    font-size: 0.75em;
    font-weight: 600;
    color: #64748b;
    user-select: none;
    margin-right: 4px;
    vertical-align: middle;
  }

  .feedback-inline--active .feedback-inline__label {
    color: #1e40af;
  }

  .feedback-inline--invalid .feedback-inline__label {
    color: #92400e;
  }

  .feedback-inline--invalid.feedback-inline--active .feedback-inline__label {
    color: #1e40af;
  }
`;
