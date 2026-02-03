import { useEffect, useRef, useState } from 'react';
import type { AttemptState } from '@openstax/cutie-core';
import { mountItem } from '@openstax/cutie-client';
import type { MountedItem, ResponseData } from '@openstax/cutie-client';

interface PreviewTabProps {
  attemptState: AttemptState | null;
  sanitizedTemplate: string;
  responses: ResponseData | null;
  onSubmitResponses: (responses: ResponseData) => void;
  onResetAttempt: () => void;
}

export function PreviewTab({ attemptState, sanitizedTemplate, responses, onSubmitResponses, onResetAttempt }: PreviewTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const mountedItemRef = useRef<MountedItem | null>(null);

  // Derived - no state needed
  const interactionsEnabled = !isSubmitting && attemptState?.completionStatus !== 'completed';

  // Mount/unmount item when sanitizedTemplate changes
  useEffect(() => {
    if (previewRef.current && sanitizedTemplate) {
      const mountedItem = mountItem(previewRef.current, sanitizedTemplate);
      mountedItemRef.current = mountedItem;
      // Apply current interaction state to newly mounted item
      mountedItem.setInteractionsEnabled(interactionsEnabled);

      return () => {
        mountedItem.unmount();
        mountedItemRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanitizedTemplate]);

  useEffect(() => {
    if (mountedItemRef.current) {
      mountedItemRef.current.setInteractionsEnabled(interactionsEnabled);
    }
  }, [interactionsEnabled]);

  const handleSubmit = () => {
    if (!mountedItemRef.current) return;

    setIsSubmitting(true);
    const collectedResponses = mountedItemRef.current.collectResponses();

    // Brief delay to show submitting state, then submit
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitResponses(collectedResponses);
    }, 1000);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1>Cutie QTI Processor</h1>

        <details className="panel" open>
          <summary>
            <h2>Attempt State</h2>
          </summary>
          <pre className="output-display">
            {attemptState ? JSON.stringify(attemptState, null, 2) : 'No state yet'}
          </pre>
        </details>

        <details className="panel" open>
          <summary>
            <h2>Sanitized Template</h2>
          </summary>
          <pre className="output-display xml-output">
            {sanitizedTemplate || 'No template yet'}
          </pre>
        </details>

        <details className="panel" open>
          <summary>
            <h2>Response Collection</h2>
          </summary>
          <pre className="output-display">
            {responses ? JSON.stringify(responses, null, 2) : 'No responses collected yet'}
          </pre>
        </details>
      </div>

      <div className="preview-area">
        <div className="preview-card">
          <div className="preview-item" ref={previewRef} />
          <button
            className="process-button"
            onClick={handleSubmit}
            disabled={!sanitizedTemplate || !interactionsEnabled}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            className="process-button"
            onClick={onResetAttempt}
            disabled={!attemptState}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
