import { AttemptState } from '../types.js';
import { isAdaptive } from './adaptive.js';
import { evaluateResponse, ResponseEvaluation } from './evaluateResponses.js';
import { resetOutcomeVariables } from './initializeState.js';
import { processFeedbackVisibility, processTemplateConditionals } from './visibility.js';

/**
 * The state a submission leaves the attempt in, and whether it ended a try.
 */
export interface TryOutcome {
  state: AttemptState;
  tryConsumed: boolean;
}

/**
 * Counts the try a processed submission ended, if any, and continues the
 * attempt with a fresh try when that try fell short and tries remain.
 *
 * A try ends when response processing completes the item. Resubmitting while
 * a try awaits manual scoring edits that try rather than ending another.
 * Once the attempt is terminal, no tries remain. Within a fresh try, the last
 * try's verdict and score stand until the try ends.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param priorState - The state the submission was made to
 * @param processedState - The state response processing produced
 */
export function endTry(itemDoc: Document, priorState: AttemptState, processedState: AttemptState): TryOutcome {
  if (processedState.completionStatus !== 'completed' || priorState.pendingManualScoring) {
    return { state: continueTry(priorState, processedState), tryConsumed: false };
  }

  const triesUsed = priorState.triesUsed + 1;
  const terminal: TryOutcome = {
    state: { ...processedState, triesUsed, triesRemaining: 0 },
    tryConsumed: true,
  };

  const triesRemaining = priorState.triesRemaining - 1;
  if (triesRemaining <= 0 || processedState.pendingManualScoring) return terminal;

  const verdict = evaluateTry(itemDoc, processedState);
  if (verdict !== 'incorrect' && verdict !== 'partial') return terminal;

  return {
    state: beginNextTry(itemDoc, { ...processedState, triesUsed, triesRemaining }, verdict),
    tryConsumed: true,
  };
}

/**
 * A submission that doesn't end a try. Within a fresh try, the last try's
 * verdict and score stand: the score response processing produced belongs to
 * a try still in progress.
 */
function continueTry(priorState: AttemptState, processedState: AttemptState): AttemptState {
  if (!priorState.retryVerdict) return processedState;
  return { ...processedState, score: priorState.score, retryVerdict: priorState.retryVerdict };
}

/**
 * Judges a finished try as a whole: by its score when the item's maximum is
 * known, otherwise by the verdicts of the responses the interactions shown to
 * the learner collect (see evaluateResponse). A try is only correct when every one of those
 * responses was judged correct. Null when neither can judge it.
 */
export function evaluateTry(itemDoc: Document, state: AttemptState): ResponseEvaluation | null {
  if (state.score) {
    const { raw, max } = state.score;
    if (max <= 0) return null;
    if (raw >= max) return 'correct';
    return raw <= 0 ? 'incorrect' : 'partial';
  }

  const evaluations = shownResponseIdentifiers(itemDoc, state.variables).map((identifier) =>
    evaluateResponse(itemDoc, identifier, state.variables)
  );
  const verdicts = evaluations.filter((verdict): verdict is ResponseEvaluation => verdict !== null);

  if (verdicts.length === 0) return null;
  if (verdicts.every((verdict) => verdict === 'correct')) {
    // A response that can't be judged might not be correct
    return verdicts.length === evaluations.length ? 'correct' : null;
  }
  if (verdicts.every((verdict) => verdict === 'incorrect')) return 'incorrect';
  return 'partial';
}

/**
 * The responses the interactions shown for these variables collect: an
 * interaction inside hidden feedback (an adaptive item's step not taken)
 * collects nothing to judge.
 */
function shownResponseIdentifiers(itemDoc: Document, variables: Record<string, unknown>): string[] {
  const authoredBody = itemDoc.getElementsByTagName('qti-item-body')[0];
  if (!authoredBody) return [];

  const itemBody = authoredBody.cloneNode(true) as Element;
  processTemplateConditionals(itemBody, variables);
  processFeedbackVisibility(itemBody, variables);

  const identifiers = Array.from(itemBody.getElementsByTagName('*'))
    .map((element) => element.getAttribute('response-identifier'))
    .filter((identifier): identifier is string => !!identifier);
  return Array.from(new Set(identifiers));
}

/**
 * Starts a fresh try after one that fell short.
 *
 * Template variables, template processing's results, shuffle orders and
 * delivery options carry over, so the learner sees the same variant.
 * Outcomes and numAttempts start over, so no
 * feedback from the last try shows. A non-adaptive item keeps the learner's
 * responses; an adaptive item, whose responses belong to steps it has moved
 * past, starts over entirely. The score stays the last try's until the next
 * try ends.
 */
function beginNextTry(
  itemDoc: Document,
  ended: AttemptState,
  verdict: 'incorrect' | 'partial'
): AttemptState {
  const variables = { ...ended.variables };

  resetOutcomeVariables(itemDoc, variables, ended.defaultValues);
  delete variables.completionStatus;
  variables.numAttempts = 0;

  // An adaptive item's responses start over as they began: without a value,
  // or with the default template processing set
  if (isAdaptive(itemDoc)) {
    for (const identifier of responseIdentifiers(itemDoc)) {
      delete variables[identifier];
      if (ended.defaultValues && identifier in ended.defaultValues) {
        variables[identifier] = ended.defaultValues[identifier];
      }
    }
  }

  return {
    variables,
    completionStatus: 'incomplete',
    score: ended.score,
    options: ended.options,
    ...(ended.shuffleOrders && { shuffleOrders: ended.shuffleOrders }),
    ...(ended.correctResponses && { correctResponses: ended.correctResponses }),
    ...(ended.defaultValues && { defaultValues: ended.defaultValues }),
    triesAllowed: ended.triesAllowed,
    triesUsed: ended.triesUsed,
    triesRemaining: ended.triesRemaining,
    retryVerdict: verdict,
  };
}

function responseIdentifiers(itemDoc: Document): string[] {
  return Array.from(itemDoc.getElementsByTagName('qti-response-declaration'))
    .map((declaration) => declaration.getAttribute('identifier'))
    .filter((identifier): identifier is string => !!identifier);
}
