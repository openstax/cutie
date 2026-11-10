/**
 * Shared helpers for drawing the evaluation cutie-core adds to the template:
 * the verdict on the item as a whole (itemVerdict), and each interaction's
 * correct response (correctAnswerDisplay).
 */
export {
  cloneLabel,
  createCorrectAnswer,
  createCorrectAnswerOverline,
  createCorrectAnswerSummary,
  createIncorrectAnswerOverline,
  createSrText,
  type CorrectAnswerSummaryOptions,
  parseDirectedPair,
  readCorrectResponse,
  registerCorrectAnswerStyles,
  wrapInlineCorrectAnswer,
} from './correctAnswerDisplay.js';
export { createItemVerdict, getVerdict, type Verdict } from './itemVerdict.js';
