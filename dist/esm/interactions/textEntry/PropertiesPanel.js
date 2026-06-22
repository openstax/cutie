import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { MapEntryList } from '../../components/properties/MapEntryList';
import { getCorrectValue, updateCorrectValue, hasCorrectResponse, removeCorrectResponse, addEmptyCorrectResponse, updateIdentifier, updateBaseType, getBaseType, } from '../../utils/responseDeclaration';
import { hasMapping, getMapping, removeMapping, addEmptyMapping, updateMapping, } from '../../utils/mappingDeclaration';
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
export function TextEntryPropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    const attrs = element.attributes;
    const responseDecl = element.responseDeclaration;
    const baseType = getBaseType(responseDecl);
    const correctValue = getCorrectValue(responseDecl);
    const hasCorrectAnswer = hasCorrectResponse(responseDecl);
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
    const handleBaseTypeChange = (newBaseType) => {
        const updatedDecl = updateBaseType(responseDecl, newBaseType);
        onUpdate(path, attrs, updatedDecl);
    };
    const handleCorrectValueChange = (value) => {
        const updatedDecl = updateCorrectValue(responseDecl, value);
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
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Text Entry Interaction" }), _jsx(PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), _jsx(PropertyField, { label: "Expected Length", type: "number", value: attrs['expected-length'] || '', onChange: (val) => handleAttributeChange('expected-length', val), placeholder: "Number of characters", min: "1" }), _jsx(PropertyField, { label: "Pattern Mask", value: attrs['pattern-mask'] || '', onChange: (val) => handleAttributeChange('pattern-mask', val), placeholder: "e.g., [0-9]+" }), _jsx(PropertyField, { label: "Placeholder Text", value: attrs['placeholder-text'] || '', onChange: (val) => handleAttributeChange('placeholder-text', val), placeholder: "Hint text for learner" }), _jsxs("div", { className: "property-field", children: [_jsx("label", { className: "property-label", children: "Response type" }), _jsx("select", { className: "property-select", value: baseType, onChange: (e) => handleBaseTypeChange(e.target.value), children: BASE_TYPE_OPTIONS.map(opt => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsx(ToggleableFormSection, { label: "Set correct answer", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: _jsxs("div", { className: "property-field", children: [_jsx("label", { className: "property-label", children: "Correct value" }), _jsx("input", { type: getInputType(baseType), step: getInputStep(baseType), className: "property-input", value: correctValue, onChange: (e) => handleCorrectValueChange(e.target.value), placeholder: baseType === 'string' ? 'Enter correct answer' : 'Enter number' })] }) }), _jsxs(ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [_jsx(MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), _jsx(MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => (_jsx("input", { type: getInputType(baseType), step: getInputStep(baseType), value: response, onChange: (e) => onChange(e.target.value), placeholder: "Response value" })), onAddEntry: handleAddMappingEntry, addButtonLabel: "Add response mapping" })] })] }));
}
