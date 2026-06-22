import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PropertyField } from '../../components/properties/PropertyField';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { MapEntryList } from '../../components/properties/MapEntryList';
import { getCorrectValues, setCorrectValues, hasCorrectResponse, removeCorrectResponse, addEmptyCorrectResponse, updateIdentifier, updateCardinality, } from '../../utils/responseDeclaration';
import { hasMapping, getMapping, removeMapping, addEmptyMapping, updateMapping, } from '../../utils/mappingDeclaration';
/**
 * Get choice identifiers from the element's children by reading from choice-id-label attributes
 */
function getChoiceIdentifiers(element) {
    return element.children
        .filter((child) => 'type' in child && child.type === 'qti-simple-choice')
        .map(choice => {
        var _a;
        // Find the choice-id-label child and extract identifier from its attributes
        const idLabel = choice.children.find((c) => 'type' in c && c.type === 'choice-id-label');
        if ((_a = idLabel === null || idLabel === void 0 ? void 0 : idLabel.attributes) === null || _a === void 0 ? void 0 : _a.identifier) {
            return idLabel.attributes.identifier;
        }
        // Fallback to parent attribute if no label found
        return choice.attributes.identifier;
    })
        .filter(Boolean);
}
/**
 * Properties panel for editing choice interaction attributes
 */
export function ChoicePropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    const attrs = element.attributes;
    const isSingleCardinality = attrs['max-choices'] === '1';
    const cardinality = isSingleCardinality ? 'single' : 'multiple';
    const responseDecl = element.responseDeclaration;
    const correctValues = getCorrectValues(responseDecl);
    const hasCorrectAnswer = hasCorrectResponse(responseDecl);
    const choiceIdentifiers = getChoiceIdentifiers(element);
    const handleAttributeChange = (key, value) => {
        const newAttrs = { ...attrs };
        if (value === '') {
            // Remove attribute if empty (except for required fields)
            if (key !== 'response-identifier' && key !== 'max-choices') {
                delete newAttrs[key];
            }
        }
        else {
            newAttrs[key] = value;
        }
        let updatedDecl = responseDecl;
        // If response-identifier changed, update it in the response declaration too
        if (key === 'response-identifier') {
            updatedDecl = updateIdentifier(updatedDecl, value);
        }
        // If max-choices changed, update the cardinality in the response declaration
        if (key === 'max-choices') {
            const newCardinality = value === '1' ? 'single' : 'multiple';
            updatedDecl = updateCardinality(updatedDecl, newCardinality);
            // If switching to single cardinality and there are multiple correct values, keep only the first
            if (newCardinality === 'single' && correctValues.length > 1) {
                updatedDecl = setCorrectValues(updatedDecl, [correctValues[0]], 'single');
            }
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
    const handleShuffleChange = (checked) => {
        const newAttrs = { ...attrs };
        if (checked) {
            newAttrs.shuffle = 'true';
        }
        else {
            delete newAttrs.shuffle;
        }
        onUpdate(path, newAttrs, responseDecl);
    };
    const handleCorrectValueToggle = (choiceId, isCorrect) => {
        let newValues = [...correctValues];
        if (isCorrect) {
            if (isSingleCardinality) {
                // Single cardinality: only one correct answer
                newValues = [choiceId];
            }
            else {
                // Multiple cardinality: add to list
                if (!newValues.includes(choiceId)) {
                    newValues.push(choiceId);
                }
            }
        }
        else {
            // Remove from list
            newValues = newValues.filter(v => v !== choiceId);
        }
        const newDecl = setCorrectValues(responseDecl, newValues, cardinality);
        onUpdate(path, attrs, newDecl);
    };
    // Mapping data
    const mappingEnabled = hasMapping(responseDecl);
    const mappingData = getMapping(responseDecl);
    const mappingEntries = (_a = mappingData === null || mappingData === void 0 ? void 0 : mappingData.entries) !== null && _a !== void 0 ? _a : [];
    const mappingMetadata = (_b = mappingData === null || mappingData === void 0 ? void 0 : mappingData.metadata) !== null && _b !== void 0 ? _b : { defaultValue: 0 };
    // Get choice identifiers that are not already mapped
    const mappedKeys = new Set(mappingEntries.map(e => e.mapKey));
    const unmappedChoices = choiceIdentifiers.filter(id => !mappedKeys.has(id));
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
        // Add a new entry with the first unmapped choice, or empty if none available
        const newEntry = {
            mapKey: unmappedChoices[0] || '',
            mappedValue: 1,
        };
        handleMappingEntriesChange([...mappingEntries, newEntry]);
    };
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Choice Interaction" }), _jsx(PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), _jsx(PropertyField, { label: "Max Choices", type: "number", value: attrs['max-choices'], onChange: (val) => handleAttributeChange('max-choices', val), required: true, min: "1" }), _jsx(PropertyField, { label: "Min Choices", type: "number", value: attrs['min-choices'] || '', onChange: (val) => handleAttributeChange('min-choices', val), min: "0" }), _jsx(PropertyCheckbox, { label: "Shuffle choices", checked: attrs.shuffle === 'true', onChange: handleShuffleChange }), _jsx(ToggleableFormSection, { label: "Set correct answer", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: _jsxs("fieldset", { className: "radio-fieldset", children: [_jsx("legend", { className: "radio-fieldset-legend", children: isSingleCardinality ? 'Correct answer' : 'Correct answers' }), isSingleCardinality ? (
                        // Radio buttons for single cardinality
                        choiceIdentifiers.map((identifier, i) => (_jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: "correct-answer", checked: correctValues.includes(identifier), onChange: () => handleCorrectValueToggle(identifier, true) }), _jsx("span", { children: identifier })] }, `${i}-${identifier}`)))) : (
                        // Checkboxes for multiple cardinality
                        choiceIdentifiers.map((identifier, i) => (_jsx(PropertyCheckbox, { label: identifier, checked: correctValues.includes(identifier), onChange: (checked) => handleCorrectValueToggle(identifier, checked) }, `${i}-${identifier}`)))), choiceIdentifiers.length === 0 && (_jsx("p", { className: "property-empty-state", children: "No choices available yet." }))] }) }), _jsxs(ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [_jsx(MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), _jsx(MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => (_jsxs("select", { value: response, onChange: (e) => onChange(e.target.value), children: [_jsx("option", { value: "", children: "Select choice..." }), unmappedChoices.map(id => (_jsx("option", { value: id, children: id }, id))), response && !unmappedChoices.includes(response) && (_jsx("option", { value: response, children: response }))] })), onAddEntry: handleAddMappingEntry, addButtonLabel: "Add choice mapping" })] })] }));
}
