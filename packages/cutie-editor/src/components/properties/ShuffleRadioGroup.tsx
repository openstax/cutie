import { useId } from 'react';
import type { ElementAttributes } from '../../types';

/**
 * The author's shuffle choice for an interaction.
 * - 'true' / 'false' are written verbatim to the `shuffle` attribute
 * - 'unspecified' means the attribute is omitted
 */
export type ShuffleValue = 'true' | 'false' | 'unspecified';

const SHUFFLE_OPTIONS: ReadonlyArray<{ value: ShuffleValue; label: string }> = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
  { value: 'unspecified', label: 'Unspecified' },
];

/**
 * Read the shuffle choice from an interaction's attributes.
 * A missing or unrecognized value is treated as unspecified.
 */
export function getShuffleValue(attributes: ElementAttributes): ShuffleValue {
  const shuffle = attributes.shuffle;
  return shuffle === 'true' || shuffle === 'false' ? shuffle : 'unspecified';
}

/**
 * Return a copy of the attributes with the shuffle choice applied.
 * 'unspecified' removes the attribute entirely.
 */
export function setShuffleValue<T extends ElementAttributes>(attributes: T, value: ShuffleValue): T {
  const newAttrs = { ...attributes };
  if (value === 'unspecified') {
    delete newAttrs.shuffle;
  } else {
    (newAttrs as ElementAttributes).shuffle = value;
  }
  return newAttrs;
}

interface ShuffleRadioGroupProps<T extends ElementAttributes> {
  attributes: T;
  onChange: (attributes: T) => void;
}

/**
 * Radio group for the interaction `shuffle` attribute (Yes / No / Unspecified).
 * Records exactly what the author chose; delivery-time behavior is not the editor's concern.
 */
export function ShuffleRadioGroup<T extends ElementAttributes>({
  attributes,
  onChange,
}: ShuffleRadioGroupProps<T>): React.JSX.Element {
  const name = useId();
  const current = getShuffleValue(attributes);

  return (
    <fieldset className="radio-fieldset">
      <legend className="radio-fieldset-legend">Shuffle choices</legend>
      {SHUFFLE_OPTIONS.map(({ value, label }) => (
        <label key={value} className="radio-option">
          <input
            type="radio"
            name={name}
            value={value}
            checked={current === value}
            onChange={() => onChange(setShuffleValue(attributes, value))}
          />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
