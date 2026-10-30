import { parseNumber } from '@openstax/cutie-core';
import { useEffect, useId, useState } from 'react';
import { useStyle } from '../hooks/useStyle.js';
import type { ResponseProcessingConfig, ResponseProcessingMode, ResponseProcessingSettings } from '../types.js';

interface ResponseProcessingPanelProps {
  config: ResponseProcessingConfig;
  interactionCount: number;
  hasFeedbackElements: boolean;
  onModeChange: (mode: ResponseProcessingMode) => void;
  onSettingsChange?: (settings: ResponseProcessingSettings) => void;
  /** The maximum score calculated from the responses (sumScores), or null when it can't be calculated */
  calculatedMaximumScore?: number | null;
}

/**
 * Panel for configuring response processing (scoring mode)
 */
export function ResponseProcessingPanel({
  config,
  interactionCount,
  hasFeedbackElements,
  onModeChange,
  onSettingsChange,
  calculatedMaximumScore = null,
}: ResponseProcessingPanelProps): React.JSX.Element {
  useStyle('response-processing-panel', RESPONSE_PROCESSING_PANEL_STYLES);

  const isCustom = config.mode === 'custom';

  // Warning messages based on mode/content mismatch
  const warnings: string[] = [];
  if (config.mode === 'sumScores' && onSettingsChange && config.maximumScore === undefined && calculatedMaximumScore === null) {
    warnings.push(
      "This item's maximum score can't be calculated. Enter a maximum score so its points can be reported."
    );
  }

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

        {config.mode === 'sumScores' && onSettingsChange && (
          <div className="sum-scores-settings">
            <NumberSetting
              label="Score Offset"
              description="Added to the total of the response scores. Can be negative; the total never goes below 0."
              value={config.scoreOffset}
              placeholder="0"
              onChange={(scoreOffset) => onSettingsChange({ scoreOffset })}
            />
            <NumberSetting
              label="Maximum Score"
              description="The total score never goes above this. Leave empty to calculate it from the responses."
              value={config.maximumScore}
              placeholder={calculatedMaximumScore !== null ? `${calculatedMaximumScore} (calculated)` : 'Unknown'}
              min={0}
              onChange={(maximumScore) => onSettingsChange({ maximumScore })}
            />
          </div>
        )}

        <label className="radio-option">
          <input
            type="radio"
            name="scoring-mode"
            value="manual"
            checked={config.mode === 'manual'}
            onChange={() => onModeChange('manual')}
          />
          <span>Manually graded</span>
        </label>
        <p className="radio-option-description">
          A person grades each response; nothing is scored automatically
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

interface NumberSettingProps {
  label: string;
  description: string;
  /** The setting's value, undefined when unset */
  value: number | undefined;
  placeholder: string;
  /** The lowest value accepted */
  min?: number;
  onChange: (value: number | undefined) => void;
}

/**
 * An optional number setting. The text is kept as typed and is saved when the
 * field loses focus or Enter is pressed: a complete number (at least min) is
 * passed on, empty text clears it, and anything else is flagged while typing
 * and reverts to the saved value.
 */
function NumberSetting({ label, description, value, placeholder, min, onChange }: NumberSettingProps): React.JSX.Element {
  const id = useId();
  const [text, setText] = useState(formatSetting(value));

  // Follow changes made elsewhere (undo, loading an item)
  useEffect(() => {
    setText(formatSetting(value));
  }, [value]);

  const save = () => {
    if (text.trim() === '') {
      if (value !== undefined) onChange(undefined);
      setText('');
      return;
    }
    const parsed = parseSetting(text, min);
    if (parsed === undefined) {
      setText(formatSetting(value));
    } else if (parsed !== value) {
      onChange(parsed);
    }
  };

  return (
    <div className="sum-scores-setting">
      <label className="sum-scores-setting-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className="sum-scores-setting-input"
        value={text}
        aria-invalid={text.trim() !== '' && parseSetting(text, min) === undefined}
        aria-describedby={`${id}-description`}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
        }}
        placeholder={placeholder}
      />
      <p id={`${id}-description`} className="sum-scores-setting-description">{description}</p>
    </div>
  );
}

/**
 * Parse a number setting's text: a finite decimal number of at least min, or undefined
 */
function parseSetting(text: string, min: number | undefined): number | undefined {
  const parsed = parseNumber(text);
  return parsed !== null && (min === undefined || parsed >= min) ? parsed : undefined;
}

/**
 * Format a number setting's value as text
 */
function formatSetting(value: number | undefined): string {
  return value === undefined ? '' : String(value);
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

  .sum-scores-settings {
    margin: 0 0 16px 24px;
  }

  .sum-scores-setting {
    margin-bottom: 12px;
  }

  .sum-scores-setting:last-child {
    margin-bottom: 0;
  }

  .sum-scores-setting-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin-bottom: 6px;
  }

  .sum-scores-setting-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    box-sizing: border-box;
  }

  .sum-scores-setting-input[aria-invalid="true"] {
    border-color: #d32f2f;
  }

  .sum-scores-setting-description {
    margin: 4px 0 0 0;
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
