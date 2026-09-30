import type { PreviewOptions } from '@openstax/cutie-core';

interface PreviewOptionsPanelProps {
  options: PreviewOptions;
  onChange: (options: PreviewOptions) => void;
}

/**
 * Debug controls for cutie-core's preview options.
 */
export function PreviewOptionsPanel({ options, onChange }: PreviewOptionsPanelProps) {
  return (
    <details className="panel" open>
      <summary>
        <h2>Preview Options</h2>
      </summary>
      <div className="options">
        <div className="option">
          <label className="option-checkbox">
            <input
              type="checkbox"
              checked={options.compact ?? false}
              onChange={(e) => onChange({ ...options, compact: e.target.checked })}
            />
            Compact
          </label>
          <span className="option-help">
            Show only the correct answers, not the feedback. Adaptive items are always compact.
          </span>
        </div>
      </div>
    </details>
  );
}
