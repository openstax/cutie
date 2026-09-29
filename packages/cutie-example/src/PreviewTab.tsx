import { useRef, useState } from 'react';
import type { AttemptState } from '@openstax/cutie-core';
import type { MountItemOptions, ResponseData } from '@openstax/cutie-client';
import { CutieItemView } from './CutieItemView';
import type { CutieItemHandle } from './CutieItemView';
import { isEffectivelyEmptyTemplate } from './utils/qtiUtils';
import { TopicScores } from './TopicScores';
import { DeliveryOptionsPanel } from './DeliveryOptionsPanel';
import type { ResolvedDeliveryOptions } from './utils/deliveryOptions';

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
    <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
  </svg>
);

interface QuizModeProps {
  onNext: () => void;
  onEnd: () => void;
  isLoadingNext: boolean;
  history: {
    topic: string;
    questions: { result: 'correct' | 'incorrect' | 'partial-credit' }[];
  }[];
  currentQuiz: {
    topic: string;
    questions: { result?: 'correct' | 'incorrect' | 'partial-credit' }[];
  } | null;
}

interface PreviewTabProps {
  attemptState: AttemptState | null;
  sanitizedTemplate: string;
  hasNewFeedback: boolean;
  responses: ResponseData | null;
  deliveryOptions: ResolvedDeliveryOptions;
  onDeliveryOptionsChange: (options: ResolvedDeliveryOptions) => void;
  onSubmitResponses: (responses: ResponseData) => Promise<void>;
  onResetAttempt: () => void;
  isLoading?: boolean;
  onOpenGenerateDialog?: () => void;
  quizMode?: QuizModeProps;
  themeOptions?: MountItemOptions;
}

export function PreviewTab({ attemptState, sanitizedTemplate, hasNewFeedback, responses, deliveryOptions, onDeliveryOptionsChange, onSubmitResponses, onResetAttempt, isLoading, onOpenGenerateDialog, quizMode, themeOptions }: PreviewTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const itemRef = useRef<CutieItemHandle>(null);

  // Derived - no state needed
  const interactionsEnabled = !isSubmitting && attemptState?.completionStatus !== 'completed';

  const handleSubmit = async () => {
    const collectedResponses = itemRef.current?.collectResponses();
    if (!collectedResponses) return; // validation failed, handlers decorated their UI

    setIsSubmitting(true);
    try {
      await onSubmitResponses(collectedResponses);
    } finally {
      setIsSubmitting(false);
    }
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

        <DeliveryOptionsPanel options={deliveryOptions} onChange={onDeliveryOptionsChange} />

        <details className="panel" open>
          <summary>
            <h2>Latest Result</h2>
          </summary>
          <pre className="output-display">
            {attemptState ? JSON.stringify({ hasNewFeedback }, null, 2) : 'No result yet'}
          </pre>
        </details>

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
        {isLoading ? (
          <div className="preview-empty-state">
            <div className="loading-spinner" />
            <p>Generating your question...</p>
          </div>
        ) : isEffectivelyEmptyTemplate(sanitizedTemplate) ? (
          <div className="preview-empty-state">
            <p>No question loaded yet.</p>
            <p className="empty-state-hint">
              Load an example, paste XML in the XML tab, or try AI-powered quiz mode.
            </p>
            {onOpenGenerateDialog && (
              <button className="process-button" onClick={onOpenGenerateDialog}>
                ✨ Generate with AI
              </button>
            )}
          </div>
        ) : (
          <div className="preview-card">
            <CutieItemView
              ref={itemRef}
              template={sanitizedTemplate}
              attemptState={attemptState}
              interactionsEnabled={interactionsEnabled}
              themeOptions={themeOptions}
            />
            {attemptState?.completionStatus === 'completed' && attemptState.score && (
              <div className="score-display">
                <span>Score: {attemptState.score.raw} / {attemptState.score.max}</span>
                {attemptState.comments && (
                  <div className="scoring-rationale">
                    <strong>Scoring Rationale:</strong> {attemptState.comments}
                  </div>
                )}
              </div>
            )}
            <div className="preview-buttons">
              <button
                className="process-button"
                onClick={handleSubmit}
                disabled={!sanitizedTemplate || !interactionsEnabled}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              {quizMode ? (
                <>
                  <button
                    className="process-button"
                    onClick={quizMode.onNext}
                    disabled={attemptState?.completionStatus !== 'completed' || quizMode.isLoadingNext}
                  >
                    {quizMode.isLoadingNext ? 'Loading...' : 'Next'}
                  </button>
                  <button
                    className="cancel-button"
                    onClick={quizMode.onEnd}
                    disabled={quizMode.isLoadingNext}
                  >
                    End Quiz
                  </button>
                </>
              ) : (
                <button
                  className="process-button"
                  onClick={onResetAttempt}
                  disabled={!attemptState}
                >
                  Reset
                </button>
              )}
            </div>
            {quizMode && (
              <TopicScores history={quizMode.history} currentQuiz={quizMode.currentQuiz} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
