"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseProcessingPanel = ResponseProcessingPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const useStyle_1 = require("../hooks/useStyle");
/**
 * Panel for configuring response processing (scoring mode)
 */
function ResponseProcessingPanel({ config, interactionCount, hasFeedbackElements, onModeChange, }) {
    (0, useStyle_1.useStyle)('response-processing-panel', RESPONSE_PROCESSING_PANEL_STYLES);
    const isCustom = config.mode === 'custom';
    // Warning messages based on mode/content mismatch
    const warnings = [];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "response-processing-panel", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Scoring Mode" }), (0, jsx_runtime_1.jsxs)("fieldset", { className: "radio-fieldset", children: [(0, jsx_runtime_1.jsx)("legend", { className: "radio-fieldset-legend", children: "How should responses be scored?" }), (0, jsx_runtime_1.jsxs)("label", { className: "radio-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "scoring-mode", value: "allCorrect", checked: config.mode === 'allCorrect', onChange: () => onModeChange('allCorrect') }), (0, jsx_runtime_1.jsx)("span", { children: "All or nothing" })] }), (0, jsx_runtime_1.jsx)("p", { className: "radio-option-description", children: "Score 1 if all responses are correct, 0 otherwise" }), (0, jsx_runtime_1.jsxs)("label", { className: "radio-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "scoring-mode", value: "sumScores", checked: config.mode === 'sumScores', onChange: () => onModeChange('sumScores') }), (0, jsx_runtime_1.jsx)("span", { children: "Partial credit" })] }), (0, jsx_runtime_1.jsx)("p", { className: "radio-option-description", children: "Each response contributes to the total score" }), (0, jsx_runtime_1.jsxs)("label", { className: "radio-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "scoring-mode", value: "custom", checked: config.mode === 'custom', onChange: () => onModeChange('custom') }), (0, jsx_runtime_1.jsx)("span", { children: "Custom" })] }), (0, jsx_runtime_1.jsx)("p", { className: "radio-option-description", children: "Preserve existing response processing rules" })] }), isCustom && ((0, jsx_runtime_1.jsxs)("div", { className: "custom-mode-notice", children: [(0, jsx_runtime_1.jsx)("p", { children: "This item uses custom response processing that will be preserved when you save." }), (0, jsx_runtime_1.jsx)("p", { className: "custom-mode-hint", children: "To use managed scoring, select a different mode above. This will replace the existing rules." })] })), !isCustom && config.customXml && ((0, jsx_runtime_1.jsxs)("div", { className: "scoring-warning", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Warning:" }), " Switching from custom mode will replace existing response processing rules", hasFeedbackElements ? ', including feedback rules. Feedback elements may show invalid identifiers.' : '.'] })), warnings.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "scoring-warnings", children: warnings.map((warning, index) => ((0, jsx_runtime_1.jsx)("div", { className: "scoring-warning", children: warning }, index))) })), (0, jsx_runtime_1.jsx)("div", { className: "interaction-info", children: interactionCount === 0 ? ((0, jsx_runtime_1.jsx)("span", { children: "No interactions in this item" })) : interactionCount === 1 ? ((0, jsx_runtime_1.jsx)("span", { children: "1 interaction" })) : ((0, jsx_runtime_1.jsxs)("span", { children: [interactionCount, " interactions"] })) })] }));
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
