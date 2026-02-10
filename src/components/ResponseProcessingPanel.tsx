import { useStyle } from '../hooks/useStyle';
import type { ResponseProcessingConfig, ResponseProcessingMode } from '../types';

interface ResponseProcessingPanelProps {
  config: ResponseProcessingConfig;
  interactionCount: number;
  hasFeedbackElements: boolean;
  onModeChange: (mode: ResponseProcessingMode) => void;
}

/**
 * Panel for configuring response processing (scoring mode)
 */
export function ResponseProcessingPanel({
  config,
  interactionCount,
  hasFeedbackElements,
  onModeChange,
}: ResponseProcessingPanelProps): React.JSX.Element {
  useStyle('response-processing-panel', RESPONSE_PROCESSING_PANEL_STYLES);

  const isCustom = config.mode === 'custom';

  // Warning messages based on mode/content mismatch
  const warnings: string[] = [];

  return (
    <div className="response-processing-panel">
      <h3>Scoring Mode</h3>

      <fieldset className="radio-fieldset">
        <legend className="radio-fieldset-legend">How should responses be scored?</legend>

        <label className="radio-option">
          <input
            type="radio"
            name="scoring-mode"
            value="allCorrect"
            checked={config.mode === 'allCorrect'}
            onChange={() => onModeChange('allCorrect')}
          />
          <span>All or nothing</span>
        </label>
        <p className="radio-option-description">
          Score 1 if all responses are correct, 0 otherwise
        </p>

        <label className="radio-option">
          <input
            type="radio"
            name="scoring-mode"
            value="sumScores"
            checked={config.mode === 'sumScores'}
            onChange={() => onModeChange('sumScores')}
          />
          <span>Partial credit</span>
        </label>
        <p className="radio-option-description">
          Each response contributes to the total score
        </p>

        <label className="radio-option">
          <input
            type="radio"
            name="scoring-mode"
            value="custom"
            checked={config.mode === 'custom'}
            onChange={() => onModeChange('custom')}
          />
          <span>Custom</span>
        </label>
        <p className="radio-option-description">
          Preserve existing response processing rules
        </p>
      </fieldset>

      {isCustom && (
        <div className="custom-mode-notice">
          <p>
            This item uses custom response processing that will be preserved when you save.
          </p>
          <p className="custom-mode-hint">
            To use managed scoring, select a different mode above. This will replace the existing rules.
          </p>
        </div>
      )}

      {!isCustom && config.customXml && (
        <div className="scoring-warning">
          <strong>Warning:</strong> Switching from custom mode will replace existing response
          processing rules{hasFeedbackElements ? ', including feedback rules. Feedback elements may show invalid identifiers.' : '.'}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="scoring-warnings">
          {warnings.map((warning, index) => (
            <div key={index} className="scoring-warning">
              {warning}
            </div>
          ))}
        </div>
      )}

      <div className="interaction-info">
        {interactionCount === 0 ? (
          <span>No interactions in this item</span>
        ) : interactionCount === 1 ? (
          <span>1 interaction</span>
        ) : (
          <span>{interactionCount} interactions</span>
        )}
      </div>
    </div>
  );
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
