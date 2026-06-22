"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchPropertiesPanel = MatchPropertiesPanel;
exports.SimpleAssociableChoicePropertiesPanel = SimpleAssociableChoicePropertiesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_1 = require("slate");
const slate_react_1 = require("slate-react");
const icons_1 = require("../../components/icons");
const MapEntryList_1 = require("../../components/properties/MapEntryList");
const MappingMetadataFields_1 = require("../../components/properties/MappingMetadataFields");
const PropertyCheckbox_1 = require("../../components/properties/PropertyCheckbox");
const PropertyField_1 = require("../../components/properties/PropertyField");
const ToggleableFormSection_1 = require("../../components/properties/ToggleableFormSection");
const useStyle_1 = require("../../hooks/useStyle");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const insertion_1 = require("./insertion");
/**
 * Get source choice identifiers from the element
 */
function getSourceIdentifiers(element) {
    const sourceSet = element.children.find((child) => 'type' in child && child.type === 'match-source-set');
    if (!sourceSet)
        return [];
    return sourceSet.children
        .filter((child) => 'type' in child && child.type === 'qti-simple-associable-choice')
        .map((choice) => choice.attributes.identifier)
        .filter(Boolean);
}
/**
 * Get target choice identifiers from the element
 */
function getTargetIdentifiers(element) {
    const targetSet = element.children.find((child) => 'type' in child && child.type === 'match-target-set');
    if (!targetSet)
        return [];
    return targetSet.children
        .filter((child) => 'type' in child && child.type === 'qti-simple-associable-choice')
        .map((choice) => choice.attributes.identifier)
        .filter(Boolean);
}
/**
 * Set correct values with directedPair format
 */
function setCorrectPairValues(decl, values) {
    // Remove old correct response
    const otherChildren = decl.children.filter((c) => typeof c !== 'string' && c.tagName !== 'qti-correct-response');
    if (values.length === 0) {
        return {
            tagName: decl.tagName,
            attributes: { ...decl.attributes },
            children: otherChildren,
        };
    }
    const correctResponse = {
        tagName: 'qti-correct-response',
        attributes: {},
        children: values.map((v) => ({
            tagName: 'qti-value',
            attributes: {},
            children: [v],
        })),
    };
    return {
        tagName: decl.tagName,
        attributes: { ...decl.attributes },
        children: [...otherChildren, correctResponse],
    };
}
/**
 * Add an empty correct response to a declaration
 */
