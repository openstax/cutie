"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEntryPropertiesPanel = TextEntryPropertiesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const PropertyField_1 = require("../../components/properties/PropertyField");
const ToggleableFormSection_1 = require("../../components/properties/ToggleableFormSection");
const MappingMetadataFields_1 = require("../../components/properties/MappingMetadataFields");
const MapEntryList_1 = require("../../components/properties/MapEntryList");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
const BASE_TYPE_OPTIONS = [
    { value: 'string', label: 'Text (string)' },
    { value: 'integer', label: 'Integer' },
    { value: 'float', label: 'Decimal (float)' },
];
/**
 * Get the HTML input type for a base-type
 */
function getInputType(baseType) {
    switch (baseType) {
        case 'integer':
        case 'float':
            return 'number';
        default:
            return 'text';
    }
}
/**
 * Get the step attribute for number inputs
 */
function getInputStep(baseType) {
    if (baseType === 'float')
        return 'any';
    if (baseType === 'integer')
        return '1';
    return undefined;
}
/**
 * Properties panel for editing text entry interaction attributes
 */
function TextEntryPropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    const attrs = element.attributes;
    const responseDecl = element.responseDeclaration;
    const baseType = (0, responseDeclaration_1.getBaseType)(responseDecl);
    const correctValue = (0, responseDeclaration_1.getCorrectValue)(responseDecl);
    const hasCorrectAnswer = (0, responseDeclaration_1.hasCorrectResponse)(responseDecl);
    const handleAttributeChange = (key, value) => {
        const newAttrs = { ...attrs };
        if (value === '') {
            // Remove attribute if empty (except for required fields)
            if (key !== 'response-identifier') {
                delete newAttrs[key];
            }
        }
        else {
            newAttrs[key] = value;
        }
        // If response-identifier changed, update it in the response declaration too
        let updatedDecl = responseDecl;
        if (key === 'response-identifier') {
            updatedDecl = (0, responseDeclaration_1.updateIdentifier)(updatedDecl, value);
        }
        onUpdate(path, newAttrs, updatedDecl);
    };
    const handleToggleCorrectAnswer = (enabled) => {
        if (enabled) {
            const updatedDecl = (0, responseDeclaration_1.addEmptyCorrectResponse)(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
        else {
            const updatedDecl = (0, responseDeclaration_1.removeCorrectResponse)(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
    };
    const handleBaseTypeChange = (newBaseType) => {
        const updatedDecl = (0, responseDeclaration_1.updateBaseType)(responseDecl, newBaseType);
        onUpdate(path, attrs, updatedDecl);
    };
    const handleCorrectValueChange = (value) => {
        const updatedDecl = (0, responseDeclaration_1.updateCorrectValue)(responseDecl, value);
        onUpdate(path, attrs, updatedDecl);
    };
    // Mapping data
    const mappingEnabled = (0, mappingDeclaration_1.hasMapping)(responseDecl);
    const mappingData = (0, mappingDeclaration_1.getMapping)(responseDecl);
    const mappingEntries = (_a = mappingData === null || mappingData === void 0 ? void 0 : mappingData.entries) !== null && _a !== void 0 ? _a : [];
    const mappingMetadata = (_b = mappingData === null || mappingData === void 0 ? void 0 : mappingData.metadata) !== null && _b !== void 0 ? _b : { defaultValue: 0 };
    const handleToggleMapping = (enabled) => {
        if (enabled) {
            const updatedDecl = (0, mappingDeclaration_1.addEmptyMapping)(responseDecl, 0);
            onUpdate(path, attrs, updatedDecl);
        }
        else {
            const updatedDecl = (0, mappingDeclaration_1.removeMapping)(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
    };
    const handleMappingMetadataChange = (metadata) => {
        const updatedDecl = (0, mappingDeclaration_1.updateMapping)(responseDecl, metadata, mappingEntries);
        onUpdate(path, attrs, updatedDecl);
    };
    const handleMappingEntriesChange = (entries) => {
        const updatedDecl = (0, mappingDeclaration_1.updateMapping)(responseDecl, mappingMetadata, entries);
        onUpdate(path, attrs, updatedDecl);
    };
    const handleAddMappingEntry = () => {
        const newEntry = { mapKey: '', mappedValue: 1 };
        handleMappingEntriesChange([...mappingEntries, newEntry]);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-editor", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Text Entry Interaction" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Expected Length", type: "number", value: attrs['expected-length'] || '', onChange: (val) => handleAttributeChange('expected-length', val), placeholder: "Number of characters", min: "1" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Pattern Mask", value: attrs['pattern-mask'] || '', onChange: (val) => handleAttributeChange('pattern-mask', val), placeholder: "e.g., [0-9]+" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Placeholder Text", value: attrs['placeholder-text'] || '', onChange: (val) => handleAttributeChange('placeholder-text', val), placeholder: "Hint text for learner" }), (0, jsx_runtime_1.jsxs)("div", { className: "property-field", children: [(0, jsx_runtime_1.jsx)("label", { className: "property-label", children: "Response type" }), (0, jsx_runtime_1.jsx)("select", { className: "property-select", value: baseType, onChange: (e) => handleBaseTypeChange(e.target.value), children: BASE_TYPE_OPTIONS.map(opt => ((0, jsx_runtime_1.jsx)("option", { value: opt.value, children: opt.label }, opt.value))) })] }), (0, jsx_runtime_1.jsx)(ToggleableFormSection_1.ToggleableFormSection, { label: "Set correct answer", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: (0, jsx_runtime_1.jsxs)("div", { className: "property-field", children: [(0, jsx_runtime_1.jsx)("label", { className: "property-label", children: "Correct value" }), (0, jsx_runtime_1.jsx)("input", { type: getInputType(baseType), step: getInputStep(baseType), className: "property-input", value: correctValue, onChange: (e) => handleCorrectValueChange(e.target.value), placeholder: baseType === 'string' ? 'Enter correct answer' : 'Enter number' })] }) }), (0, jsx_runtime_1.jsxs)(ToggleableFormSection_1.ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [(0, jsx_runtime_1.jsx)(MappingMetadataFields_1.MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), (0, jsx_runtime_1.jsx)(MapEntryList_1.MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => ((0, jsx_runtime_1.jsx)("input", { type: getInputType(baseType), step: getInputStep(baseType), value: response, onChange: (e) => onChange(e.target.value), placeholder: "Response value" })), onAddEntry: handleAddMappingEntry, addButtonLabel: "Add response mapping" })] })] }));
}
