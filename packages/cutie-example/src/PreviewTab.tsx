import { useEffect, useRef, useState } from 'react';
import type { AttemptState } from '@openstax/cutie-core';
import { mountItem } from '@openstax/cutie-client';
import type { MountedItem, ResponseData } from '@openstax/cutie-client';

interface PreviewTabProps {
  attemptState: AttemptState | null;
  sanitizedTemplate: string;
  responses: ResponseData | null;
  setResponses: (responses: ResponseData | null) => void;
}

export function PreviewTab({ attemptState, sanitizedTemplate, responses, setResponses }: PreviewTabProps) {
  const [interactionsEnabled, setInteractionsEnabled] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const mountedItemRef = useRef<MountedItem | null>(null);

  // Mount/unmount item when sanitizedTemplate changes
  useEffect(() => {
    if (previewRef.current && sanitizedTemplate) {
      const mountedItem = mountItem(previewRef.current, sanitizedTemplate);
      mountedItemRef.current = mountedItem;

      return () => {
        mountedItem.unmount();
        mountedItemRef.current = null;
      };
    }
  }, [sanitizedTemplate]);

  useEffect(() => {
    if (mountedItemRef.current) {
      mountedItemRef.current.setInteractionsEnabled(interactionsEnabled);
    }
  }, [interactionsEnabled]);

  const handleSubmit = () => {
    if (mountedItemRef.current) {
      // Disable interactions during submission
      setInteractionsEnabled(false);

      // Collect responses
      const collectedResponses = mountedItemRef.current.collectResponses();
      setResponses(collectedResponses);

      // Log for debugging
      console.log('Collected responses:', collectedResponses);
      console.log('Response identifiers:', mountedItemRef.current.getResponseIdentifiers());

      // Re-enable interactions after a brief delay (simulating submission)
      setTimeout(() => {
        setInteractionsEnabled(true);
      }, 1000);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1>Cutie QTI Processor</h1>

        <div className="panel">
          <h2>Attempt State</h2>
          <pre className="output-display">
            {attemptState ? JSON.stringify(attemptState, null, 2) : 'No state yet'}
          </pre>
        </div>

        <div className="panel">
          <h2>Sanitized Template</h2>
          <pre className="output-display xml-output">
            {sanitizedTemplate || 'No template yet'}
          </pre>
        </div>

        <div className="panel">
          <h2>Response Collection</h2>
          <pre className="output-display">
            {responses ? JSON.stringify(responses, null, 2) : 'No responses collected yet'}
          </pre>
        </div>
      </div>

      <div className="preview-area">
        <div className="preview-card">
          <div className="preview-item" ref={previewRef} />
          <button
            className="process-button"
            onClick={handleSubmit}
            disabled={!sanitizedTemplate || !interactionsEnabled}
          >
            {interactionsEnabled ? 'Submit' : 'Submitting...'}
          </button>
        </div>
      </div>
    </div>
  );
}
