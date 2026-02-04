interface ShowHideRadioGroupProps {
  value: 'show' | 'hide';
  onChange: (value: 'show' | 'hide') => void;
  name: string;
  disabled?: boolean;
}

/**
 * Radio buttons for selecting show/hide visibility
 */
export function ShowHideRadioGroup({
  value,
  onChange,
  name,
  disabled = false,
}: ShowHideRadioGroupProps): React.JSX.Element {
  return (
    <fieldset className="radio-fieldset">
      <legend className="radio-fieldset-legend">Visibility</legend>
      <label className="radio-option">
        <input
          type="radio"
          name={name}
          value="show"
          checked={value === 'show'}
          onChange={() => onChange('show')}
          disabled={disabled}
        />
        <span>Show when matched</span>
      </label>
      <label className="radio-option">
        <input
          type="radio"
          name={name}
          value="hide"
          checked={value === 'hide'}
          onChange={() => onChange('hide')}
          disabled={disabled}
        />
        <span>Hide when matched</span>
      </label>
    </fieldset>
  );
}
