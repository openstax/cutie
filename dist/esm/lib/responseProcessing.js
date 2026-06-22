import { getChildElements, getFirstChildElement } from '../utils/dom';
import { deepEqual, deepEqualUnordered } from '../utils/equality';
import { parseResponseValue } from '../utils/typeParser';
import { evaluateExpression as evaluateExpressionShared, } from './expressionEvaluator/index';
import { compareMathExpressions } from './expressionEvaluator/math';
import { getExternalScoredInfo } from './externalScoring';
import { extractStandardOutcomes } from './scoreUtils';
/**
 * Coerce a submitted response value to match the expected type from the response declaration.
 * This handles string values submitted from text inputs that need to be converted to numbers.
 */
function coerceResponseValue(itemDoc, identifier, value) {
    // If value is null/undefined or already a number, no coercion needed for numeric types
    if (value === null || value === undefined) {
        return value;
    }
    // Find the response declaration to get the base-type
    const declarations = itemDoc.getElementsByTagName('qti-response-declaration');
    let baseType = null;
    for (let i = 0; i < declarations.length; i++) {
        const decl = declarations[i];
        if (decl.getAttribute('identifier') === identifier) {
            baseType = decl.getAttribute('base-type');
            break;
        }
    }
    // If no declaration found or no base-type, return value as-is
    if (!baseType) {
        return value;
    }
    // Coerce string values to numbers for numeric types
    if (typeof value === 'string') {
        if (baseType === 'integer') {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? value : parsed;
        }
        if (baseType === 'float') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? value : parsed;
        }
    }
    return value;
}
/**
 * Get metadata from a response declaration (data-* attributes)
 */
