export type FeedbackType = 'correct' | 'incorrect' | 'info' | '';

interface FeedbackTypeSelectorProps {
  value: FeedbackType;
  onChange: (value: FeedbackType) => void;
  disabled?: boolean;
}

/**
 * Dropdown selector for feedback type styling
 */
export function FeedbackTypeSelector({
  value,
  onChange,
  disabled = false,
}: FeedbackTypeSelectorProps): React.JSX.Element {
  return (
    <div className="feedback-type-selector">
      <label className="feedback-type-selector__label" htmlFor="feedback-type">
        Feedback Type
      </label>
      <select
        id="feedback-type"
        className="feedback-type-selector__select"
        value={value}
        onChange={(e) => onChange(e.target.value as FeedbackType)}
        disabled={disabled}
      >
        <option value="">(none)</option>
        <option value="correct">Correct</option>
        <option value="incorrect">Incorrect</option>
        <option value="info">Info</option>
      </select>
    </div>
  );
}
