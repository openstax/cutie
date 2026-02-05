import { useEffect, useRef, useState } from 'react';
import type { AttemptState } from '@openstax/cutie-core';
import { mountItem } from '@openstax/cutie-client';
import type { MountedItem, ResponseData } from '@openstax/cutie-client';

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
    <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
  </svg>
);

interface PreviewTabProps {
  attemptState: AttemptState | null;
  sanitizedTemplate: string;
  responses: ResponseData | null;
  onSubmitResponses: (responses: ResponseData) => void;
  onResetAttempt: () => void;
}

export function PreviewTab({ attemptState, sanitizedTemplate, responses, onSubmitResponses, onResetAttempt }: PreviewTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const mountedItemRef = useRef<MountedItem | null>(null);

  // Derived - no state needed
  const interactionsEnabled = !isSubmitting && attemptState?.completionStatus !== 'completed';

  // Mount/unmount item when sanitizedTemplate or attemptState changes
  // Including attemptState ensures the item remounts on reset (even if template is same)
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
  }, [sanitizedTemplate, attemptState]);

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
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {sidebarCollapsed && (
        <button
          className="sidebar-toggle floating"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </button>
      )}
      <div className="sidebar">
        <div className="header">
          <h2>Debug</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Close sidebar"
          >
            <MenuIcon />
          </button>
        </div>

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
