"use strict";
/**
 * Base value and variable operators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateBaseValue = evaluateBaseValue;
exports.evaluateVariable = evaluateVariable;
const typeParser_1 = require("../../utils/typeParser");
/**
 * Evaluate qti-base-value element
 */
function evaluateBaseValue(element) {
    const baseType = element.getAttribute('base-type');
    const text = element.textContent || '';
    if (!baseType)
        return text;
    return (0, typeParser_1.parseValue)(text, baseType);
}
/**
 * Evaluate qti-variable element
 */
function evaluateVariable(element, variables) {
    var _a;
    const identifier = element.getAttribute('identifier');
    if (!identifier)
        return null;
    return (_a = variables[identifier]) !== null && _a !== void 0 ? _a : null;
}
