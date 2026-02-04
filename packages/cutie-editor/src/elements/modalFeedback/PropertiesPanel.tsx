import type { Path } from 'slate';
import { useSlate } from 'slate-react';
import type { QtiModalFeedback, ElementAttributes, ResponseProcessingConfig } from '../../types';
import { getAllFeedbackIdentifierOptions } from '../../utils/feedbackIdentifiers';
import { useStyle } from '../../hooks/useStyle';

interface ModalFeedbackPropertiesPanelProps {
  element: QtiModalFeedback;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
  responseProcessingConfig?: ResponseProcessingConfig;
}

/**
 * Properties panel for editing modal feedback attributes
 */
export function ModalFeedbackPropertiesPanel({
  element,
  path,
  onUpdate,
  responseProcessingConfig,
}: ModalFeedbackPropertiesPanelProps): React.JSX.Element {
  const editor = useSlate();
  useStyle('modal-feedback-properties', MODAL_FEEDBACK_PROPERTIES_STYLES);

  const isCustomMode = responseProcessingConfig?.mode === 'custom';
  const attrs = element.attributes;
  const currentIdentifier = attrs.identifier || '';
  const currentShowHide = attrs['show-hide'] || 'show';

  // Get available feedback identifiers from the document
  const feedbackOptions = getAllFeedbackIdentifierOptions(editor.children);

  const handleIdentifierChange = (newIdentifier: string) => {
    const newAttrs = {
      ...attrs,
      identifier: newIdentifier,
    };
    onUpdate(path, newAttrs);
  };

  const handleShowHideChange = (value: 'show' | 'hide') => {
    const newAttrs = {
      ...attrs,
      'show-hide': value,
    };
    onUpdate(path, newAttrs);
  };

  return (
    <div className="property-editor">
      <h3>Modal Feedback</h3>

      {isCustomMode && (
        <div className="feedback-custom-warning">
          <strong>Custom Response Processing</strong>
          <p>
            This item uses response processing patterns that cannot be managed by the editor.
            Feedback attributes are read-only, but you can still edit the feedback content.
          </p>
        </div>
      )}

      <div className="property-field">
        <label className="property-label">Show this feedback when:</label>
        {isCustomMode ? (
          <input
            type="text"
            className="property-input"
            value={currentIdentifier}
            disabled
            style={{ backgroundColor: '#f3f4f6' }}
          />
        ) : (
          <select
            className="property-select"
            value={currentIdentifier}
            onChange={(e) => handleIdentifierChange(e.target.value)}
          >
            <option value="">-- Select condition --</option>
            {feedbackOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
            {/* Show current value if not in options (preserves round-trip) */}
            {currentIdentifier && !feedbackOptions.some((o) => o.id === currentIdentifier) && (
              <option value={currentIdentifier}>{currentIdentifier} (custom)</option>
            )}
          </select>
        )}
        {!isCustomMode && feedbackOptions.length === 0 && (
          <p className="property-empty-state">
            No interactions found. Add an interaction to enable feedback conditions.
          </p>
        )}
      </div>

      <fieldset className="radio-fieldset">
        <legend className="radio-fieldset-legend">Visibility</legend>
        <label className="radio-option">
          <input
            type="radio"
            name="show-hide-modal"
            value="show"
            checked={currentShowHide === 'show'}
            onChange={() => handleShowHideChange('show')}
            disabled={isCustomMode}
          />
          <span>Show when matched</span>
        </label>
        <label className="radio-option">
          <input
            type="radio"
            name="show-hide-modal"
            value="hide"
            checked={currentShowHide === 'hide'}
            onChange={() => handleShowHideChange('hide')}
            disabled={isCustomMode}
          />
          <span>Hide when matched</span>
        </label>
      </fieldset>

      {/* Show info about what this identifier is based on */}
      {currentIdentifier && !isCustomMode && (
        <div className="property-tip">
          <strong>Based on:</strong>{' '}
          {feedbackOptions.find((o) => o.id === currentIdentifier)?.interactionType || 'Unknown'}
          <br />
          <small>
            {feedbackOptions.find((o) => o.id === currentIdentifier)?.description || ''}
          </small>
        </div>
      )}

      {isCustomMode && (
        <div className="feedback-readonly-info">
          <p>
            <strong>outcome-identifier:</strong> {attrs['outcome-identifier'] || 'FEEDBACK'}
          </p>
          <p>
            <strong>identifier:</strong> {currentIdentifier}
          </p>
          <p>
            <strong>show-hide:</strong> {currentShowHide}
          </p>
        </div>
      )}
    </div>
  );
}

const MODAL_FEEDBACK_PROPERTIES_STYLES = `
  .feedback-custom-warning {
    margin-bottom: 16px;
    padding: 12px;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 4px;
    font-size: 13px;
    color: #92400e;
  }

  .feedback-custom-warning strong {
    display: block;
    margin-bottom: 4px;
  }

  .feedback-custom-warning p {
    margin: 0;
  }

  .feedback-readonly-info {
    margin-top: 16px;
    padding: 12px;
    background-color: #f3f4f6;
    border-radius: 4px;
    font-size: 12px;
    color: #4b5563;
  }

  .feedback-readonly-info p {
    margin: 0 0 4px 0;
  }

  .feedback-readonly-info p:last-child {
    margin-bottom: 0;
  }
`;
