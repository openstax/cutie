"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineChoicePropertiesPanel = InlineChoicePropertiesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const PropertyField_1 = require("../../components/properties/PropertyField");
const ToggleableFormSection_1 = require("../../components/properties/ToggleableFormSection");
const MappingMetadataFields_1 = require("../../components/properties/MappingMetadataFields");
const MapEntryList_1 = require("../../components/properties/MapEntryList");
const icons_1 = require("../../components/icons");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
/**
 * Generate a unique choice identifier
 */
function generateChoiceId(existingChoices) {
    const existingIds = new Set(existingChoices.map(c => c.identifier));
    let counter = 1;
    let id = `choice-${counter}`;
    while (existingIds.has(id)) {
        counter++;
        id = `choice-${counter}`;
    }
    return id;
}
/**
 * Properties panel for editing inline choice interaction attributes
 */
function InlineChoicePropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    const attrs = element.attributes;
    const responseDecl = element.responseDeclaration;
    const choices = element.choices || [];
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
    const handleCorrectAnswerChange = (identifier) => {
        const updatedDecl = (0, responseDeclaration_1.updateCorrectValue)(responseDecl, identifier);
        onUpdate(path, attrs, updatedDecl);
    };
    // Choice management
    const handleChoiceTextChange = (index, text) => {
        const newChoices = [...choices];
        newChoices[index] = { ...newChoices[index], text };
        updateChoices(newChoices);
    };
    const handleChoiceIdentifierChange = (index, identifier) => {
        const newChoices = [...choices];
        newChoices[index] = { ...newChoices[index], identifier };
        updateChoices(newChoices);
    };
    const handleChoiceFixedChange = (index, fixed) => {
        const newChoices = [...choices];
        newChoices[index] = { ...newChoices[index], fixed: fixed || undefined };
        updateChoices(newChoices);
    };
    const handleAddChoice = () => {
        const newId = generateChoiceId(choices);
        const newChoices = [...choices, { identifier: newId, text: `Option ${choices.length + 1}` }];
        updateChoices(newChoices);
    };
    const handleDeleteChoice = (index) => {
        if (choices.length <= 2) {
            // Minimum 2 choices required
            return;
        }
        const newChoices = choices.filter((_, i) => i !== index);
        updateChoices(newChoices);
    };
    const updateChoices = (newChoices) => {
        // Update choices using the additional props parameter
        onUpdate(path, attrs, responseDecl, { choices: newChoices });
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
        // Add entry for first choice that doesn't have a mapping
        const mappedKeys = new Set(mappingEntries.map(e => e.mapKey));
        const unmappedChoice = choices.find(c => !mappedKeys.has(c.identifier));
        const newEntry = {
            mapKey: (unmappedChoice === null || unmappedChoice === void 0 ? void 0 : unmappedChoice.identifier) || '',
            mappedValue: 1,
        };
        handleMappingEntriesChange([...mappingEntries, newEntry]);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-editor", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Inline Choice Interaction" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), (0, jsx_runtime_1.jsx)("div", { className: "property-field", children: (0, jsx_runtime_1.jsxs)("label", { className: "property-label", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: attrs.shuffle === 'true', onChange: (e) => handleShuffleChange(e.target.checked), style: { marginRight: '8px' } }), "Shuffle choices"] }) }), (0, jsx_runtime_1.jsxs)("div", { style: { marginTop: '16px', marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsx)("label", { className: "property-label", style: { marginBottom: '8px', display: 'block' }, children: "Choices (minimum 2)" }), choices.map((choice, index) => ((0, jsx_runtime_1.jsxs)("div", { style: {
                            paddingBottom: '10px',
                            marginBottom: '10px',
                            borderBottom: index < choices.length - 1 ? '1px solid #d1d5db' : 'none',
                        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'flex-end',
                                    marginBottom: '4px',
                                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("label", { style: {
                                                    display: 'block',
                                                    fontSize: '11px',
                                                    color: '#4b5563',
                                                    marginBottom: '2px',
                                                }, children: "ID" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "property-input", value: choice.identifier, onChange: (e) => handleChoiceIdentifierChange(index, e.target.value), style: { width: '100%', padding: '4px 8px', fontSize: '13px' } })] }), (0, jsx_runtime_1.jsxs)("label", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            color: '#374151',
                                            paddingBottom: '4px',
                                        }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: choice.fixed || false, onChange: (e) => handleChoiceFixedChange(index, e.target.checked), style: { marginRight: '4px' } }), "Fixed"] }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleDeleteChoice(index), disabled: choices.length <= 2, title: "Delete choice", style: {
                                            padding: '4px',
                                            marginBottom: '2px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            background: 'transparent',
                                            cursor: choices.length <= 2 ? 'not-allowed' : 'pointer',
                                            opacity: choices.length <= 2 ? 0.3 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: choices.length <= 2 ? '#9ca3af' : '#4b5563',
                                        }, onMouseEnter: (e) => {
                                            if (choices.length > 2) {
                                                e.currentTarget.style.color = '#dc2626';
                                            }
                                        }, onMouseLeave: (e) => {
                                            if (choices.length > 2) {
                                                e.currentTarget.style.color = '#4b5563';
                                            }
                                        }, children: (0, jsx_runtime_1.jsx)(icons_1.DeleteIcon, { size: 16 }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: {
                                            display: 'block',
                                            fontSize: '11px',
                                            color: '#4b5563',
                                            marginBottom: '2px',
                                        }, children: "Text" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "property-input", value: choice.text, onChange: (e) => handleChoiceTextChange(index, e.target.value), style: { width: '100%', padding: '4px 8px', fontSize: '13px' } })] })] }, index))), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleAddChoice, style: {
                            padding: '6px 12px',
                            border: '1px solid #2196f3',
                            borderRadius: '4px',
                            background: '#fff',
                            color: '#2196f3',
                            cursor: 'pointer',
                            fontSize: '13px',
                        }, children: "+ Add Choice" })] }), (0, jsx_runtime_1.jsx)(ToggleableFormSection_1.ToggleableFormSection, { label: "Set correct answer", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: (0, jsx_runtime_1.jsxs)("fieldset", { className: "radio-fieldset", children: [(0, jsx_runtime_1.jsx)("legend", { className: "radio-fieldset-legend", children: "Correct choice" }), choices.map((choice) => ((0, jsx_runtime_1.jsxs)("label", { className: "radio-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "correct-choice", value: choice.identifier, checked: correctValue === choice.identifier, onChange: (e) => handleCorrectAnswerChange(e.target.value) }), (0, jsx_runtime_1.jsxs)("span", { children: [choice.identifier, ": ", choice.text] })] }, choice.identifier)))] }) }), (0, jsx_runtime_1.jsxs)(ToggleableFormSection_1.ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [(0, jsx_runtime_1.jsx)(MappingMetadataFields_1.MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), (0, jsx_runtime_1.jsx)(MapEntryList_1.MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => ((0, jsx_runtime_1.jsxs)("select", { className: "property-select", value: response, onChange: (e) => onChange(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select choice..." }), choices.map((choice) => ((0, jsx_runtime_1.jsxs)("option", { value: choice.identifier, children: [choice.identifier, ": ", choice.text] }, choice.identifier)))] })), onAddEntry: handleAddMappingEntry, addButtonLabel: "Add choice mapping" })] })] }));
}
