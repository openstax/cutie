import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { MapEntryList } from '../../components/properties/MapEntryList';
import { getCorrectValue, updateCorrectValue, hasCorrectResponse, removeCorrectResponse, addEmptyCorrectResponse, updateIdentifier, getResponseDeclAttribute, updateDeclAttribute, removeDeclAttribute, } from '../../utils/responseDeclaration';
import { hasMapping, getMapping, removeMapping, addEmptyMapping, updateMapping, } from '../../utils/mappingDeclaration';
const COMPARISON_MODE_OPTIONS = [
    { value: 'canonical', label: "Canonical (default) - order doesn't matter" },
    { value: 'strict', label: 'Strict - exact structure required' },
    { value: 'algebraic', label: 'Algebraic - full mathematical equivalence' },
];
/**
 * Properties panel for editing extended text interaction attributes
 */
export function ExtendedTextPropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    const attrs = element.attributes;
    const responseDecl = element.responseDeclaration;
    const correctValue = getCorrectValue(responseDecl);
    const hasCorrectAnswer = hasCorrectResponse(responseDecl);
    // Formula mode state
    const isFormulaMode = getResponseDeclAttribute(responseDecl, 'data-response-type') === 'formula';
    const comparisonMode = getResponseDeclAttribute(responseDecl, 'data-comparison-mode') || 'canonical';
    const handleAttributeChange = (key, value) => {
        const newAttrs = { ...attrs };
        if (value === '') {
            if (key !== 'response-identifier') {
                delete newAttrs[key];
            }
        }
        else {
            newAttrs[key] = value;
        }
        let updatedDecl = responseDecl;
        if (key === 'response-identifier') {
            updatedDecl = updateIdentifier(updatedDecl, value);
        }
        onUpdate(path, newAttrs, updatedDecl);
    };
    const handleToggleCorrectAnswer = (enabled) => {
        if (enabled) {
            const updatedDecl = addEmptyCorrectResponse(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
        else {
            const updatedDecl = removeCorrectResponse(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
    };
    const handleCorrectValueChange = (value) => {
        const updatedDecl = updateCorrectValue(responseDecl, value);
        onUpdate(path, attrs, updatedDecl);
    };
    const handleFormulaModeToggle = (enabled) => {
        let updatedDecl = responseDecl;
        if (enabled) {
            updatedDecl = updateDeclAttribute(updatedDecl, 'data-response-type', 'formula');
            updatedDecl = updateDeclAttribute(updatedDecl, 'data-comparison-mode', 'canonical');
        }
        else {
            updatedDecl = removeDeclAttribute(updatedDecl, 'data-response-type');
            updatedDecl = removeDeclAttribute(updatedDecl, 'data-comparison-mode');
        }
        onUpdate(path, attrs, updatedDecl);
    };
    const handleComparisonModeChange = (mode) => {
        const updatedDecl = updateDeclAttribute(responseDecl, 'data-comparison-mode', mode);
        onUpdate(path, attrs, updatedDecl);
    };
    // Mapping data
    const mappingEnabled = hasMapping(responseDecl);
    const mappingData = getMapping(responseDecl);
    const mappingEntries = (_a = mappingData === null || mappingData === void 0 ? void 0 : mappingData.entries) !== null && _a !== void 0 ? _a : [];
    const mappingMetadata = (_b = mappingData === null || mappingData === void 0 ? void 0 : mappingData.metadata) !== null && _b !== void 0 ? _b : { defaultValue: 0 };
    const handleToggleMapping = (enabled) => {
        if (enabled) {
            const updatedDecl = addEmptyMapping(responseDecl, 0);
            onUpdate(path, attrs, updatedDecl);
        }
        else {
            const updatedDecl = removeMapping(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
    };
    const handleMappingMetadataChange = (metadata) => {
        const updatedDecl = updateMapping(responseDecl, metadata, mappingEntries);
        onUpdate(path, attrs, updatedDecl);
    };
    const handleMappingEntriesChange = (entries) => {
        const updatedDecl = updateMapping(responseDecl, mappingMetadata, entries);
        onUpdate(path, attrs, updatedDecl);
    };
    const handleAddMappingEntry = () => {
        const newEntry = { mapKey: '', mappedValue: 1 };
        handleMappingEntriesChange([...mappingEntries, newEntry]);
    };
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Extended Text Interaction" }), _jsx(PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), _jsx(PropertyField, { label: "Expected Lines", type: "number", value: attrs['expected-lines'] || '', onChange: (val) => handleAttributeChange('expected-lines', val), placeholder: "Number of lines", min: "1" }), _jsx(PropertyField, { label: "Expected Length", type: "number", value: attrs['expected-length'] || '', onChange: (val) => handleAttributeChange('expected-length', val), placeholder: "Number of characters", min: "1" }), _jsx(PropertyField, { label: "Placeholder Text", value: attrs['placeholder-text'] || '', onChange: (val) => handleAttributeChange('placeholder-text', val), placeholder: "Hint text for learner" }), _jsx(ToggleableFormSection, { label: "Set correct answer", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: _jsxs("div", { className: "property-field", children: [_jsx("label", { className: "property-label", children: "Correct value" }), _jsx("textarea", { className: "property-textarea", value: correctValue, onChange: (e) => handleCorrectValueChange(e.target.value), placeholder: "Enter correct answer", rows: 4 })] }) }), _jsx(ToggleableFormSection, { label: "Response is mathematical formula", enabled: isFormulaMode, onToggle: handleFormulaModeToggle, children: _jsxs("div", { className: "property-field", children: [_jsx("label", { className: "property-label", children: "Comparison mode" }), _jsx("select", { className: "property-select", value: comparisonMode, onChange: (e) => handleComparisonModeChange(e.target.value), children: COMPARISON_MODE_OPTIONS.map(opt => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }) }), _jsxs(ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [_jsx(MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), _jsx(MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => (_jsx("input", { type: "text", value: response, onChange: (e) => onChange(e.target.value), placeholder: "Response value" })), onAddEntry: handleAddMappingEntry, addButtonLabel: "Add response mapping" })] })] }));
}
