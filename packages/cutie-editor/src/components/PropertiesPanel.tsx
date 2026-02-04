import type { Path } from 'slate';
import { useStyle } from '../hooks/useStyle';
import { choicePropertiesPanels } from '../interactions/choice';
import { textEntryPropertiesPanels } from '../interactions/textEntry';
import { inlineChoicePropertiesPanels } from '../interactions/inlineChoice';
import { extendedTextPropertiesPanels } from '../interactions/extendedText';
import { gapMatchPropertiesPanels } from '../interactions/gapMatch';
import { imagePropertiesPanels } from '../elements/image';
import { simpleChoicePropertiesPanels } from '../elements/simpleChoice';
import { feedbackInlinePropertiesPanels } from '../elements/feedback/feedbackInline';
import { feedbackBlockPropertiesPanels } from '../elements/feedback/feedbackBlock';
import { modalFeedbackPropertiesPanels } from '../elements/feedback/modalFeedback';
import { ResponseProcessingPanel } from './ResponseProcessingPanel';
import type { SlateElement, ElementAttributes, XmlNode, ResponseProcessingConfig, ResponseProcessingMode } from '../types';

interface PropertiesPanelProps {
  selectedElement: SlateElement | null;
  selectedPath: Path | null;
  onUpdateAttributes: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode, additionalProps?: Record<string, unknown>) => void;
  responseProcessingConfig?: ResponseProcessingConfig;
  interactionCount?: number;
  hasMappings?: boolean;
  hasFeedbackElements?: boolean;
  onResponseProcessingModeChange?: (mode: ResponseProcessingMode) => void;
}

// Single contact point per interaction: spread all properties panel objects
// Using any for the component type to handle the specific element types
const propertiesPanels: Record<string, React.ComponentType<any>> = {
  ...choicePropertiesPanels,
  ...textEntryPropertiesPanels,
  ...inlineChoicePropertiesPanels,
  ...extendedTextPropertiesPanels,
  ...gapMatchPropertiesPanels,
  ...imagePropertiesPanels,
  ...simpleChoicePropertiesPanels,
  ...feedbackInlinePropertiesPanels,
  ...feedbackBlockPropertiesPanels,
  ...modalFeedbackPropertiesPanels,
};

/**
 * Main properties panel component that routes to interaction-specific editors
 */
export function PropertiesPanel({
  selectedElement,
  selectedPath,
  onUpdateAttributes,
  responseProcessingConfig,
  interactionCount = 0,
  hasMappings = false,
  hasFeedbackElements = false,
  onResponseProcessingModeChange,
}: PropertiesPanelProps): React.JSX.Element {
  useStyle('properties-panel', PROPERTIES_PANEL_STYLES);
  useStyle('properties-panel-forms', PROPERTIES_PANEL_FORM_STYLES);

  if (!selectedElement || !selectedPath) {
    // Show response processing panel in empty state
    if (responseProcessingConfig && onResponseProcessingModeChange) {
      return (
        <div className="properties-panel">
          <ResponseProcessingPanel
            config={responseProcessingConfig}
            interactionCount={interactionCount}
            hasMappings={hasMappings}
            hasFeedbackElements={hasFeedbackElements}
            onModeChange={onResponseProcessingModeChange}
          />
        </div>
      );
    }

    return (
      <div className="properties-panel">
        <div className="properties-panel-empty">
          Select an interaction to edit its properties
        </div>
      </div>
    );
  }

  const Panel = propertiesPanels[selectedElement.type];
  if (Panel) {
    // Pass responseProcessingConfig to feedback elements
    const isFeedbackElement =
      selectedElement.type === 'qti-feedback-inline' ||
      selectedElement.type === 'qti-feedback-block' ||
      selectedElement.type === 'qti-modal-feedback';

    return (
      <div className="properties-panel">
        <Panel
          element={selectedElement}
          path={selectedPath}
          onUpdate={onUpdateAttributes}
          {...(isFeedbackElement && { responseProcessingConfig })}
        />
      </div>
    );
  }

  // No specific panel for this element, show response processing
  if (responseProcessingConfig && onResponseProcessingModeChange) {
    return (
      <div className="properties-panel">
        <ResponseProcessingPanel
          config={responseProcessingConfig}
          interactionCount={interactionCount}
          hasMappings={hasMappings}
          hasFeedbackElements={hasFeedbackElements}
          onModeChange={onResponseProcessingModeChange}
        />
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="properties-panel-empty">
        Select an interaction to edit its properties
      </div>
    </div>
  );
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
