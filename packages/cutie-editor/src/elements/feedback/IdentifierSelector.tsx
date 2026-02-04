import type { FeedbackIdentifierOption } from './types';

interface IdentifierSelectorProps {
  value: string;
  options: FeedbackIdentifierOption[];
  onChange: (identifier: string) => void;
  disabled?: boolean;
}

/**
 * Dropdown/input for selecting a feedback identifier
 */
export function IdentifierSelector({
  value,
  options,
  onChange,
  disabled = false,
}: IdentifierSelectorProps): React.JSX.Element {
  if (disabled) {
    return (
      <div className="property-field">
        <label className="property-label">Show this feedback when:</label>
        <input
          type="text"
          className="property-input"
          value={value}
          disabled
          style={{ backgroundColor: '#f3f4f6' }}
        />
      </div>
    );
  }

  return (
    <div className="property-field">
      <label className="property-label">Show this feedback when:</label>
      <select
        className="property-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- Select condition --</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
        {/* Show current value if not in options (preserves round-trip) */}
        {value && !options.some((o) => o.id === value) && (
          <option value={value}>{value} (custom)</option>
        )}
      </select>
      {options.length === 0 && (
        <p className="property-empty-state">
          No interactions found. Add an interaction to enable feedback conditions.
        </p>
      )}
    </div>
  );
}
