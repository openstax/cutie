import { useRef, useState } from 'react';
import type { AttemptResult, AttemptState } from '@openstax/cutie-core';
import type { MountItemOptions, ResponseData } from '@openstax/cutie-client';
import { CutieItemView } from './CutieItemView';
import type { CutieItemHandle } from './CutieItemView';
import { isEffectivelyEmptyTemplate } from './utils/qtiUtils';
import { TopicScores } from './TopicScores';
import { DeliveryOptionsPanel } from './DeliveryOptionsPanel';
import { EmptyState } from './EmptyState';
import { SidebarLayout } from './SidebarLayout';
import type { ResolvedDeliveryOptions } from './utils/deliveryOptions';

/** The flags of the latest attempt operation's result */
export type LatestResult = Pick<AttemptResult, 'hasNewFeedback' | 'tryConsumed'>;

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

interface TestTabProps {
  attemptState: AttemptState | null;
  sanitizedTemplate: string;
  latestResult: LatestResult;
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

/**
 * Tests the item as a learner would take it: an attempt, with submissions.
 */
export function TestTab({ attemptState, sanitizedTemplate, latestResult, responses, deliveryOptions, onDeliveryOptionsChange, onSubmitResponses, onResetAttempt, isLoading, onOpenGenerateDialog, quizMode, themeOptions }: TestTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemRef = useRef<CutieItemHandle>(null);

  // Derived - no state needed
  // A finished attempt takes no more submissions, except that a response
  // awaiting manual scoring can still be edited and resubmitted
  const acceptsResponses = attemptState?.completionStatus !== 'completed' || !!attemptState.pendingManualScoring;
  const interactionsEnabled = !isSubmitting && acceptsResponses;

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
    <SidebarLayout
      sidebar={
        <>
          <DeliveryOptionsPanel options={deliveryOptions} onChange={onDeliveryOptionsChange} />

          <details className="panel" open>
            <summary>
              <h2>Latest Result</h2>
            </summary>
            <pre className="output-display">
              {attemptState ? JSON.stringify(latestResult, null, 2) : 'No result yet'}
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
        </>
      }
    >
      {isLoading ? (
        <div className="empty-state">
          <div className="loading-spinner" />
          <p>Generating your question...</p>
        </div>
      ) : isEffectivelyEmptyTemplate(sanitizedTemplate) ? (
        <EmptyState onOpenGenerateDialog={onOpenGenerateDialog} />
      ) : (
        <div className="item-card">
          <CutieItemView
            ref={itemRef}
            template={sanitizedTemplate}
            attemptState={attemptState}
            interactionsEnabled={interactionsEnabled}
            themeOptions={themeOptions}
          />
          {attemptState && attemptState.completionStatus !== 'completed' && attemptState.options.maxTries !== 1 && (
            // A status region, so screen readers hear the count change after each try
            <div className="tries-remaining" role="status">Tries remaining: {attemptState.triesRemaining}</div>
          )}
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
          <div className="item-buttons">
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
    </SidebarLayout>
  );
}
