/**
 * Shared helpers for drawing the evaluation cutie-core adds to the template of
 * a finished attempt: the item's verdict and each interaction's correct response.
 */
export {
  cloneLabel,
  createCorrectAnswer,
  createCorrectAnswerOverline,
  createEvaluationSummary,
  createIncorrectAnswerOverline,
  createSrText,
  type EvaluationSummaryOptions,
  getVerdict,
  type InteractionEvaluation,
  parseDirectedPair,
  readEvaluation,
  registerEvaluationStyles,
  type Verdict,
  wrapInlineEvaluation,
} from './evaluationDisplay.js';
export { createItemVerdict } from './itemVerdict.js';
