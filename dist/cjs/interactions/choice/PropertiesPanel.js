"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChoicePropertiesPanel = ChoicePropertiesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const PropertyField_1 = require("../../components/properties/PropertyField");
const PropertyCheckbox_1 = require("../../components/properties/PropertyCheckbox");
const ToggleableFormSection_1 = require("../../components/properties/ToggleableFormSection");
const MappingMetadataFields_1 = require("../../components/properties/MappingMetadataFields");
const MapEntryList_1 = require("../../components/properties/MapEntryList");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
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
function ChoicePropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    const attrs = element.attributes;
    const isSingleCardinality = attrs['max-choices'] === '1';
    const cardinality = isSingleCardinality ? 'single' : 'multiple';
    const responseDecl = element.responseDeclaration;
    const correctValues = (0, responseDeclaration_1.getCorrectValues)(responseDecl);
    const hasCorrectAnswer = (0, responseDeclaration_1.hasCorrectResponse)(responseDecl);
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
            updatedDecl = (0, responseDeclaration_1.updateIdentifier)(updatedDecl, value);
        }
        // If max-choices changed, update the cardinality in the response declaration
        if (key === 'max-choices') {
            const newCardinality = value === '1' ? 'single' : 'multiple';
            updatedDecl = (0, responseDeclaration_1.updateCardinality)(updatedDecl, newCardinality);
            // If switching to single cardinality and there are multiple correct values, keep only the first
            if (newCardinality === 'single' && correctValues.length > 1) {
                updatedDecl = (0, responseDeclaration_1.setCorrectValues)(updatedDecl, [correctValues[0]], 'single');
            }
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
        const newDecl = (0, responseDeclaration_1.setCorrectValues)(responseDecl, newValues, cardinality);
        onUpdate(path, attrs, newDecl);
    };
    // Mapping data
    const mappingEnabled = (0, mappingDeclaration_1.hasMapping)(responseDecl);
    const mappingData = (0, mappingDeclaration_1.getMapping)(responseDecl);
    const mappingEntries = (_a = mappingData === null || mappingData === void 0 ? void 0 : mappingData.entries) !== null && _a !== void 0 ? _a : [];
    const mappingMetadata = (_b = mappingData === null || mappingData === void 0 ? void 0 : mappingData.metadata) !== null && _b !== void 0 ? _b : { defaultValue: 0 };
    // Get choice identifiers that are not already mapped
    const mappedKeys = new Set(mappingEntries.map(e => e.mapKey));
    const unmappedChoices = choiceIdentifiers.filter(id => !mappedKeys.has(id));
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
        // Add a new entry with the first unmapped choice, or empty if none available
        const newEntry = {
            mapKey: unmappedChoices[0] || '',
            mappedValue: 1,
        };
        handleMappingEntriesChange([...mappingEntries, newEntry]);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-editor", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Choice Interaction" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Max Choices", type: "number", value: attrs['max-choices'], onChange: (val) => handleAttributeChange('max-choices', val), required: true, min: "1" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Min Choices", type: "number", value: attrs['min-choices'] || '', onChange: (val) => handleAttributeChange('min-choices', val), min: "0" }), (0, jsx_runtime_1.jsx)(PropertyCheckbox_1.PropertyCheckbox, { label: "Shuffle choices", checked: attrs.shuffle === 'true', onChange: handleShuffleChange }), (0, jsx_runtime_1.jsx)(ToggleableFormSection_1.ToggleableFormSection, { label: "Set correct answer", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: (0, jsx_runtime_1.jsxs)("fieldset", { className: "radio-fieldset", children: [(0, jsx_runtime_1.jsx)("legend", { className: "radio-fieldset-legend", children: isSingleCardinality ? 'Correct answer' : 'Correct answers' }), isSingleCardinality ? (
                        // Radio buttons for single cardinality
                        choiceIdentifiers.map((identifier, i) => ((0, jsx_runtime_1.jsxs)("label", { className: "radio-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "correct-answer", checked: correctValues.includes(identifier), onChange: () => handleCorrectValueToggle(identifier, true) }), (0, jsx_runtime_1.jsx)("span", { children: identifier })] }, `${i}-${identifier}`)))) : (
                        // Checkboxes for multiple cardinality
                        choiceIdentifiers.map((identifier, i) => ((0, jsx_runtime_1.jsx)(PropertyCheckbox_1.PropertyCheckbox, { label: identifier, checked: correctValues.includes(identifier), onChange: (checked) => handleCorrectValueToggle(identifier, checked) }, `${i}-${identifier}`)))), choiceIdentifiers.length === 0 && ((0, jsx_runtime_1.jsx)("p", { className: "property-empty-state", children: "No choices available yet." }))] }) }), (0, jsx_runtime_1.jsxs)(ToggleableFormSection_1.ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [(0, jsx_runtime_1.jsx)(MappingMetadataFields_1.MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), (0, jsx_runtime_1.jsx)(MapEntryList_1.MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => ((0, jsx_runtime_1.jsxs)("select", { value: response, onChange: (e) => onChange(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select choice..." }), unmappedChoices.map(id => ((0, jsx_runtime_1.jsx)("option", { value: id, children: id }, id))), response && !unmappedChoices.includes(response) && ((0, jsx_runtime_1.jsx)("option", { value: response, children: response }))] })), onAddEntry: handleAddMappingEntry, addButtonLabel: "Add choice mapping" })] })] }));
}
