import { PropertyCheckbox } from './PropertyCheckbox';

interface ToggleableFormSectionProps {
  /** Label for the toggle checkbox */
  label: string;
  /** Whether the section is enabled/expanded */
  enabled: boolean;
  /** Called when the toggle changes */
  onToggle: (enabled: boolean) => void;
  /** Content to show when enabled */
  children: React.ReactNode;
  /** Optional help text shown below the checkbox */
  helpText?: string;
}

/**
 * A form section that can be toggled on/off with a checkbox.
 * When enabled, renders children directly - caller controls the content structure.
 * Useful for optional configuration like correct answers, mappings, etc.
 */
export function ToggleableFormSection({
  label,
  enabled,
  onToggle,
  children,
  helpText,
}: ToggleableFormSectionProps): React.JSX.Element {
  return (
    <div className="toggleable-form-section">
      <PropertyCheckbox
        label={label}
        checked={enabled}
        onChange={onToggle}
      />
      {helpText && <div className="property-help">{helpText}</div>}

      {enabled && (
        <div className="toggleable-content">
          {children}
        </div>
      )}
    </div>
  );
}
