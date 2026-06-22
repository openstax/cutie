"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackBlockElement = FeedbackBlockElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_react_1 = require("slate-react");
const FeedbackIdentifiersContext_1 = require("../../../contexts/FeedbackIdentifiersContext");
const useStyle_1 = require("../../../hooks/useStyle");
/**
 * Render a feedback block element
 * Design aligned with choice interaction - fieldset with legend
 */
function FeedbackBlockElement({ attributes, children, element, }) {
    const el = element;
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    const { availableIdentifiers, identifierLabels, isCustomMode } = (0, FeedbackIdentifiersContext_1.useFeedbackIdentifiers)();
    (0, useStyle_1.useStyle)('feedback-block', FEEDBACK_BLOCK_STYLES);
    const identifier = el.attributes.identifier || '';
    const showHide = el.attributes['show-hide'] || 'show';
    const feedbackType = el.attributes['data-feedback-type'] || '';
    // In custom mode, any non-empty identifier is valid (custom response processing can use arbitrary identifiers)
    const isValid = isCustomMode
        ? Boolean(identifier)
        : identifier && availableIdentifiers.has(identifier);
    const isActive = selected && focused;
    const displayLabel = identifier ? identifierLabels.get(identifier) || identifier : '(none)';
    const containerClass = [
        'feedback-block',
        isActive ? 'feedback-block--active' : '',
        !isValid ? 'feedback-block--invalid' : '',
        feedbackType ? `feedback-block--${feedbackType}` : '',
    ].filter(Boolean).join(' ');
    return ((0, jsx_runtime_1.jsxs)("fieldset", { ...attributes, className: containerClass, children: [(0, jsx_runtime_1.jsxs)("legend", { contentEditable: false, className: "feedback-block__legend", children: [!isValid && (0, jsx_runtime_1.jsx)("span", { title: "Invalid feedback identifier", children: "\u26A0 " }), showHide === 'hide' ? 'Hide' : 'Show', " when ", displayLabel] }), (0, jsx_runtime_1.jsx)("div", { children: children })] }));
}
const FEEDBACK_BLOCK_STYLES = `
  .feedback-block {
    margin: 16px 0;
    padding: 13px;
    border: 1px solid #94a3b8;
    border-radius: 8px;
  }

  .feedback-block--active {
    padding: 12px;
    border: 2px solid #3b82f6;
  }

  .feedback-block--invalid {
    border-color: #f59e0b;
    background-color: #fffbeb;
  }

  .feedback-block--invalid.feedback-block--active {
    border-color: #3b82f6;
    background-color: #fefce8;
  }

  .feedback-block--correct {
    border-left: 4px solid #22c55e;
  }

  .feedback-block--incorrect {
    border-left: 4px solid #ef4444;
  }

  .feedback-block--info {
    border-left: 4px solid #4a90e2;
  }

  .feedback-block__legend {
    padding: 0 8px;
    font-weight: bold;
    color: #64748b;
    user-select: none;
  }

  .feedback-block--active .feedback-block__legend {
    color: #1e40af;
  }

  .feedback-block--invalid .feedback-block__legend {
    color: #92400e;
  }

  .feedback-block--invalid.feedback-block--active .feedback-block__legend {
    color: #1e40af;
  }
`;
