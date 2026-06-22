import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { MapEntryList } from '../../components/properties/MapEntryList';
import { DeleteIcon } from '../../components/icons';
import { getCorrectValue, hasCorrectResponse, removeCorrectResponse, addEmptyCorrectResponse, updateIdentifier, updateCorrectValue, } from '../../utils/responseDeclaration';
import { hasMapping, getMapping, removeMapping, addEmptyMapping, updateMapping, } from '../../utils/mappingDeclaration';
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
export function InlineChoicePropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    const attrs = element.attributes;
    const responseDecl = element.responseDeclaration;
    const choices = element.choices || [];
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
            const updatedDecl = addEmptyCorrectResponse(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
        else {
            const updatedDecl = removeCorrectResponse(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
    };
    const handleCorrectAnswerChange = (identifier) => {
        const updatedDecl = updateCorrectValue(responseDecl, identifier);
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
        // Add entry for first choice that doesn't have a mapping
        const mappedKeys = new Set(mappingEntries.map(e => e.mapKey));
        const unmappedChoice = choices.find(c => !mappedKeys.has(c.identifier));
        const newEntry = {
            mapKey: (unmappedChoice === null || unmappedChoice === void 0 ? void 0 : unmappedChoice.identifier) || '',
            mappedValue: 1,
        };
        handleMappingEntriesChange([...mappingEntries, newEntry]);
    };
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Inline Choice Interaction" }), _jsx(PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), _jsx("div", { className: "property-field", children: _jsxs("label", { className: "property-label", children: [_jsx("input", { type: "checkbox", checked: attrs.shuffle === 'true', onChange: (e) => handleShuffleChange(e.target.checked), style: { marginRight: '8px' } }), "Shuffle choices"] }) }), _jsxs("div", { style: { marginTop: '16px', marginBottom: '16px' }, children: [_jsx("label", { className: "property-label", style: { marginBottom: '8px', display: 'block' }, children: "Choices (minimum 2)" }), choices.map((choice, index) => (_jsxs("div", { style: {
                            paddingBottom: '10px',
                            marginBottom: '10px',
                            borderBottom: index < choices.length - 1 ? '1px solid #d1d5db' : 'none',
                        }, children: [_jsxs("div", { style: {
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'flex-end',
                                    marginBottom: '4px',
                                }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: {
                                                    display: 'block',
                                                    fontSize: '11px',
                                                    color: '#4b5563',
                                                    marginBottom: '2px',
                                                }, children: "ID" }), _jsx("input", { type: "text", className: "property-input", value: choice.identifier, onChange: (e) => handleChoiceIdentifierChange(index, e.target.value), style: { width: '100%', padding: '4px 8px', fontSize: '13px' } })] }), _jsxs("label", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            color: '#374151',
                                            paddingBottom: '4px',
                                        }, children: [_jsx("input", { type: "checkbox", checked: choice.fixed || false, onChange: (e) => handleChoiceFixedChange(index, e.target.checked), style: { marginRight: '4px' } }), "Fixed"] }), _jsx("button", { type: "button", onClick: () => handleDeleteChoice(index), disabled: choices.length <= 2, title: "Delete choice", style: {
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
                                        }, children: _jsx(DeleteIcon, { size: 16 }) })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '11px',
                                            color: '#4b5563',
                                            marginBottom: '2px',
                                        }, children: "Text" }), _jsx("input", { type: "text", className: "property-input", value: choice.text, onChange: (e) => handleChoiceTextChange(index, e.target.value), style: { width: '100%', padding: '4px 8px', fontSize: '13px' } })] })] }, index))), _jsx("button", { type: "button", onClick: handleAddChoice, style: {
                            padding: '6px 12px',
                            border: '1px solid #2196f3',
                            borderRadius: '4px',
                            background: '#fff',
                            color: '#2196f3',
                            cursor: 'pointer',
                            fontSize: '13px',
                        }, children: "+ Add Choice" })] }), _jsx(ToggleableFormSection, { label: "Set correct answer", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: _jsxs("fieldset", { className: "radio-fieldset", children: [_jsx("legend", { className: "radio-fieldset-legend", children: "Correct choice" }), choices.map((choice) => (_jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: "correct-choice", value: choice.identifier, checked: correctValue === choice.identifier, onChange: (e) => handleCorrectAnswerChange(e.target.value) }), _jsxs("span", { children: [choice.identifier, ": ", choice.text] })] }, choice.identifier)))] }) }), _jsxs(ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [_jsx(MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), _jsx(MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => (_jsxs("select", { className: "property-select", value: response, onChange: (e) => onChange(e.target.value), children: [_jsx("option", { value: "", children: "Select choice..." }), choices.map((choice) => (_jsxs("option", { value: choice.identifier, children: [choice.identifier, ": ", choice.text] }, choice.identifier)))] })), onAddEntry: handleAddMappingEntry, addButtonLabel: "Add choice mapping" })] })] }));
}
