"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findChildren = exports.findChild = void 0;
exports.hasCorrectResponse = hasCorrectResponse;
exports.getCorrectResponse = getCorrectResponse;
exports.removeCorrectResponse = removeCorrectResponse;
exports.addEmptyCorrectResponse = addEmptyCorrectResponse;
exports.getCorrectValues = getCorrectValues;
exports.getCorrectValue = getCorrectValue;
exports.setCorrectValues = setCorrectValues;
exports.updateCorrectValue = updateCorrectValue;
exports.updateDeclAttribute = updateDeclAttribute;
exports.updateIdentifier = updateIdentifier;
exports.updateCardinality = updateCardinality;
exports.updateBaseType = updateBaseType;
exports.getBaseType = getBaseType;
exports.getCardinality = getCardinality;
exports.getIdentifier = getIdentifier;
exports.getResponseDeclAttribute = getResponseDeclAttribute;
exports.removeDeclAttribute = removeDeclAttribute;
const xmlNode_1 = require("../serialization/xmlNode");
// Re-export for convenience
var xmlNode_2 = require("../serialization/xmlNode");
Object.defineProperty(exports, "findChild", { enumerable: true, get: function () { return xmlNode_2.findChild; } });
Object.defineProperty(exports, "findChildren", { enumerable: true, get: function () { return xmlNode_2.findChildren; } });
/**
 * Check if a response declaration has a correct response defined
 */
function hasCorrectResponse(decl) {
    return !!(0, xmlNode_1.findChild)(decl, 'qti-correct-response');
}
/**
 * Get the correct response element from a declaration
 */
function getCorrectResponse(decl) {
    return (0, xmlNode_1.findChild)(decl, 'qti-correct-response');
}
/**
 * Remove the correct response from a declaration (keeps the declaration itself)
 */
function removeCorrectResponse(decl) {
    return {
        tagName: decl.tagName,
        attributes: { ...decl.attributes },
        children: decl.children.filter((c) => typeof c !== 'string' && c.tagName !== 'qti-correct-response'),
    };
}
/**
 * Add an empty correct response to a declaration
 */
function addEmptyCorrectResponse(decl) {
    const cleanDecl = removeCorrectResponse(decl);
    return {
        ...cleanDecl,
        children: [
            ...cleanDecl.children,
            {
                tagName: 'qti-correct-response',
                attributes: {},
                children: [],
            },
        ],
    };
}
/**
 * Extract multiple correct values from a response declaration (for choice interactions)
 */
function getCorrectValues(decl) {
    const correctResponse = (0, xmlNode_1.findChild)(decl, 'qti-correct-response');
    if (!correctResponse)
        return [];
    return (0, xmlNode_1.findChildren)(correctResponse, 'qti-value')
        .map(v => (typeof v.children[0] === 'string' ? v.children[0] : ''))
        .filter(Boolean);
}
/**
 * Extract a single correct value from a response declaration (for text entry interactions)
 */
function getCorrectValue(decl) {
    const correctResponse = (0, xmlNode_1.findChild)(decl, 'qti-correct-response');
    if (!correctResponse)
        return '';
    const value = (0, xmlNode_1.findChild)(correctResponse, 'qti-value');
    if (!value)
        return '';
    return typeof value.children[0] === 'string' ? value.children[0] : '';
}
/**
 * Set multiple correct values in a response declaration (for choice interactions)
 * Also updates the cardinality attribute
 */
function setCorrectValues(decl, values, cardinality) {
    // Clone the declaration with updated cardinality, removing old correct response
    const newDecl = {
        tagName: decl.tagName,
        attributes: { ...decl.attributes, cardinality },
        children: decl.children.filter((c) => typeof c !== 'string' && c.tagName !== 'qti-correct-response'),
    };
    // Add new correct response if there are values
    if (values.length > 0) {
        const correctResponse = {
            tagName: 'qti-correct-response',
            attributes: {},
            children: values.map(v => ({
                tagName: 'qti-value',
                attributes: {},
                children: [v],
            })),
        };
        newDecl.children.push(correctResponse);
    }
    return newDecl;
}
/**
 * Update a single correct value in a response declaration (for text entry interactions)
 * Preserves the qti-correct-response element even if value is empty
 */
function updateCorrectValue(decl, value) {
    const otherChildren = decl.children.filter((c) => typeof c !== 'string' && c.tagName !== 'qti-correct-response');
    const correctResponse = {
        tagName: 'qti-correct-response',
        attributes: {},
        children: value !== '' ? [{
                tagName: 'qti-value',
                attributes: {},
                children: [value],
            }] : [],
    };
    return {
        tagName: decl.tagName,
        attributes: { ...decl.attributes },
        children: [...otherChildren, correctResponse],
    };
}
/**
 * Update an attribute on a response declaration
 */
function updateDeclAttribute(decl, key, value) {
    return {
        tagName: decl.tagName,
        attributes: { ...decl.attributes, [key]: value },
        children: [...decl.children],
    };
}
/**
 * Update the identifier in a response declaration
 */
function updateIdentifier(decl, identifier) {
    return updateDeclAttribute(decl, 'identifier', identifier);
}
/**
 * Update the cardinality in a response declaration
 */
function updateCardinality(decl, cardinality) {
    return updateDeclAttribute(decl, 'cardinality', cardinality);
}
/**
 * Update the base-type in a response declaration
 */
function updateBaseType(decl, baseType) {
    return updateDeclAttribute(decl, 'base-type', baseType);
}
/**
 * Get the base-type from a response declaration
 */
function getBaseType(decl) {
    return decl.attributes['base-type'] || 'string';
}
/**
 * Get the cardinality from a response declaration
 */
function getCardinality(decl) {
    const cardinality = decl.attributes['cardinality'];
    return cardinality === 'multiple' ? 'multiple' : 'single';
}
/**
 * Get the identifier from a response declaration
 */
function getIdentifier(decl) {
    return decl.attributes['identifier'] || '';
}
/**
 * Get an arbitrary attribute from a response declaration
 */
function getResponseDeclAttribute(decl, attrName) {
    var _a;
    return (_a = decl.attributes) === null || _a === void 0 ? void 0 : _a[attrName];
}
/**
 * Remove an attribute from a response declaration
 */
function removeDeclAttribute(decl, attrName) {
    const { [attrName]: _, ...restAttrs } = decl.attributes || {};
    return {
        tagName: decl.tagName,
        attributes: restAttrs,
        children: [...decl.children],
    };
}
