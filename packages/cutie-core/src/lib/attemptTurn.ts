import { AttemptState, FeedbackIdentity, ProcessingOptions } from '../types';
import { isTerminal } from './deliveryOptions';
import {
  buildTemplateDocument,
  collectVisibleFeedback,
  feedbackKey,
  serializeTemplate,
} from './renderTemplate';

/**
 * Result of attempt operations containing updated state and template.
 */
export interface AttemptResult {
  /**
   * Updated learner state after processing.
   * Should be persisted and passed to subsequent operations.
   */
  state: AttemptState;

  /**
   * Sanitized QTI XML template ready for client rendering.
   * Contains resolved variables, applied visibility rules, and
   * stripped sensitive content (response processing, correct answers, etc.).
   */
  template: string;

  /**
   * Whether this template shows the learner something the prior state's
   * template did not: a feedback element, a verdict, or a correct response.
   * Always false when nothing was submitted (beginning or resuming an attempt).
   */
  hasNewFeedback: boolean;
}

/**
 * Presents a state as it stands, with nothing submitted: used to begin and
 * resume an attempt.
 */
export async function presentState(
  itemDoc: Document,
  state: AttemptState,
  processing?: ProcessingOptions
): Promise<AttemptResult> {
  const template = await serializeTemplate(buildTemplateDocument(itemDoc, state), processing);
  return { state, template, hasNewFeedback: false };
}

/**
 * Completes a turn that moved the attempt from priorState to nextState
 * (a submission or an external score).
 *
 * Decides which feedback the attempt withholds, renders the next template, and
 * reports whether it shows the learner anything the prior template did not.
 */
export async function completeTurn(
  itemDoc: Document,
  priorState: AttemptState,
  nextState: AttemptState,
  processing?: ProcessingOptions
): Promise<AttemptResult> {
  const priorDoc = buildTemplateDocument(itemDoc, priorState);
  const state = decideWithheldFeedback(itemDoc, priorState, priorDoc, nextState);
  const nextDoc = buildTemplateDocument(itemDoc, state);

  const hasNewFeedback = hasNewReveals(priorDoc, nextDoc);
  const template = await serializeTemplate(nextDoc, processing);

  return { state, template, hasNewFeedback };
}

/**
 * Decides the feedback withheld from the learner in nextState.
 *
 * Under `showFeedback: false`, feedback that would appear once the attempt is
 * terminal (visible in the next template but not in the prior one) is withheld.
 * Earlier decisions carry forward, so withheld feedback stays withheld.
 * The decision is stored in the state so later renders apply it as-is.
 */
function decideWithheldFeedback(
  itemDoc: Document,
  priorState: AttemptState,
  priorDoc: Document,
  nextState: AttemptState
): AttemptState {
  const carried = priorState.withheldFeedback ?? [];

  if (nextState.options.showFeedback || !isTerminal(nextState)) {
    return withWithheldFeedback(nextState, carried);
  }

  const priorKeys = new Set(collectVisibleFeedback(priorDoc.documentElement).map(feedbackKey));
  const unfilteredDoc = buildTemplateDocument(itemDoc, withWithheldFeedback(nextState, carried));
  const appearing = collectVisibleFeedback(unfilteredDoc.documentElement).filter(
    (feedback) => !priorKeys.has(feedbackKey(feedback))
  );

  return withWithheldFeedback(nextState, uniqueFeedback([...carried, ...appearing]));
}

function withWithheldFeedback(state: AttemptState, withheld: FeedbackIdentity[]): AttemptState {
  const { withheldFeedback: _previous, ...rest } = state;
  return withheld.length > 0 ? { ...rest, withheldFeedback: withheld } : rest;
}

function uniqueFeedback(feedback: FeedbackIdentity[]): FeedbackIdentity[] {
  const byKey = new Map(feedback.map((identity) => [feedbackKey(identity), identity]));
  return Array.from(byKey.values());
}

/**
 * Whether nextDoc reveals anything priorDoc did not: a feedback element
 * (by tag, outcome-identifier and identifier), a verdict, or a correct response.
 * Changes inside content that stays visible do not count.
 */
function hasNewReveals(priorDoc: Document, nextDoc: Document): boolean {
  const priorReveals = collectReveals(priorDoc.documentElement);
  return collectReveals(nextDoc.documentElement).some((reveal) => !priorReveals.includes(reveal));
}

function collectReveals(root: Element): string[] {
  const feedback = collectVisibleFeedback(root).map((identity) => `feedback:${feedbackKey(identity)}`);

  const evaluations = Array.from(root.getElementsByTagName('*'))
    .filter((element) => element.hasAttribute('data-evaluation'))
    .map((element) => `evaluation:${element.getAttribute('response-identifier') ?? ''}`);

  const correctResponses = Array.from(root.getElementsByTagName('qti-correct-response')).map(
    (element) => `correct-response:${(element.parentNode as Element | null)?.getAttribute('identifier') ?? ''}`
  );

  return [...feedback, ...evaluations, ...correctResponses];
}
