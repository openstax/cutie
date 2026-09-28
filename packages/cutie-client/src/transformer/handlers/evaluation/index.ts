/**
 * Shared helpers for drawing the evaluation (verdict and correct response)
 * cutie-core adds to the template of a finished attempt.
 */
export {
  cloneLabel,
  createCorrectAnswer,
  createCorrectAnswerOverline,
  createEvaluationSummary,
  createVerdictMark,
  type EvaluationSummaryOptions,
  getVerdict,
  getVerdictText,
  type InteractionEvaluation,
  markEvaluated,
  parseDirectedPair,
  readEvaluation,
  registerEvaluationStyles,
  type Verdict,
  wrapInlineEvaluation,
} from './evaluationDisplay';
