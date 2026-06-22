"use strict";
/**
 * Shared expression evaluator for QTI expression evaluation
 *
 * This module contains common operators used by both template processing
 * (initializeState) and response processing contexts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateExpression = evaluateExpression;
// Import all operator handlers
const arithmetic_1 = require("./arithmetic");
const base_1 = require("./base");
const comparison_1 = require("./comparison");
const containers_1 = require("./containers");
const logical_1 = require("./logical");
const record_1 = require("./record");
const string_1 = require("./string");
const utility_1 = require("./utility");
/**
 * Evaluate a QTI expression element
 *
 * This function handles common operators shared across template and response processing.
 * Domain-specific operators should be handled in their respective contexts before
 * falling through to this evaluator.
 *
 * @param element - The QTI expression element to evaluate
 * @param itemDoc - The item document (for DOM queries)
 * @param variables - Current variable bindings
 * @param subEvaluate - Recursive evaluation callback for child expressions
 * @returns The evaluated value
 * @throws Error if the operator is not recognized
 */
function evaluateExpression(element, itemDoc, variables, subEvaluate) {
    const localName = element.localName;
    switch (localName) {
        // Base values
        case 'qti-base-value':
            return (0, base_1.evaluateBaseValue)(element);
        case 'qti-null':
            return null;
        case 'qti-variable':
            return (0, base_1.evaluateVariable)(element, variables);
        // Containers
        case 'qti-multiple':
            return (0, containers_1.evaluateMultiple)(element, itemDoc, variables, subEvaluate);
        case 'qti-ordered':
            return (0, containers_1.evaluateOrdered)(element, itemDoc, variables, subEvaluate);
        case 'qti-container-size':
            return (0, containers_1.evaluateContainerSize)(element, itemDoc, variables, subEvaluate);
        case 'qti-repeat':
            return (0, containers_1.evaluateRepeat)(element, itemDoc, variables, subEvaluate);
        case 'qti-delete':
            return (0, containers_1.evaluateDelete)(element, itemDoc, variables, subEvaluate);
        case 'qti-member':
            return (0, containers_1.evaluateMember)(element, itemDoc, variables, subEvaluate);
        case 'qti-contains':
            return (0, containers_1.evaluateContains)(element, itemDoc, variables, subEvaluate);
        case 'qti-index':
            return (0, containers_1.evaluateIndex)(element, itemDoc, variables, subEvaluate);
        // Arithmetic operators
        case 'qti-sum':
            return (0, arithmetic_1.evaluateSum)(element, itemDoc, variables, subEvaluate);
        case 'qti-product':
            return (0, arithmetic_1.evaluateProduct)(element, itemDoc, variables, subEvaluate);
        case 'qti-subtract':
            return (0, arithmetic_1.evaluateSubtract)(element, itemDoc, variables, subEvaluate);
        case 'qti-divide':
            return (0, arithmetic_1.evaluateDivide)(element, itemDoc, variables, subEvaluate);
        case 'qti-integer-divide':
            return (0, arithmetic_1.evaluateIntegerDivide)(element, itemDoc, variables, subEvaluate);
        case 'qti-integer-modulus':
            return (0, arithmetic_1.evaluateIntegerModulus)(element, itemDoc, variables, subEvaluate);
        case 'qti-truncate':
            return (0, arithmetic_1.evaluateTruncate)(element, itemDoc, variables, subEvaluate);
        case 'qti-round':
            return (0, arithmetic_1.evaluateRound)(element, itemDoc, variables, subEvaluate);
        case 'qti-power':
            return (0, arithmetic_1.evaluatePower)(element, itemDoc, variables, subEvaluate);
        // Logical operators
        case 'qti-and':
            return (0, logical_1.evaluateAnd)(element, itemDoc, variables, subEvaluate);
        case 'qti-or':
            return (0, logical_1.evaluateOr)(element, itemDoc, variables, subEvaluate);
        case 'qti-not':
            return (0, logical_1.evaluateNot)(element, itemDoc, variables, subEvaluate);
        // Comparison operators
        case 'qti-lt':
            return (0, comparison_1.evaluateLessThan)(element, itemDoc, variables, subEvaluate);
        case 'qti-gt':
            return (0, comparison_1.evaluateGreaterThan)(element, itemDoc, variables, subEvaluate);
        case 'qti-lte':
            return (0, comparison_1.evaluateLessThanOrEqual)(element, itemDoc, variables, subEvaluate);
        case 'qti-gte':
            return (0, comparison_1.evaluateGreaterThanOrEqual)(element, itemDoc, variables, subEvaluate);
        case 'qti-equal':
            return (0, comparison_1.evaluateEqual)(element, itemDoc, variables, subEvaluate);
        case 'qti-match':
            return (0, comparison_1.evaluateMatch)(element, itemDoc, variables, subEvaluate);
        // String operators
        case 'qti-substring':
            return (0, string_1.evaluateSubstring)(element, itemDoc, variables, subEvaluate);
        case 'qti-string-match':
            return (0, string_1.evaluateStringMatch)(element, itemDoc, variables, subEvaluate);
        case 'qti-pattern-match':
            return (0, string_1.evaluatePatternMatch)(element, itemDoc, variables, subEvaluate);
        // Record operators
        case 'qti-record':
            return (0, record_1.evaluateRecord)(element, itemDoc, variables, subEvaluate);
        case 'qti-field-value':
            return (0, record_1.evaluateFieldValue)(element, itemDoc, variables, subEvaluate);
        // Utility operators
        case 'qti-integer-to-float':
            return (0, utility_1.evaluateIntegerToFloat)(element, itemDoc, variables, subEvaluate);
        case 'qti-any-n':
            return (0, utility_1.evaluateAnyN)(element, itemDoc, variables, subEvaluate);
        case 'qti-is-null':
            return (0, utility_1.evaluateIsNull)(element, itemDoc, variables, subEvaluate);
        case 'qti-random':
            return (0, utility_1.evaluateRandom)(element, itemDoc, variables, subEvaluate);
        case 'qti-random-integer':
            return (0, utility_1.evaluateRandomInteger)(element);
        case 'qti-random-float':
            return (0, utility_1.evaluateRandomFloat)(element);
        default:
            throw new Error(`Unsupported expression type: ${localName}`);
    }
}