function addEmptyCorrectResponseForMatch(decl) {
    const cleanDecl = (0, responseDeclaration_1.removeCorrectResponse)(decl);
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
 * Properties panel for editing match interaction attributes
 */
function MatchPropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    (0, useStyle_1.useStyle)('match-pairings', MATCH_PAIRINGS_STYLES);
    const attrs = element.attributes;
    const responseDecl = element.responseDeclaration;
    const sourceIdentifiers = getSourceIdentifiers(element);
    const targetIdentifiers = getTargetIdentifiers(element);
    const correctValues = (0, responseDeclaration_1.getCorrectValues)(responseDecl);
    const hasCorrectAnswer = (0, responseDeclaration_1.hasCorrectResponse)(responseDecl);
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
        // If response-identifier changed, update it in the response declaration too
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
            const updatedDecl = addEmptyCorrectResponseForMatch(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
        else {
            const updatedDecl = (0, responseDeclaration_1.removeCorrectResponse)(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
    };
    const handleAddPairing = () => {
        const defaultSource = sourceIdentifiers[0] || '';
        const defaultTarget = targetIdentifiers[0] || '';
        if (defaultSource && defaultTarget) {
            const newPairing = `${defaultSource} ${defaultTarget}`;
            const newValues = [...correctValues, newPairing];
            const updatedDecl = setCorrectPairValues(responseDecl, newValues);
            onUpdate(path, attrs, updatedDecl);
        }
    };
    const handleRemovePairing = (index) => {
        const newValues = correctValues.filter((_, i) => i !== index);
        const updatedDecl = setCorrectPairValues(responseDecl, newValues);
        onUpdate(path, attrs, updatedDecl);
    };
    const handlePairingChange = (index, source, target) => {
        const newValues = [...correctValues];
        newValues[index] = `${source} ${target}`;
        const updatedDecl = setCorrectPairValues(responseDecl, newValues);
        onUpdate(path, attrs, updatedDecl);
    };
    // Mapping data
    const mappingEnabled = (0, mappingDeclaration_1.hasMapping)(responseDecl);
    const mappingData = (0, mappingDeclaration_1.getMapping)(responseDecl);
    const mappingEntries = (_a = mappingData === null || mappingData === void 0 ? void 0 : mappingData.entries) !== null && _a !== void 0 ? _a : [];
    const mappingMetadata = (_b = mappingData === null || mappingData === void 0 ? void 0 : mappingData.metadata) !== null && _b !== void 0 ? _b : { defaultValue: 0 };
    const handleToggleMapping = (enabled) => {
        if (enabled) {
            const updatedDecl = (0, mappingDeclaration_1.addEmptyMapping)(responseDecl, -1);
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
        const defaultSource = sourceIdentifiers[0] || '';
        const defaultTarget = targetIdentifiers[0] || '';
        const newEntry = {
            mapKey: defaultSource && defaultTarget ? `${defaultSource} ${defaultTarget}` : '',
            mappedValue: 1,
        };
        handleMappingEntriesChange([...mappingEntries, newEntry]);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-editor", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Match Interaction" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Max Associations", type: "number", value: attrs['max-associations'] || '', onChange: (val) => handleAttributeChange('max-associations', val), min: "0" }), (0, jsx_runtime_1.jsx)(PropertyCheckbox_1.PropertyCheckbox, { label: "Shuffle choices", checked: attrs.shuffle === 'true', onChange: handleShuffleChange }), (0, jsx_runtime_1.jsx)(ToggleableFormSection_1.ToggleableFormSection, { label: "Set correct answers", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: (0, jsx_runtime_1.jsxs)("fieldset", { className: "radio-fieldset", children: [(0, jsx_runtime_1.jsx)("legend", { className: "radio-fieldset-legend", children: "Correct pairings" }), sourceIdentifiers.length === 0 || targetIdentifiers.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "property-empty-state", children: "Add source and target items to set correct answers." })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [correctValues.map((value, index) => {
                                    const parts = value.split(' ');
                                    const currentSource = parts[0] || '';
                                    const currentTarget = parts[1] || '';
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "match-pairing-row", children: [(0, jsx_runtime_1.jsxs)("select", { value: currentSource, onChange: (e) => handlePairingChange(index, e.target.value, currentTarget), className: "property-select", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Source..." }), sourceIdentifiers.map((id) => ((0, jsx_runtime_1.jsx)("option", { value: id, children: id }, id)))] }), (0, jsx_runtime_1.jsx)("span", { className: "match-pairing-arrow", children: "\u2192" }), (0, jsx_runtime_1.jsxs)("select", { value: currentTarget, onChange: (e) => handlePairingChange(index, currentSource, e.target.value), className: "property-select", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Target..." }), targetIdentifiers.map((id) => ((0, jsx_runtime_1.jsx)("option", { value: id, children: id }, id)))] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "match-pairing-remove-btn", onClick: () => handleRemovePairing(index), title: "Remove pairing", children: "\u00D7" })] }, index));
                                }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "match-pairing-add-btn", onClick: handleAddPairing, children: "+ Add pairing" })] }))] }) }), (0, jsx_runtime_1.jsxs)(ToggleableFormSection_1.ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [(0, jsx_runtime_1.jsx)(MappingMetadataFields_1.MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), (0, jsx_runtime_1.jsx)(MapEntryList_1.MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => {
                            const parts = response.split(' ');
                            const currentSource = parts[0] || '';
                            const currentTarget = parts[1] || '';
                            const handleSourceChange = (source) => {
                                onChange(`${source} ${currentTarget}`.trim());
                            };
                            const handleTargetChange = (target) => {
                                onChange(`${currentSource} ${target}`.trim());
                            };
                            return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '4px', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsxs)("select", { value: currentSource, onChange: (e) => handleSourceChange(e.target.value), className: "property-select", style: { flex: 1, minWidth: 0 }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Source..." }), sourceIdentifiers.map((id) => ((0, jsx_runtime_1.jsx)("option", { value: id, children: id }, id)))] }), (0, jsx_runtime_1.jsx)("span", { style: { color: '#666', fontSize: '12px' }, children: "\u2192" }), (0, jsx_runtime_1.jsxs)("select", { value: currentTarget, onChange: (e) => handleTargetChange(e.target.value), className: "property-select", style: { flex: 1, minWidth: 0 }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Target..." }), targetIdentifiers.map((id) => ((0, jsx_runtime_1.jsx)("option", { value: id, children: id }, id)))] })] }));
                        }, onAddEntry: handleAddMappingEntry, addButtonLabel: "Add pair mapping" })] })] }));
}
function SimpleAssociableChoicePropertiesPanel({ element, path, onUpdate, }) {
    const editor = (0, slate_react_1.useSlate)();
    (0, useStyle_1.useStyle)('match-choice-actions', MATCH_CHOICE_ACTIONS_STYLES);
    const attrs = element.attributes;
    // Get parent set container and position info
    const parentPath = path.slice(0, -1);
    const myIndex = path[path.length - 1];
    const parent = slate_1.Node.get(editor, parentPath);
    // Determine if this is in source or target set
    const isSourceSet = parent.type === 'match-source-set';
    const setLabel = isSourceSet ? 'Source' : 'Target';
    // Count choices
    const choices = parent.children.filter((c) => 'type' in c && c.type === 'qti-simple-associable-choice');
    const choiceCount = choices.length;
    const isFirstChoice = myIndex === 0;
    const isLastChoice = myIndex === choiceCount - 1;
    const canDelete = choiceCount > 1;
    // Get interaction path for generating new IDs
    const interactionPath = parentPath.slice(0, -1);
    const handleAttributeChange = (key, value) => {
        const newAttrs = { ...attrs };
        if (value === '') {
            if (key !== 'identifier') {
                delete newAttrs[key];
            }
        }
        else {
            newAttrs[key] = value;
        }
        onUpdate(path, newAttrs);
    };
    const handleMoveUp = () => {
        if (isFirstChoice)
            return;
        slate_1.Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, myIndex - 1],
        });
    };
    const handleMoveDown = () => {
        if (isLastChoice)
            return;
        slate_1.Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, myIndex + 2],
        });
    };
    const handleDelete = () => {
        if (!canDelete)
            return;
        slate_1.Transforms.removeNodes(editor, { at: path });
    };
    const handleAddChoice = () => {
        const newId = isSourceSet
            ? (0, insertion_1.generateSourceId)(editor, interactionPath)
            : (0, insertion_1.generateTargetId)(editor, interactionPath);
        const newChoice = {
            type: 'qti-simple-associable-choice',
            attributes: { identifier: newId, 'match-max': '1' },
            children: [{ text: `${setLabel} ${newId}` }],
        };
        // Insert after current choice
        slate_1.Transforms.insertNodes(editor, newChoice, {
            at: [...parentPath, myIndex + 1],
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-editor", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [setLabel, " Choice"] }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Identifier", value: attrs.identifier, onChange: (val) => handleAttributeChange('identifier', val), required: true }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Match Max", type: "number", value: attrs['match-max'] || '1', onChange: (val) => handleAttributeChange('match-max', val), min: "0" }), (0, jsx_runtime_1.jsx)(PropertyCheckbox_1.PropertyCheckbox, { label: "Fixed position", checked: attrs.fixed === 'true', onChange: (checked) => handleAttributeChange('fixed', checked ? 'true' : '') }), (0, jsx_runtime_1.jsxs)("div", { className: "match-choice-actions", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "match-choice-action-btn", onClick: handleMoveUp, disabled: isFirstChoice, title: "Move up", children: (0, jsx_runtime_1.jsx)(icons_1.ArrowUpIcon, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "match-choice-action-btn", onClick: handleMoveDown, disabled: isLastChoice, title: "Move down", children: (0, jsx_runtime_1.jsx)(icons_1.ArrowDownIcon, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "match-choice-action-btn match-choice-action-btn-delete", onClick: handleDelete, disabled: !canDelete, title: canDelete ? 'Delete choice' : 'Cannot delete (minimum 1 choice)', children: (0, jsx_runtime_1.jsx)(icons_1.DeleteIcon, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "match-choice-action-btn match-choice-action-btn-add", onClick: handleAddChoice, title: "Add choice", children: (0, jsx_runtime_1.jsx)(icons_1.AddIcon, { size: 16 }) })] })] }));
}
const MATCH_PAIRINGS_STYLES = `
  .match-pairing-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr 28px;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .match-pairing-row select {
    width: 100%;
    min-width: 0;
  }

  .match-pairing-arrow {
    color: #666;
    fontSize: 12px;
  }

  .match-pairing-remove-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s, color 0.15s;
  }

  .match-pairing-remove-btn:hover {
    background-color: #ffebee;
    color: #d32f2f;
  }

  .match-pairing-add-btn {
    width: 100%;
    padding: 8px;
    border: 1px dashed #ccc;
    border-radius: 4px;
    background: transparent;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
    margin-top: 4px;
  }

  .match-pairing-add-btn:hover {
    background-color: #f5f5f5;
    border-color: #2196f3;
    color: #2196f3;
  }
`;
const MATCH_CHOICE_ACTIONS_STYLES = `
  .match-choice-actions {
    display: flex;
    gap: 4px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  .match-choice-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    color: #555;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  }

  .match-choice-action-btn:hover:not(:disabled) {
    background-color: #f5f5f5;
    border-color: #bbb;
    color: #333;
  }

  .match-choice-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .match-choice-action-btn-delete:hover:not(:disabled) {
    background-color: #ffebee;
    border-color: #ef9a9a;
    color: #c62828;
  }

  .match-choice-action-btn-add:hover:not(:disabled) {
    background-color: #e8f5e9;
    border-color: #a5d6a7;
    color: #2e7d32;
  }
`;
