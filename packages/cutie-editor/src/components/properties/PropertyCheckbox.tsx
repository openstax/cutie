import { useStyle } from '../../hooks/useStyle';

interface PropertyCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Reusable checkbox component for property editing
 */
export function PropertyCheckbox({
  label,
  checked,
  onChange,
}: PropertyCheckboxProps): React.JSX.Element {
  useStyle('property-checkbox', PROPERTY_CHECKBOX_STYLES);

  return (
    <div className="property-checkbox">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="checkbox-input"
        />
        <span className="checkbox-text">{label}</span>
      </label>
    </div>
  );
}

const PROPERTY_CHECKBOX_STYLES = `
  .property-checkbox {
    margin-bottom: 16px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: #333;
  }

  .checkbox-input {
    margin-right: 8px;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  .checkbox-text {
    user-select: none;
  }

  .checkbox-label:hover .checkbox-text {
    color: #2196f3;
  }
`;
