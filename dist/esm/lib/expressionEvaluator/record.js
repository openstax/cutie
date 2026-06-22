/**
 * Record operators
 */
import { getChildElements } from '../../utils/dom';
/**
 * Evaluate qti-record element
 */
export function evaluateRecord(element, itemDoc, variables, subEvaluate) {
    const record = {};
    const fieldElements = element.getElementsByTagName('qti-field-value');
    for (let i = 0; i < fieldElements.length; i++) {
        const fieldElement = fieldElements[i];
        const fieldIdentifier = fieldElement.getAttribute('field-identifier');
        if (!fieldIdentifier)
            continue;
        const children = Array.from(getChildElements(fieldElement));
        if (children.length !== 1) {
            throw new Error('Expected exactly 1 child element in <qti-field-value>');
        }
        record[fieldIdentifier] = subEvaluate(children[0], itemDoc, variables);
    }
    return record;
}
/**
 * Evaluate qti-field-value element
 */
export function evaluateFieldValue(element, itemDoc, variables, subEvaluate) {
    var _a;
    const fieldIdentifier = element.getAttribute('field-identifier');
    if (!fieldIdentifier)
        return null;
    for (const child of getChildElements(element)) {
        const record = subEvaluate(child, itemDoc, variables);
        if (record && typeof record === 'object' && !Array.isArray(record)) {
            return (_a = record[fieldIdentifier]) !== null && _a !== void 0 ? _a : null;
        }
        return null;
    }
    return null;
}