function getResponseDeclarationMeta(itemDoc, identifier) {
    const declarations = itemDoc.getElementsByTagName('qti-response-declaration');
    for (let i = 0; i < declarations.length; i++) {
        const decl = declarations[i];
        if (decl.getAttribute('identifier') === identifier) {
            return {
                responseType: decl.getAttribute('data-response-type'),
                comparisonMode: decl.getAttribute('data-comparison-mode'),
            };
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
 * Compare response values, using formula comparison when appropriate
 *
 * This is the single source of truth for response comparison. It detects
 * formula responses via data-response-type="formula" and routes to
 * Compute Engine comparison with the specified mode.
 */
export function compareResponseValues(itemDoc, responseIdentifier, responseValue, correctValue) {
    const meta = getResponseDeclarationMeta(itemDoc, responseIdentifier);
    if ((meta === null || meta === void 0 ? void 0 : meta.responseType) === 'formula') {
        const mode = (meta.comparisonMode || 'canonical');
        return compareMathExpressions(String(responseValue !== null && responseValue !== void 0 ? responseValue : ''), String(correctValue !== null && correctValue !== void 0 ? correctValue : ''), mode);
    }
    // Multiple cardinality responses are unordered sets; order should not matter
    const cardinality = getResponseCardinality(itemDoc, responseIdentifier);
    if (cardinality === 'multiple') {
        return deepEqualUnordered(responseValue, correctValue);
    }
    return deepEqual(responseValue, correctValue);
}
/**
 * Processes a response submission by executing response processing rules
 * from a QTI assessment item.
 *
 * This function:
 * 1. Updates response variables with submitted values
 * 2. Executes qti-response-processing rules to score the response
 * 3. Updates outcome variables (SCORE, completionStatus, numAttempts, etc.)
 * 4. Returns updated attempt state
 *
 * Response processing runs on every submission during an attempt.
 * Template variables are not modified - they remain constant.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param submission - Learner's response data (response IDs mapped to values)
 * @param currentState - Current attempt state before this submission
 * @returns Updated attempt state after processing the response
 */
export function processResponse(itemDoc, submission, currentState) {
    // Create a copy of the current state's variables
    const variables = { ...currentState.variables };
    // Step 1: Update response variables from submission
    // Coerce string values to appropriate types based on response declarations
    for (const [identifier, value] of Object.entries(submission)) {
        variables[identifier] = coerceResponseValue(itemDoc, identifier, value);
    }
    // Step 2: Execute response processing rules
    const responseProcessing = itemDoc.getElementsByTagName('qti-response-processing')[0];
    if (responseProcessing) {
        const template = responseProcessing.getAttribute('template');
        if (template) {
            // Use standard template
            executeResponseTemplate(template, itemDoc, variables);
        }
        else {
            // Execute inline response processing rules
            for (const child of getChildElements(responseProcessing)) {
                executeResponseRule(child, itemDoc, variables);
            }
        }
    }
    // Step 3: Return updated state
    // Trust completionStatus set by response processing, default to 'completed'
    const score = extractStandardOutcomes(variables, itemDoc);
    const completionStatus = variables.completionStatus === 'incomplete'
        ? 'incomplete'
        : 'completed';
    const externalInfo = getExternalScoredInfo(itemDoc, variables);
    return {
        variables,
        completionStatus,
        score,
        // Preserve shuffle orders from input state
        ...(currentState.shuffleOrders && { shuffleOrders: currentState.shuffleOrders }),
        // Signal that external scoring is needed
        ...(externalInfo && { pendingManualScoring: { maxScore: externalInfo.maxScore } }),
    };
}
/**
 * Execute a standard response processing template
 */
function executeResponseTemplate(templateUrl, itemDoc, variables) {
    var _a;
    // Normalize template URL to get the template name
    const templateName = ((_a = templateUrl.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('.xml', '')) || '';
    switch (templateName) {
        case 'match_correct':
        case 'CC2_match_basic':
        case 'CC2_match':
            executeMatchCorrectTemplate(itemDoc, variables);
            break;
        case 'map_response':
        case 'CC2_map_response':
            executeMapResponseTemplate(itemDoc, variables);
            break;
        case 'map_response_point':
            executeMapResponsePointTemplate(itemDoc, variables);
            break;
        default:
            throw new Error(`Unknown response processing template: ${templateName}`);
    }
}
/**
 * Execute MATCH CORRECT template
 * Sets SCORE to 1 if RESPONSE matches correct value, 0 otherwise
 *
 * For formula responses (data-response-type="formula"), uses Compute Engine
 * for mathematical comparison based on the data-comparison-mode attribute.
 *
 * Note: Per QTI spec, match_correct only works with single interactions
 * using the identifier "RESPONSE". Composite items (multiple interactions)
 * require custom response processing.
 */
function executeMatchCorrectTemplate(itemDoc, variables) {
    const responseValue = variables['RESPONSE'];
    const correctValue = getCorrectResponse(itemDoc, 'RESPONSE', variables);
    if (compareResponseValues(itemDoc, 'RESPONSE', responseValue, correctValue)) {
        variables['SCORE'] = 1;
    }
    else {
        variables['SCORE'] = 0;
    }
}
/**
 * Execute MAP RESPONSE template
 * Maps RESPONSE value(s) to SCORE using the mapping declaration
 * If RESPONSE is null, sets SCORE to 0.0
 */
function executeMapResponseTemplate(itemDoc, variables) {
    const responseValue = variables['RESPONSE'];
    if (responseValue === null || responseValue === undefined) {
        variables['SCORE'] = 0.0;
        return;
    }
    const mapping = getResponseMapping(itemDoc, 'RESPONSE');
    if (!mapping) {
        variables['SCORE'] = 0.0;
        return;
    }
    let score = 0;
    // Handle single or multiple values
    if (Array.isArray(responseValue)) {
        for (const value of responseValue) {
            score += getMappedValue(value, mapping);
        }
    }
    else {
        score = getMappedValue(responseValue, mapping);
    }
    // Apply bounds if specified
    if (mapping.lowerBound !== null && score < mapping.lowerBound) {
        score = mapping.lowerBound;
    }
    if (mapping.upperBound !== null && score > mapping.upperBound) {
        score = mapping.upperBound;
    }
    variables['SCORE'] = score;
}
/**
 * Execute MAP RESPONSE POINT template
 * Maps point RESPONSE value(s) to SCORE using area mapping
 * If RESPONSE is null, sets SCORE to 0
 */
function executeMapResponsePointTemplate(itemDoc, variables) {
    const responseValue = variables['RESPONSE'];
    if (responseValue === null || responseValue === undefined) {
        variables['SCORE'] = 0;
        return;
    }
    const areaMapping = getAreaMapping(itemDoc, 'RESPONSE');
    if (!areaMapping) {
        variables['SCORE'] = 0;
        return;
    }
    let score = 0;
    // Handle single or multiple points
    if (Array.isArray(responseValue)) {
        for (const point of responseValue) {
            score += getAreaMappedValue(point, areaMapping);
        }
    }
    else {
        score = getAreaMappedValue(responseValue, areaMapping);
    }
    variables['SCORE'] = score;
}
/**
 * Get the correct response value from a response declaration
 */
function getCorrectResponse(itemDoc, identifier, variables) {
    const templateCorrect = variables[`__correct_${identifier}`];
    if (templateCorrect !== undefined)
        return templateCorrect;
    const declarations = itemDoc.getElementsByTagName('qti-response-declaration');
    for (let i = 0; i < declarations.length; i++) {
        const declaration = declarations[i];
        if (declaration.getAttribute('identifier') === identifier) {
            const correctResponse = declaration.getElementsByTagName('qti-correct-response')[0];
            if (correctResponse) {
                const cardinality = declaration.getAttribute('cardinality') || 'single';
                const baseType = declaration.getAttribute('base-type') || 'identifier';
                const valueElements = correctResponse.getElementsByTagName('qti-value');
                if (cardinality === 'single') {
                    if (valueElements.length > 0) {
                        return parseResponseValue(valueElements[0].textContent || '', baseType);
                    }
                }
                else if (cardinality === 'multiple' || cardinality === 'ordered') {
                    const values = [];
                    for (let j = 0; j < valueElements.length; j++) {
                        values.push(parseResponseValue(valueElements[j].textContent || '', baseType));
                    }
                    return values;
                }
            }
        }
    }
    return null;
}
/**
 * Get the response mapping from a response declaration
 */
function getResponseMapping(itemDoc, identifier) {
    const declarations = itemDoc.getElementsByTagName('qti-response-declaration');
    for (let i = 0; i < declarations.length; i++) {
        const declaration = declarations[i];
        if (declaration.getAttribute('identifier') === identifier) {
            const mappingElement = declaration.getElementsByTagName('qti-mapping')[0];
            if (mappingElement) {
                const defaultValue = parseFloat(mappingElement.getAttribute('default-value') || '0');
                const lowerBound = mappingElement.getAttribute('lower-bound');
                const upperBound = mappingElement.getAttribute('upper-bound');
                const mapEntries = [];
                const mapEntryElements = mappingElement.getElementsByTagName('qti-map-entry');
                for (let j = 0; j < mapEntryElements.length; j++) {
                    const entry = mapEntryElements[j];
                    const mapKey = entry.getAttribute('map-key');
                    const mappedValue = entry.getAttribute('mapped-value');
                    const caseSensitive = entry.getAttribute('case-sensitive') === 'true';
                    if (mapKey && mappedValue) {
                        mapEntries.push({
                            mapKey,
                            mappedValue: parseFloat(mappedValue),
                            caseSensitive
                        });
                    }
                }
                return {
                    defaultValue,
                    lowerBound: lowerBound !== null ? parseFloat(lowerBound) : null,
                    upperBound: upperBound !== null ? parseFloat(upperBound) : null,
                    entries: mapEntries
                };
            }
        }
    }
    return null;
}
/**
 * Get mapped value for a given response value.
 * Per QTI spec, string mapping is case-insensitive by default.
 * Individual map entries can override this with case-sensitive="true".
 */
function getMappedValue(value, mapping) {
    const key = String(value);
    for (const entry of mapping.entries) {
        const matches = entry.caseSensitive
            ? key === entry.mapKey
            : key.toLowerCase() === entry.mapKey.toLowerCase();
        if (matches) {
            return entry.mappedValue;
        }
    }
    return mapping.defaultValue;
}
/**
 * Get area mapping from a response declaration
 */
function getAreaMapping(itemDoc, identifier) {
    const declarations = itemDoc.getElementsByTagName('qti-response-declaration');
    for (let i = 0; i < declarations.length; i++) {
        const declaration = declarations[i];
        if (declaration.getAttribute('identifier') === identifier) {
            const areaMappingElement = declaration.getElementsByTagName('qti-area-mapping')[0];
            if (areaMappingElement) {
                const defaultValue = parseFloat(areaMappingElement.getAttribute('default-value') || '0');
                const areaMapEntries = [];
                const entryElements = areaMappingElement.getElementsByTagName('qti-area-map-entry');
                for (let j = 0; j < entryElements.length; j++) {
                    const entry = entryElements[j];
                    const shape = entry.getAttribute('shape');
                    const coords = entry.getAttribute('coords');
                    const mappedValue = entry.getAttribute('mapped-value');
                    if (shape && coords && mappedValue) {
                        areaMapEntries.push({
                            shape,
                            coords: coords.split(',').map(c => parseFloat(c.trim())),
                            mappedValue: parseFloat(mappedValue)
                        });
                    }
                }
                return {
                    defaultValue,
                    entries: areaMapEntries
                };
            }
        }
    }
    return null;
}
/**
 * Get mapped value for a point based on area mapping
 */
function getAreaMappedValue(point, areaMapping) {
    // Parse point - can be string like "100 100" or array [100, 100]
    let x, y;
    if (typeof point === 'string') {
        const parts = point.trim().split(/\s+/);
        x = parseFloat(parts[0]);
        y = parseFloat(parts[1]);
    }
    else if (Array.isArray(point) && point.length >= 2) {
        x = Number(point[0]);
        y = Number(point[1]);
    }
    else {
        return areaMapping.defaultValue;
    }
    // Check each area to see if point is inside
    for (const entry of areaMapping.entries) {
        if (isPointInArea(x, y, entry.shape, entry.coords)) {
            return entry.mappedValue;
        }
    }
    return areaMapping.defaultValue;
}
/**
 * Check if a point is inside a defined area
 */
function isPointInArea(x, y, shape, coords) {
    switch (shape) {
        case 'circle':
            // coords: [centerX, centerY, radius]
            if (coords.length >= 3) {
                const [cx, cy, r] = coords;
                const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
                return distance <= r;
            }
            return false;
        case 'rect':
            // coords: [x1, y1, x2, y2]
            if (coords.length >= 4) {
                const [x1, y1, x2, y2] = coords;
                return x >= x1 && x <= x2 && y >= y1 && y <= y2;
            }
            return false;
        case 'poly': {
            // coords: [x1, y1, x2, y2, x3, y3, ...]
            // Use ray casting algorithm
            if (coords.length < 6)
                return false;
            let inside = false;
            for (let i = 0, j = coords.length - 2; i < coords.length; i += 2) {
                const xi = coords[i], yi = coords[i + 1];
                const xj = coords[j], yj = coords[j + 1];
                const intersect = ((yi > y) !== (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect)
                    inside = !inside;
                j = i;
            }
            return inside;
        }
        default:
            return false;
    }
}
/**
 * Execute a response processing rule
 */
function executeResponseRule(rule, itemDoc, variables) {
    const localName = rule.localName;
    switch (localName) {
        case 'qti-set-outcome-value':
            executeSetOutcomeValue(rule, itemDoc, variables);
            break;
        case 'qti-response-condition':
            executeResponseCondition(rule, itemDoc, variables);
            break;
        case 'qti-exit-response':
            throw new ExitResponseError();
    }
}
/**
 * Execute qti-set-outcome-value
 */
function executeSetOutcomeValue(rule, itemDoc, variables) {
    const identifier = rule.getAttribute('identifier');
    if (!identifier)
        return;
    // Evaluate the expression (first child element)
    const child = getFirstChildElement(rule);
    if (!child) {
        throw new Error('Expected child element in <qti-set-outcome-value>');
    }
    const value = evaluateExpression(child, itemDoc, variables);
    variables[identifier] = value;
}
/**
 * Execute qti-response-condition
 */
function executeResponseCondition(rule, itemDoc, variables) {
    // Find response-if, response-else-if, and response-else elements
    for (const child of getChildElements(rule)) {
        const localName = child.localName;
        if (localName === 'qti-response-if') {
            if (evaluateResponseIf(child, itemDoc, variables)) {
                return; // Condition was true, stop processing
            }
        }
        else if (localName === 'qti-response-else-if') {
            if (evaluateResponseIf(child, itemDoc, variables)) {
                return; // Condition was true, stop processing
            }
        }
        else if (localName === 'qti-response-else') {
            executeResponseBlock(child, itemDoc, variables);
            return;
        }
    }
}
/**
 * Evaluate a response-if or response-else-if block
 * Returns true if condition was true and block was executed
 */
function evaluateResponseIf(element, itemDoc, variables) {
    let conditionResult = false;
    let conditionEvaluated = false;
    for (const child of getChildElements(element)) {
        if (!conditionEvaluated) {
            // This is the condition expression
            const value = evaluateExpression(child, itemDoc, variables);
            if (typeof value !== 'boolean') {
                throw new Error(`Expected boolean value in <${element.localName}> condition, got ${typeof value}`);
            }
            conditionResult = value;
            conditionEvaluated = true;
        }
        else {
            // These are the rules to execute if condition is true
            if (conditionResult) {
                executeResponseRule(child, itemDoc, variables);
            }
        }
    }
    return conditionResult;
}
/**
 * Execute all rules in a response block (used for response-else)
 */
function executeResponseBlock(element, itemDoc, variables) {
    for (const child of getChildElements(element)) {
        executeResponseRule(child, itemDoc, variables);
    }
}
/**
 * Evaluate an expression in response processing context
 */
function evaluateExpression(element, itemDoc, variables) {
    const subEvaluate = (el, doc, vars) => evaluateExpression(el, doc, vars);
    const localName = element.localName;
    switch (localName) {
        // Response-specific operators
        case 'qti-correct':
            return evaluateCorrect(element, itemDoc, variables);
        case 'qti-map-response':
            return evaluateMapResponse(element, itemDoc, variables, subEvaluate);
        case 'qti-map-response-point':
            return evaluateMapResponsePoint(element, itemDoc, variables, subEvaluate);
        // Fall through to shared evaluator for all other operators
        default:
            return evaluateExpressionShared(element, itemDoc, variables, subEvaluate);
    }
}
// Expression evaluators
function evaluateCorrect(element, itemDoc, variables) {
    const identifier = element.getAttribute('identifier');
    if (!identifier)
        return null;
    return getCorrectResponse(itemDoc, identifier, variables);
}
function evaluateMapResponse(element, itemDoc, variables, _subEvaluate) {
    const identifier = element.getAttribute('identifier') || 'RESPONSE';
    const responseValue = variables[identifier];
    if (responseValue === null || responseValue === undefined) {
        return 0.0;
    }
    const mapping = getResponseMapping(itemDoc, identifier);
    if (!mapping) {
        return 0.0;
    }
    let score = 0;
    if (Array.isArray(responseValue)) {
        for (const value of responseValue) {
            score += getMappedValue(value, mapping);
        }
    }
    else {
        score = getMappedValue(responseValue, mapping);
    }
    // Apply bounds
    if (mapping.lowerBound !== null && score < mapping.lowerBound) {
        score = mapping.lowerBound;
    }
    if (mapping.upperBound !== null && score > mapping.upperBound) {
        score = mapping.upperBound;
    }
    return score;
}
function evaluateMapResponsePoint(element, itemDoc, variables, _subEvaluate) {
    const identifier = element.getAttribute('identifier') || 'RESPONSE';
    const responseValue = variables[identifier];
    if (responseValue === null || responseValue === undefined) {
        return 0;
    }
    const areaMapping = getAreaMapping(itemDoc, identifier);
    if (!areaMapping) {
        return 0;
    }
    let score = 0;
    if (Array.isArray(responseValue)) {
        for (const point of responseValue) {
            score += getAreaMappedValue(point, areaMapping);
        }
    }
    else {
        score = getAreaMappedValue(responseValue, areaMapping);
    }
    return score;
}
/**
 * Custom error thrown when exit-response is encountered
 */
class ExitResponseError extends Error {
    constructor() {
        super('Exit response');
        this.name = 'ExitResponseError';
    }
}
