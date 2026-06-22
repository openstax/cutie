/**
 * Comparison operators
 */
import { getChildElements } from '../../utils/dom';
import { deepEqual, deepEqualUnordered } from '../../utils/equality';
import { compareMathExpressions } from './math';
/**
 * Helper to find a response identifier from qti-variable or qti-correct children
 */
function findResponseIdentifier(children) {
    for (const child of children) {
        const localName = child.localName;
        if (localName === 'qti-variable' || localName === 'qti-correct') {
            const identifier = child.getAttribute('identifier');
            if (identifier)
                return identifier;
        }
    }
    return null;
}
/**
 * Get the cardinality of a response declaration
 */
function getResponseCardinality(itemDoc, identifier) {
    const declarations = itemDoc.getElementsByTagName('qti-response-declaration');
    for (let i = 0; i < declarations.length; i++) {
        const decl = declarations[i];
        if (decl.getAttribute('identifier') === identifier) {
            return decl.getAttribute('cardinality') || 'single';
        }
    }
    return 'single';
}
/**
 * Get formula comparison mode from response declaration if it's a formula response
 */
function getFormulaMode(itemDoc, identifier) {
    const declarations = itemDoc.getElementsByTagName('qti-response-declaration');
    for (let i = 0; i < declarations.length; i++) {
        const decl = declarations[i];
        if (decl.getAttribute('identifier') === identifier) {
            const responseType = decl.getAttribute('data-response-type');
            if (responseType === 'formula') {
                const mode = decl.getAttribute('data-comparison-mode');
                if (mode === 'strict' || mode === 'canonical' || mode === 'algebraic') {
                    return mode;
                }
                return 'canonical'; // Default mode
            }
            break;
        }
    }
    return null;
}
/**
 * Evaluate qti-lt (less than) element
 */
export function evaluateLessThan(element, itemDoc, variables, subEvaluate) {
    const children = Array.from(getChildElements(element));
    if (children.length !== 2) {
        throw new Error('<qti-lt> requires exactly 2 operands');
    }
    const a = subEvaluate(children[0], itemDoc, variables);
    const b = subEvaluate(children[1], itemDoc, variables);
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error(`Expected number values in <qti-lt>, got ${typeof a} and ${typeof b}`);
    }
    return a < b;
}
/**
 * Evaluate qti-gt (greater than) element
 */
export function evaluateGreaterThan(element, itemDoc, variables, subEvaluate) {
    const children = Array.from(getChildElements(element));
    if (children.length !== 2) {
        throw new Error('<qti-gt> requires exactly 2 operands');
    }
    const a = subEvaluate(children[0], itemDoc, variables);
    const b = subEvaluate(children[1], itemDoc, variables);
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error(`Expected number values in <qti-gt>, got ${typeof a} and ${typeof b}`);
    }
    return a > b;
}
/**
 * Evaluate qti-lte (less than or equal) element
 */
export function evaluateLessThanOrEqual(element, itemDoc, variables, subEvaluate) {
    const children = Array.from(getChildElements(element));
    if (children.length !== 2) {
        throw new Error('<qti-lte> requires exactly 2 operands');
    }
    const a = subEvaluate(children[0], itemDoc, variables);
    const b = subEvaluate(children[1], itemDoc, variables);
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error(`Expected number values in <qti-lte>, got ${typeof a} and ${typeof b}`);
    }
    return a <= b;
}
/**
 * Evaluate qti-gte (greater than or equal) element
 */
export function evaluateGreaterThanOrEqual(element, itemDoc, variables, subEvaluate) {
    const children = Array.from(getChildElements(element));
    if (children.length !== 2) {
        throw new Error('<qti-gte> requires exactly 2 operands');
    }
    const a = subEvaluate(children[0], itemDoc, variables);
    const b = subEvaluate(children[1], itemDoc, variables);
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error(`Expected number values in <qti-gte>, got ${typeof a} and ${typeof b}`);
    }
    return a >= b;
}
/**
 * Evaluate qti-equal element
 */
export function evaluateEqual(element, itemDoc, variables, subEvaluate) {
    const children = Array.from(getChildElements(element));
    if (children.length !== 2) {
        throw new Error('<qti-equal> requires exactly 2 operands');
    }
    const a = subEvaluate(children[0], itemDoc, variables);
    const b = subEvaluate(children[1], itemDoc, variables);
    // For numeric values, use numeric comparison
    if (typeof a === 'number' && typeof b === 'number') {
        const tolerance = element.getAttribute('tolerance-mode');
        if (tolerance === 'exact' || !tolerance) {
            return a === b;
        }
        // TODO: Implement other tolerance modes (absolute, relative)
        return a === b;
    }
    // For other types, use deep equality
    return deepEqual(a, b);
}
/**
 * Evaluate qti-match element
 *
 * This uses the enhanced version from responseProcessing that detects qti-multiple
 * containers and uses the appropriate equality function (ordered vs unordered).
 * Since qti-multiple is valid in both template and response contexts, this works for both.
 *
 * For formula responses (data-response-type="formula" on the response declaration),
 * uses Compute Engine for mathematical comparison based on data-comparison-mode.
 */
export function evaluateMatch(element, itemDoc, variables, subEvaluate) {
    var _a, _b, _c, _d;
    const values = [];
    const childElements = [];
    for (const child of getChildElements(element)) {
        childElements.push(child);
        values.push(subEvaluate(child, itemDoc, variables));
    }
    if (values.length >= 2) {
        // Check if either value comes from a qti-multiple container (unordered)
        const isFirstMultiple = ((_a = childElements[0]) === null || _a === void 0 ? void 0 : _a.localName) === 'qti-multiple';
        const isSecondMultiple = ((_b = childElements[1]) === null || _b === void 0 ? void 0 : _b.localName) === 'qti-multiple';
        // If either is explicitly multiple (unordered), use unordered comparison
        if (isFirstMultiple || isSecondMultiple) {
            return deepEqualUnordered(values[0], values[1]);
        }
        // Check if this is a formula response that needs math comparison
        const responseId = findResponseIdentifier(childElements);
        if (responseId) {
            const formulaMode = getFormulaMode(itemDoc, responseId);
            if (formulaMode) {
                return compareMathExpressions(String((_c = values[0]) !== null && _c !== void 0 ? _c : ''), String((_d = values[1]) !== null && _d !== void 0 ? _d : ''), formulaMode);
            }
            // Multiple cardinality responses are unordered sets per QTI spec
            if (getResponseCardinality(itemDoc, responseId) === 'multiple') {
                return deepEqualUnordered(values[0], values[1]);
            }
        }
        return deepEqual(values[0], values[1]);
    }
    return false;
}
