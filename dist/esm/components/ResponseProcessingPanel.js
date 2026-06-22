import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStyle } from '../hooks/useStyle';
/**
 * Panel for configuring response processing (scoring mode)
 */
export function ResponseProcessingPanel({ config, interactionCount, hasFeedbackElements, onModeChange, }) {
    useStyle('response-processing-panel', RESPONSE_PROCESSING_PANEL_STYLES);
    const isCustom = config.mode === 'custom';
    // Warning messages based on mode/content mismatch
    const warnings = [];
    return (_jsxs("div", { className: "response-processing-panel", children: [_jsx("h3", { children: "Scoring Mode" }), _jsxs("fieldset", { className: "radio-fieldset", children: [_jsx("legend", { className: "radio-fieldset-legend", children: "How should responses be scored?" }), _jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: "scoring-mode", value: "allCorrect", checked: config.mode === 'allCorrect', onChange: () => onModeChange('allCorrect') }), _jsx("span", { children: "All or nothing" })] }), _jsx("p", { className: "radio-option-description", children: "Score 1 if all responses are correct, 0 otherwise" }), _jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: "scoring-mode", value: "sumScores", checked: config.mode === 'sumScores', onChange: () => onModeChange('sumScores') }), _jsx("span", { children: "Partial credit" })] }), _jsx("p", { className: "radio-option-description", children: "Each response contributes to the total score" }), _jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: "scoring-mode", value: "custom", checked: config.mode === 'custom', onChange: () => onModeChange('custom') }), _jsx("span", { children: "Custom" })] }), _jsx("p", { className: "radio-option-description", children: "Preserve existing response processing rules" })] }), isCustom && (_jsxs("div", { className: "custom-mode-notice", children: [_jsx("p", { children: "This item uses custom response processing that will be preserved when you save." }), _jsx("p", { className: "custom-mode-hint", children: "To use managed scoring, select a different mode above. This will replace the existing rules." })] })), !isCustom && config.customXml && (_jsxs("div", { className: "scoring-warning", children: [_jsx("strong", { children: "Warning:" }), " Switching from custom mode will replace existing response processing rules", hasFeedbackElements ? ', including feedback rules. Feedback elements may show invalid identifiers.' : '.'] })), warnings.length > 0 && (_jsx("div", { className: "scoring-warnings", children: warnings.map((warning, index) => (_jsx("div", { className: "scoring-warning", children: warning }, index))) })), _jsx("div", { className: "interaction-info", children: interactionCount === 0 ? (_jsx("span", { children: "No interactions in this item" })) : interactionCount === 1 ? (_jsx("span", { children: "1 interaction" })) : (_jsxs("span", { children: [interactionCount, " interactions"] })) })] }));
}
const RESPONSE_PROCESSING_PANEL_STYLES = `
  .response-processing-panel h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
  }

  .custom-mode-notice {
    background: #f3f4f6;
    border-radius: 6px;
    padding: 12px;
    font-size: 13px;
    color: #4b5563;
  }

  .custom-mode-notice p {
    margin: 0 0 8px 0;
  }

  .custom-mode-notice p:last-child {
    margin-bottom: 0;
  }

  .custom-mode-hint {
    font-style: italic;
    color: #6b7280;
  }

  .radio-option-description {
    margin: 0 0 16px 24px;
    font-size: 12px;
    color: #6b7280;
  }

  .scoring-warnings {
    margin-top: 16px;
  }

  .scoring-warning {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 13px;
    color: #92400e;
    margin-bottom: 8px;
  }

  .scoring-warning:last-child {
    margin-bottom: 0;
  }

  .interaction-info {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 13px;
    color: #6b7280;
  }
`;
