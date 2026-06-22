/**
 * Base value and variable operators
 */
import { parseValue } from '../../utils/typeParser';
/**
 * Evaluate qti-base-value element
 */
export function evaluateBaseValue(element) {
    const baseType = element.getAttribute('base-type');
    const text = element.textContent || '';
    if (!baseType)
        return text;
    return parseValue(text, baseType);
}
/**
 * Evaluate qti-variable element
 */
export function evaluateVariable(element, variables) {
    var _a;
    const identifier = element.getAttribute('identifier');
    if (!identifier)
        return null;
    return (_a = variables[identifier]) !== null && _a !== void 0 ? _a : null;
}
