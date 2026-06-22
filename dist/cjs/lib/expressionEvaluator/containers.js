"use strict";
/**
 * Container operators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateMultiple = evaluateMultiple;
exports.evaluateOrdered = evaluateOrdered;
exports.evaluateContainerSize = evaluateContainerSize;
exports.evaluateRepeat = evaluateRepeat;
exports.evaluateDelete = evaluateDelete;
exports.evaluateMember = evaluateMember;
exports.evaluateContains = evaluateContains;
exports.evaluateIndex = evaluateIndex;
const dom_1 = require("../../utils/dom");
const equality_1 = require("../../utils/equality");
/**
 * Evaluate qti-multiple element (unordered container)
 */
function evaluateMultiple(element, itemDoc, variables, subEvaluate) {
    const values = [];
    for (const child of (0, dom_1.getChildElements)(element)) {
        const value = subEvaluate(child, itemDoc, variables);
        if (Array.isArray(value)) {
            values.push(...value);
        }
        else {
            values.push(value);
        }
    }
    return values;
}
/**
 * Evaluate qti-ordered element (ordered container)
 */
function evaluateOrdered(element, itemDoc, variables, subEvaluate) {
    return evaluateMultiple(element, itemDoc, variables, subEvaluate);
}
/**
 * Evaluate qti-container-size element
 */
function evaluateContainerSize(element, itemDoc, variables, subEvaluate) {
    for (const child of (0, dom_1.getChildElements)(element)) {
        const container = subEvaluate(child, itemDoc, variables);
        if (!Array.isArray(container)) {
            throw new Error(`Expected array value in <qti-container-size>, got ${typeof container}`);
        }
        return container.length;
    }
    return 0;
}
/**
 * Evaluate qti-repeat element
 */
function evaluateRepeat(element, itemDoc, variables, subEvaluate) {
    const numberRepeats = parseInt(element.getAttribute('number-repeats') || '1', 10);
    const result = [];
    const children = Array.from((0, dom_1.getChildElements)(element));
    if (children.length !== 1) {
        throw new Error('<qti-repeat> requires exactly 1 child element');
    }
    const value = subEvaluate(children[0], itemDoc, variables);
    for (let j = 0; j < numberRepeats; j++) {
        result.push(value);
    }
    return result;
}
/**
 * Evaluate qti-delete element
 *
 * Per QTI spec: The first sub-expression must have single cardinality (value to delete)
 * and the second must be a multiple or ordered container. The result is a new container
 * derived from the second sub-expression with all instances of the first sub-expression removed.
 */
function evaluateDelete(element, itemDoc, variables, subEvaluate) {
    const values = [];
    for (const child of (0, dom_1.getChildElements)(element)) {
        values.push(subEvaluate(child, itemDoc, variables));
    }
    if (values.length >= 2) {
        const valueToDelete = values[0];
        const container = values[1];
        if (Array.isArray(container)) {
            return container.filter(item => !(0, equality_1.deepEqual)(item, valueToDelete));
        }
    }
    return [];
}
/**
 * Evaluate qti-member element
 */
function evaluateMember(element, itemDoc, variables, subEvaluate) {
    const children = Array.from((0, dom_1.getChildElements)(element));
    if (children.length !== 2) {
        throw new Error('<qti-member> requires exactly 2 operands');
    }
    const value = subEvaluate(children[0], itemDoc, variables);
    const container = subEvaluate(children[1], itemDoc, variables);
    if (!Array.isArray(container)) {
        throw new Error(`Expected array value in <qti-member>, got ${typeof container}`);
    }
    return container.some(item => (0, equality_1.deepEqual)(item, value));
}
/**
 * Evaluate qti-contains element
 */
function evaluateContains(element, itemDoc, variables, subEvaluate) {
    const children = Array.from((0, dom_1.getChildElements)(element));
    if (children.length !== 2) {
        throw new Error('<qti-contains> requires exactly 2 operands');
    }
    const container = subEvaluate(children[0], itemDoc, variables);
    const value = subEvaluate(children[1], itemDoc, variables);
    if (!Array.isArray(container)) {
        throw new Error(`Expected array value in <qti-contains>, got ${typeof container}`);
    }
    return container.some(item => (0, equality_1.deepEqual)(item, value));
}
/**
 * Evaluate qti-index element
 */
function evaluateIndex(element, itemDoc, variables, subEvaluate) {
    const n = parseInt(element.getAttribute('n') || '1', 10);
    const children = Array.from((0, dom_1.getChildElements)(element));
    if (children.length !== 1) {
        throw new Error('<qti-index> requires exactly 1 child element');
    }
    const container = subEvaluate(children[0], itemDoc, variables);
    if (!Array.isArray(container)) {
        throw new Error(`Expected array value in <qti-index>, got ${typeof container}`);
    }
    // QTI indices are 1-based
    const index = n - 1;
    if (index < 0 || index >= container.length) {
        return null;
    }
    return container[index];
}
