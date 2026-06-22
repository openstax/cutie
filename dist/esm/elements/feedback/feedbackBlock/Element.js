import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFocused, useSelected } from 'slate-react';
import { useFeedbackIdentifiers } from '../../../contexts/FeedbackIdentifiersContext';
import { useStyle } from '../../../hooks/useStyle';
/**
 * Render a feedback block element
 * Design aligned with choice interaction - fieldset with legend
 */
export function FeedbackBlockElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    const { availableIdentifiers, identifierLabels, isCustomMode } = useFeedbackIdentifiers();
    useStyle('feedback-block', FEEDBACK_BLOCK_STYLES);
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
    return (_jsxs("fieldset", { ...attributes, className: containerClass, children: [_jsxs("legend", { contentEditable: false, className: "feedback-block__legend", children: [!isValid && _jsx("span", { title: "Invalid feedback identifier", children: "\u26A0 " }), showHide === 'hide' ? 'Hide' : 'Show', " when ", displayLabel] }), _jsx("div", { children: children })] }));
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
