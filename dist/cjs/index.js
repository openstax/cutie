"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseValidationError = void 0;
exports.beginAttempt = beginAttempt;
exports.submitResponse = submitResponse;
exports.setScore = setScore;
const xmldom_1 = require("@xmldom/xmldom");
const deriveMaxScore_1 = require("./lib/deriveMaxScore");
const initializeState_1 = require("./lib/initializeState");
const renderTemplate_1 = require("./lib/renderTemplate");
const responseProcessing_1 = require("./lib/responseProcessing");
const scoreUtils_1 = require("./lib/scoreUtils");
const validateResponses_1 = require("./lib/validateResponses");
/**
 * Initializes a new attempt at a QTI assessment item.
 *
 * Creates the initial learner state with default values and renders
 * the first template with any randomized template variables resolved.
 *
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to initial state and sanitized template XML
 *
 * @example
 * ```typescript
 * const { state, template } = await beginAttempt(itemXml);
 * // Persist state, send template to client for rendering
 * ```
 */
async function beginAttempt(itemXml, options) {
    // Parse the QTI XML document
    const parser = new xmldom_1.DOMParser();
    const itemDoc = parser.parseFromString(itemXml.trim(), 'text/xml');
    // Initialize state by processing template declarations and template processing
    const state = (0, initializeState_1.initializeState)(itemDoc);
    // Render the sanitized template with resolved variables
    const template = await (0, renderTemplate_1.renderTemplate)(itemDoc, state, options);
    return { state, template };
}
/**
 * Processes a response submission and updates the attempt state.
 *
 * Runs response processing to score the submission, update outcome variables,
 * and determine completion status. Then generates an updated template with
 * any newly visible feedback or content changes.
 *
 * @param submission - Learner's response data (response IDs mapped to values)
 * @param state - Current attempt state from previous operation
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to updated state and sanitized template XML
 *
 * @example
 * ```typescript
 * const submission = { RESPONSE_1: 'choiceA', RESPONSE_2: [1, 3] };
 * const { state, template } = await submitResponse(submission, currentState, itemXml);
 *
 * // Check if attempt is complete
 * if (state.completionStatus === 'completed') {
 *   // End session, show final results
 * }
 * ```
 */
async function submitResponse(submission, state, itemXml, options) {
    // Parse the QTI XML document
    const parser = new xmldom_1.DOMParser();
    const itemDoc = parser.parseFromString(itemXml.trim(), 'text/xml');
    // Validate response constraints before processing
    (0, validateResponses_1.validateSubmission)(submission, itemDoc);
    // Process the response submission to update state
    const updatedState = (0, responseProcessing_1.processResponse)(itemDoc, submission, state);
    // Render the updated template with new state (feedback may now be visible)
    const template = await (0, renderTemplate_1.renderTemplate)(itemDoc, updatedState, options);
    return { state: updatedState, template };
}
/**
 * Applies an externally-determined score to an attempt state.
 *
 * Used after `submitResponse` returns a state with `pendingManualScoring`
 * to finalize the score (e.g., after AI or human grading). Clears the
 * `pendingManualScoring` flag and re-renders the template so that any
 * score-based feedback becomes visible.
 *
 * @param score - The score awarded by the external scorer
 * @param comments - Feedback or comments from the external scorer
 * @param state - Current attempt state (should have `pendingManualScoring`)
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to updated state and sanitized template XML
 */
async function setScore(score, comments, state, itemXml, options) {
    const parser = new xmldom_1.DOMParser();
    const itemDoc = parser.parseFromString(itemXml.trim(), 'text/xml');
    const maxScore = (0, deriveMaxScore_1.deriveMaxScore)(itemDoc, state.variables);
    if (maxScore === null) {
        throw new Error('Cannot determine max score for item');
    }
    const updatedState = {
        ...state,
        variables: { ...state.variables, SCORE: score },
        score: (0, scoreUtils_1.buildScore)(score, maxScore),
        comments,
        pendingManualScoring: undefined,
    };
    const template = await (0, renderTemplate_1.renderTemplate)(itemDoc, updatedState, options);
    return { state: updatedState, template };
}
var validateResponses_2 = require("./lib/validateResponses");
Object.defineProperty(exports, "ResponseValidationError", { enumerable: true, get: function () { return validateResponses_2.ResponseValidationError; } });
