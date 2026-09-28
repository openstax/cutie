import type { ResolvedDeliveryOptions } from './utils/deliveryOptions';

interface DeliveryOptionsPanelProps {
  options: ResolvedDeliveryOptions;
  onChange: (options: ResolvedDeliveryOptions) => void;
}

/**
 * Debug controls for cutie-core's delivery options. Options are fixed per
 * attempt, so every change starts a new attempt (handled by the parent).
 */
export function DeliveryOptionsPanel({ options, onChange }: DeliveryOptionsPanelProps) {
  const set = <K extends keyof ResolvedDeliveryOptions>(key: K, value: ResolvedDeliveryOptions[K]) =>
    onChange({ ...options, [key]: value });

  return (
    <details className="panel" open>
      <summary>
        <h2>Delivery Options</h2>
      </summary>
      <div className="delivery-options">
        <p className="delivery-options-hint">Changing an option starts a new attempt.</p>

        <div className="delivery-option">
          <label className="delivery-option-checkbox">
            <input
              type="checkbox"
              checked={options.showFeedback}
              onChange={(e) => set('showFeedback', e.target.checked)}
            />
            Show feedback
          </label>
          <span className="delivery-option-help">Show feedback revealed when the attempt ends.</span>
        </div>

        <div className="delivery-option">
          <label htmlFor="show-evaluation-select">Show evaluation</label>
          <select
            id="show-evaluation-select"
            value={options.showEvaluation}
            onChange={(e) => set('showEvaluation', e.target.value as ResolvedDeliveryOptions['showEvaluation'])}
          >
            <option value="none">None</option>
            <option value="correctness">Correctness</option>
            <option value="correctResponse">Correct response</option>
          </select>
          <span className="delivery-option-help">What the learner sees about their response once the attempt ends.</span>
        </div>

        <div className="delivery-option">
          <label htmlFor="shuffle-override-select">Shuffle override</label>
          <select
            id="shuffle-override-select"
            value={options.shuffleOverride}
            onChange={(e) => set('shuffleOverride', e.target.value as ResolvedDeliveryOptions['shuffleOverride'])}
          >
            <option value="none">None (follow item)</option>
            <option value="shuffle">Shuffle</option>
            <option value="never">Never</option>
          </select>
          <span className="delivery-option-help">Override the item&apos;s shuffle attributes. Fixed choices never move.</span>
        </div>
      </div>
    </details>
  );
}
