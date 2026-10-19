import type { AttemptState } from '@openstax/cutie-core';

/**
 * The learner-facing status of an attempt: tries remaining while it is in
 * progress, and the score once it is completed.
 */
export function AttemptStatus({ attemptState }: { attemptState: AttemptState | null }) {
  return (
    <>
      {attemptState && attemptState.completionStatus !== 'completed' && attemptState.triesAllowed > 1 && (
        // A status region, so screen readers hear the count change after each try
        <div className="tries-remaining" role="status">
          Try {attemptState.triesUsed + 1} of {attemptState.triesAllowed}
        </div>
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
    </>
  );
}
