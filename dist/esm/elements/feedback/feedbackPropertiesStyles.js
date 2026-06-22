/**
 * Shared CSS styles for feedback properties panels
 */
export const FEEDBACK_PROPERTIES_STYLES = `
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

  .feedback-type-selector {
    margin-bottom: 16px;
  }

  .feedback-type-selector__label {
    display: block;
    font-weight: 600;
    margin-bottom: 4px;
    color: #374151;
  }

  .feedback-type-selector__select {
    width: 100%;
    padding: 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
    background-color: white;
  }

  .feedback-type-selector__select:disabled {
    background-color: #f3f4f6;
    color: #9ca3af;
  }
`;
