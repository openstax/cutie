import { useEffect, useRef, useState } from 'react';
import type { AttemptState } from '@openstax/cutie-core';
import { submitResponse } from '@openstax/cutie-core';
import { mountItem } from '@openstax/cutie-client';
import type { MountedItem, ResponseData } from '@openstax/cutie-client';

interface PreviewTabProps {
  attemptState: AttemptState | null;
  sanitizedTemplate: string;
  responses: ResponseData | null;
  setResponses: (responses: ResponseData | null) => void;
  itemXml?: string;
  onStateUpdate?: (state: AttemptState) => void;
}

export function PreviewTab({ attemptState, sanitizedTemplate, responses, setResponses, itemXml, onStateUpdate }: PreviewTabProps) {
  const [interactionsEnabled, setInteractionsEnabled] = useState(true);
  const [localAttemptState, setLocalAttemptState] = useState<AttemptState | null>(attemptState);
  const previewRef = useRef<HTMLDivElement>(null);
  const mountedItemRef = useRef<MountedItem | null>(null);

  // Sync with parent attempt state
  useEffect(() => {
    setLocalAttemptState(attemptState);
  }, [attemptState]);

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

  const handleSubmit = async () => {
    if (mountedItemRef.current && itemXml && localAttemptState) {
      // Disable interactions during submission
      setInteractionsEnabled(false);

      // Collect responses
      const collectedResponses = mountedItemRef.current.collectResponses();
      setResponses(collectedResponses);

      // Log for debugging
      console.log('=== SUBMISSION START ===');
      console.log('Current attempt state:', localAttemptState);
      console.log('Collected responses:', collectedResponses);
      console.log('Response identifiers:', mountedItemRef.current.getResponseIdentifiers());

      try {
        // Process the response
        const result = await submitResponse(collectedResponses, localAttemptState, itemXml);
        console.log('Response processing result:', result);
        console.log('New state:', result.state);
        console.log('Score:', result.state.score);
        console.log('Max score:', result.state.maxScore);
        console.log('=== SUBMISSION END ===');

        // Update local state
        setLocalAttemptState(result.state);

        // Notify parent if callback provided
        if (onStateUpdate) {
          onStateUpdate(result.state);
        }
      } catch (error) {
        console.error('Error processing response:', error);
      } finally {
        // Re-enable interactions after a brief delay
        setTimeout(() => {
          setInteractionsEnabled(true);
        }, 1000);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1>Cutie QTI Processor</h1>

        <div className="panel">
          <h2>Attempt State</h2>
          <pre className="output-display">
            {localAttemptState ? JSON.stringify(localAttemptState, null, 2) : 'No state yet'}
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
