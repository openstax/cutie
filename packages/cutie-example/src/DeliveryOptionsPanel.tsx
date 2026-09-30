import { MAX_TRIES_VALUES, type ResolvedDeliveryOptions } from './utils/deliveryOptions';

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
      <div className="options">
        <p className="options-hint">Changing an option starts a new attempt.</p>

        <div className="option">
          <label className="option-checkbox">
            <input
              type="checkbox"
              checked={options.showFeedback}
              onChange={(e) => set('showFeedback', e.target.checked)}
            />
            Show feedback
          </label>
          <span className="option-help">Show feedback revealed when the attempt ends.</span>
        </div>

        <div className="option">
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
          <span className="option-help">What the learner sees about their response once the attempt ends.</span>
        </div>

        <div className="option">
          <label htmlFor="max-tries-select">Max tries</label>
          <select
            id="max-tries-select"
            value={String(options.maxTries)}
            onChange={(e) => set('maxTries', e.target.value === 'smart' ? 'smart' : Number(e.target.value))}
          >
            {MAX_TRIES_VALUES.map((value) => (
              <option key={value} value={String(value)}>
                {value === 'smart' ? 'Smart (from the interactions)' : value}
              </option>
            ))}
          </select>
          <span className="option-help">
            A try that falls short starts a fresh one, showing its verdict, until the tries run out.
          </span>
        </div>

        <div className="option">
          <label htmlFor="adaptive-retry-message-input">Adaptive retry message</label>
          <input
            id="adaptive-retry-message-input"
            type="text"
            key={options.adaptiveRetryMessage}
            defaultValue={options.adaptiveRetryMessage}
            onBlur={(e) => {
              if (e.target.value !== options.adaptiveRetryMessage) set('adaptiveRetryMessage', e.target.value);
            }}
          />
          <span className="option-help">
            Leads an adaptive item on a fresh try; {'{n}'} is the tries remaining. Applied when the field loses focus.
          </span>
        </div>

        <div className="option">
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
          <span className="option-help">Override the item&apos;s shuffle attributes. Fixed choices never move.</span>
        </div>
      </div>
    </details>
  );
}
