"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesPanel = PropertiesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const useStyle_1 = require("../hooks/useStyle");
const choice_1 = require("../interactions/choice");
const textEntry_1 = require("../interactions/textEntry");
const inlineChoice_1 = require("../interactions/inlineChoice");
const extendedText_1 = require("../interactions/extendedText");
const gapMatch_1 = require("../interactions/gapMatch");
const match_1 = require("../interactions/match");
const image_1 = require("../elements/image");
const simpleChoice_1 = require("../elements/simpleChoice");
const feedbackInline_1 = require("../elements/feedback/feedbackInline");
const feedbackBlock_1 = require("../elements/feedback/feedbackBlock");
const modalFeedback_1 = require("../elements/feedback/modalFeedback");
const ResponseProcessingPanel_1 = require("./ResponseProcessingPanel");
// Single contact point per interaction: spread all properties panel objects
// Using any for the component type to handle the specific element types
const propertiesPanels = {
    ...choice_1.choicePropertiesPanels,
    ...textEntry_1.textEntryPropertiesPanels,
    ...inlineChoice_1.inlineChoicePropertiesPanels,
    ...extendedText_1.extendedTextPropertiesPanels,
    ...gapMatch_1.gapMatchPropertiesPanels,
    ...match_1.matchPropertiesPanels,
    ...image_1.imagePropertiesPanels,
    ...simpleChoice_1.simpleChoicePropertiesPanels,
    ...feedbackInline_1.feedbackInlinePropertiesPanels,
    ...feedbackBlock_1.feedbackBlockPropertiesPanels,
    ...modalFeedback_1.modalFeedbackPropertiesPanels,
};
/**
 * Main properties panel component that routes to interaction-specific editors
 */
function PropertiesPanel({ selectedElement, selectedPath, onUpdateAttributes, responseProcessingConfig, interactionCount = 0, hasFeedbackElements = false, onResponseProcessingModeChange, }) {
    (0, useStyle_1.useStyle)('properties-panel', PROPERTIES_PANEL_STYLES);
    (0, useStyle_1.useStyle)('properties-panel-forms', PROPERTIES_PANEL_FORM_STYLES);
    if (!selectedElement || !selectedPath) {
        // Show response processing panel in empty state
        if (responseProcessingConfig && onResponseProcessingModeChange) {
            return ((0, jsx_runtime_1.jsx)("div", { className: "properties-panel", children: (0, jsx_runtime_1.jsx)(ResponseProcessingPanel_1.ResponseProcessingPanel, { config: responseProcessingConfig, interactionCount: interactionCount, hasFeedbackElements: hasFeedbackElements, onModeChange: onResponseProcessingModeChange }) }));
        }
        return ((0, jsx_runtime_1.jsx)("div", { className: "properties-panel", children: (0, jsx_runtime_1.jsx)("div", { className: "properties-panel-empty", children: "Select an interaction to edit its properties" }) }));
    }
    const Panel = propertiesPanels[selectedElement.type];
    if (Panel) {
        // Pass responseProcessingConfig to feedback elements
        const isFeedbackElement = selectedElement.type === 'qti-feedback-inline' ||
            selectedElement.type === 'qti-feedback-block' ||
            selectedElement.type === 'qti-modal-feedback';
        return ((0, jsx_runtime_1.jsx)("div", { className: "properties-panel", children: (0, jsx_runtime_1.jsx)(Panel, { element: selectedElement, path: selectedPath, onUpdate: onUpdateAttributes, ...(isFeedbackElement && { responseProcessingConfig }) }) }));
    }
    // No specific panel for this element, show response processing
    if (responseProcessingConfig && onResponseProcessingModeChange) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "properties-panel", children: (0, jsx_runtime_1.jsx)(ResponseProcessingPanel_1.ResponseProcessingPanel, { config: responseProcessingConfig, interactionCount: interactionCount, hasFeedbackElements: hasFeedbackElements, onModeChange: onResponseProcessingModeChange }) }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "properties-panel", children: (0, jsx_runtime_1.jsx)("div", { className: "properties-panel-empty", children: "Select an interaction to edit its properties" }) }));
}
const PROPERTIES_PANEL_STYLES = `
  .properties-panel {
    width: 280px;
    min-width: 280px;
    border-left: 1px solid #ddd;
    padding: 16px;
    background: #fafafa;
    overflow-y: auto;
    height: 100%;
  }

  .properties-panel-empty {
    color: #666;
    font-size: 14px;
    text-align: center;
    padding: 32px 16px;
    line-height: 1.5;
  }
`;
/**
 * Base form styles for all properties panels.
 * These provide intelligent defaults for common form elements.
 */
const PROPERTIES_PANEL_FORM_STYLES = `
  /* Property editor container */
  .property-editor h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
  }

  /* Toggleable form sections (correct answer, mapping, etc.) */
  .toggleable-form-section {
    margin-top: 24px;
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
  }

  .toggleable-content {
    margin-top: 12px;
  }

  /* Radio/checkbox fieldset for option groups */
  .radio-fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }

  .radio-fieldset-legend {
    font-weight: 600;
    font-size: 14px;
    padding: 0;
    margin-bottom: 12px;
  }

  .radio-option {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: #333;
    margin-bottom: 12px;
  }

  .radio-option:last-child {
    margin-bottom: 0;
  }

  .radio-option input[type="radio"] {
    margin-right: 8px;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  .radio-option span {
    user-select: none;
  }

  .radio-option:hover span {
    color: #2196f3;
  }

  /* Base input styles */
  .property-input,
  .property-select,
  .property-textarea {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    font-family: inherit;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .property-input:focus,
  .property-select:focus,
  .property-textarea:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .property-select {
    background: white;
    cursor: pointer;
  }

  .property-textarea {
    resize: vertical;
    min-height: 80px;
  }

  /* Field container */
  .property-field {
    margin-bottom: 16px;
  }

  .property-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 4px;
  }

  /* Tip box */
  .property-tip {
    margin-top: 16px;
    padding: 12px;
    background: #f0f9ff;
    border-radius: 4px;
    font-size: 13px;
    color: #0369a1;
  }

  /* Empty state text */
  .property-empty-state {
    font-size: 13px;
    color: #999;
    font-style: italic;
  }
`;
