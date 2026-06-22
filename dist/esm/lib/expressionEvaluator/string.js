/**
 * String operators
 */
import { getChildElements } from '../../utils/dom';
/**
 * Evaluate qti-substring element
 */
export function evaluateSubstring(element, itemDoc, variables, subEvaluate) {
    const caseSensitive = element.getAttribute('case-sensitive') !== 'false';
    const values = [];
    for (const child of getChildElements(element)) {
        values.push(String(subEvaluate(child, itemDoc, variables)));
    }
    if (values.length >= 2) {
        const text = caseSensitive ? values[0] : values[0].toLowerCase();
        const substring = caseSensitive ? values[1] : values[1].toLowerCase();
        return text.includes(substring);
    }
    return false;
}
/**
 * Evaluate qti-string-match element
 */
export function evaluateStringMatch(element, itemDoc, variables, subEvaluate) {
    const caseSensitive = element.getAttribute('case-sensitive') !== 'false';
    const values = [];
    for (const child of getChildElements(element)) {
        values.push(String(subEvaluate(child, itemDoc, variables)));
    }
    if (values.length >= 2) {
        const str1 = caseSensitive ? values[0] : values[0].toLowerCase();
        const str2 = caseSensitive ? values[1] : values[1].toLowerCase();
        return str1 === str2;
    }
    return false;
}
/**
 * Evaluate qti-pattern-match element
 */
export function evaluatePatternMatch(element, itemDoc, variables, subEvaluate) {
    const pattern = element.getAttribute('pattern');
    if (!pattern)
        return false;
    for (const child of getChildElements(element)) {
        const value = String(subEvaluate(child, itemDoc, variables));
        const regex = new RegExp(pattern);
        return regex.test(value);
    }
    return false;
}
