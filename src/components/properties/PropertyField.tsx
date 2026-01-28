import { useStyle } from '../../hooks/useStyle';

interface PropertyFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  required?: boolean;
  placeholder?: string;
  min?: string;
}

/**
 * Reusable input field component for property editing
 */
export function PropertyField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  min,
}: PropertyFieldProps): React.JSX.Element {
  useStyle('property-field', PROPERTY_FIELD_STYLES);

  return (
    <div className="property-field">
      <label className="property-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="property-input"
        placeholder={placeholder}
        min={min}
      />
    </div>
  );
}

const PROPERTY_FIELD_STYLES = `
  .property-field {
    margin-bottom: 16px;
  }

  .property-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin-bottom: 6px;
  }

  .required-indicator {
    color: #d32f2f;
    margin-left: 4px;
  }

  .property-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    box-sizing: border-box;
  }

  .property-input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  .property-input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;
