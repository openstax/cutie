import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Editor, Element, Node, Transforms } from 'slate';
import { useSlate } from 'slate-react';
import { AddIcon, ArrowDownIcon, ArrowUpIcon, DeleteIcon } from '../../components/icons';
import { MapEntryList } from '../../components/properties/MapEntryList';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { useStyle } from '../../hooks/useStyle';
import { addEmptyMapping, getMapping, hasMapping, removeMapping, updateMapping, } from '../../utils/mappingDeclaration';
import { getCorrectValues, hasCorrectResponse, removeCorrectResponse, updateIdentifier, } from '../../utils/responseDeclaration';
import { generateChoiceId, insertGapOrChoiceAtSelection } from './insertion';
/**
 * Get choice identifiers from the element
 */
function getChoiceIdentifiers(element) {
    const choicesContainer = element.children.find((child) => 'type' in child && child.type === 'gap-match-choices');
    if (!choicesContainer)
        return [];
    return choicesContainer.children
        .filter((child) => 'type' in child && (child.type === 'qti-gap-text' || child.type === 'qti-gap-img'))
        .map((choice) => choice.attributes.identifier)
        .filter(Boolean);
}
/**
 * Get gap identifiers from the element's content
 */
function getGapIdentifiers(editor, path) {
    const gaps = [];
    for (const [node] of Editor.nodes(editor, {
        at: path,
        match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-gap',
    })) {
        if (Element.isElement(node) && 'attributes' in node) {
            const attrs = node.attributes;
            if (attrs.identifier) {
                gaps.push(attrs.identifier);
            }
        }
    }
    return gaps;
}
/**
 * Parse directedPair values into a map of gap -> choice
 */
function parseCorrectPairings(correctValues) {
    const pairings = new Map();
    for (const value of correctValues) {
        const parts = value.split(' ');
        if (parts.length === 2) {
            const [choice, gap] = parts;
            pairings.set(gap, choice);
        }
    }
    return pairings;
}
/**
 * Convert a map of gap -> choice to directedPair values
 */
function pairingsToCorrectValues(pairings) {
    return Array.from(pairings.entries()).map(([gap, choice]) => `${choice} ${gap}`);
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
function addEmptyCorrectResponseForGapMatch(decl) {
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
 * Properties panel for editing gap-match interaction attributes
 */
export function GapMatchPropertiesPanel({ element, path, onUpdate, }) {
    var _a, _b;
    const editor = useSlate();
    const attrs = element.attributes;
    const responseDecl = element.responseDeclaration;
    const choiceIdentifiers = getChoiceIdentifiers(element);
    const gapIdentifiers = getGapIdentifiers(editor, path);
    const correctValues = getCorrectValues(responseDecl);
    const hasCorrectAnswer = hasCorrectResponse(responseDecl);
    const correctPairings = parseCorrectPairings(correctValues);
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
            const updatedDecl = addEmptyCorrectResponseForGapMatch(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
        else {
            const updatedDecl = removeCorrectResponse(responseDecl);
            onUpdate(path, attrs, updatedDecl);
        }
    };
    const handleCorrectPairingChange = (gapId, choiceId) => {
        const newPairings = new Map(correctPairings);
        if (choiceId === null || choiceId === '') {
            newPairings.delete(gapId);
        }
        else {
            newPairings.set(gapId, choiceId);
        }
        const newValues = pairingsToCorrectValues(newPairings);
        const updatedDecl = setCorrectPairValues(responseDecl, newValues);
        onUpdate(path, attrs, updatedDecl);
    };
    // Mapping data
    const mappingEnabled = hasMapping(responseDecl);
    const mappingData = getMapping(responseDecl);
    const mappingEntries = (_a = mappingData === null || mappingData === void 0 ? void 0 : mappingData.entries) !== null && _a !== void 0 ? _a : [];
    const mappingMetadata = (_b = mappingData === null || mappingData === void 0 ? void 0 : mappingData.metadata) !== null && _b !== void 0 ? _b : { defaultValue: 0 };
    const handleToggleMapping = (enabled) => {
        if (enabled) {
            const updatedDecl = addEmptyMapping(responseDecl, -1);
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
        // Default to first choice and first gap if available
        const defaultChoice = choiceIdentifiers[0] || '';
        const defaultGap = gapIdentifiers[0] || '';
        const newEntry = {
            mapKey: defaultChoice && defaultGap ? `${defaultChoice} ${defaultGap}` : '',
            mappedValue: 1,
        };
        handleMappingEntriesChange([...mappingEntries, newEntry]);
    };
    const handleAddGapAtCursor = () => {
        insertGapOrChoiceAtSelection(editor);
    };
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Gap Match Interaction" }), _jsx(PropertyField, { label: "Response Identifier", value: attrs['response-identifier'], onChange: (val) => handleAttributeChange('response-identifier', val), required: true }), _jsx(PropertyCheckbox, { label: "Shuffle choices", checked: attrs.shuffle === 'true', onChange: handleShuffleChange }), _jsxs("div", { style: { marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }, children: [_jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: handleAddGapAtCursor, style: {
                            padding: '6px 12px',
                            fontSize: '13px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "Add gap at cursor" }), _jsx("p", { style: { margin: '8px 0 0 0', fontSize: '12px', color: '#666' }, children: "Position cursor in content, or select text to create a choice." })] }), _jsx(ToggleableFormSection, { label: "Set correct answers", enabled: hasCorrectAnswer, onToggle: handleToggleCorrectAnswer, children: _jsxs("fieldset", { className: "radio-fieldset", children: [_jsx("legend", { className: "radio-fieldset-legend", children: "Correct pairings" }), gapIdentifiers.length === 0 ? (_jsx("p", { className: "property-empty-state", children: "Add gaps to set correct answers." })) : (gapIdentifiers.map((gapId) => (_jsxs("div", { style: { marginBottom: '12px' }, children: [_jsxs("label", { style: { display: 'block', fontSize: '13px', marginBottom: '4px' }, children: ["Gap ", gapId, " ="] }), _jsxs("select", { value: correctPairings.get(gapId) || '', onChange: (e) => handleCorrectPairingChange(gapId, e.target.value || null), className: "property-select", children: [_jsx("option", { value: "", children: "Select choice..." }), choiceIdentifiers.map((choiceId) => (_jsx("option", { value: choiceId, children: choiceId }, choiceId)))] })] }, gapId))))] }) }), _jsxs(ToggleableFormSection, { label: "Response mapping", enabled: mappingEnabled, onToggle: handleToggleMapping, children: [_jsx(MappingMetadataFields, { metadata: mappingMetadata, onChange: handleMappingMetadataChange }), _jsx(MapEntryList, { entries: mappingEntries, onEntriesChange: handleMappingEntriesChange, responseDisplay: (response, onChange) => {
                            // Parse "CHOICE GAP" format (e.g., "A G1")
                            const parts = response.split(' ');
                            const currentChoice = parts[0] || '';
                            const currentGap = parts[1] || '';
                            const handleChoiceChange = (choice) => {
                                onChange(`${choice} ${currentGap}`.trim());
                            };
                            const handleGapChange = (gap) => {
                                onChange(`${currentChoice} ${gap}`.trim());
                            };
                            return (_jsxs("div", { style: { display: 'flex', gap: '4px', alignItems: 'center' }, children: [_jsxs("select", { value: currentChoice, onChange: (e) => handleChoiceChange(e.target.value), className: "property-select", style: { flex: 1, minWidth: 0 }, children: [_jsx("option", { value: "", children: "Choice..." }), choiceIdentifiers.map((id) => (_jsx("option", { value: id, children: id }, id)))] }), _jsx("span", { style: { color: '#666', fontSize: '12px' }, children: "\u2192" }), _jsxs("select", { value: currentGap, onChange: (e) => handleGapChange(e.target.value), className: "property-select", style: { flex: 1, minWidth: 0 }, children: [_jsx("option", { value: "", children: "Gap..." }), gapIdentifiers.map((id) => (_jsx("option", { value: id, children: id }, id)))] })] }));
                        }, onAddEntry: handleAddMappingEntry, addButtonLabel: "Add pair mapping" })] })] }));
}
export function GapTextPropertiesPanel({ element, path, onUpdate, }) {
    const editor = useSlate();
    useStyle('gap-text-actions', GAP_TEXT_ACTIONS_STYLES);
    const attrs = element.attributes;
    // Get parent choices container and position info
    const parentPath = path.slice(0, -1);
    const myIndex = path[path.length - 1];
    const parent = Node.get(editor, parentPath);
    // Count choices
    const choices = parent.children.filter((c) => 'type' in c && (c.type === 'qti-gap-text' || c.type === 'qti-gap-img'));
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
    const handleMoveLeft = () => {
        if (isFirstChoice)
            return;
        Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, myIndex - 1],
        });
    };
    const handleMoveRight = () => {
        if (isLastChoice)
            return;
        Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, myIndex + 2],
        });
    };
    const handleDelete = () => {
        if (!canDelete)
            return;
        Transforms.removeNodes(editor, { at: path });
    };
    const handleAddChoice = () => {
        const newId = generateChoiceId(editor, interactionPath);
        const newChoice = {
            type: 'qti-gap-text',
            attributes: { identifier: newId, 'match-max': '1' },
            children: [{ text: `Choice ${newId}` }],
        };
        // Insert after current choice
        Transforms.insertNodes(editor, newChoice, {
            at: [...parentPath, myIndex + 1],
        });
    };
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Gap Text Choice" }), _jsx(PropertyField, { label: "Identifier", value: attrs.identifier, onChange: (val) => handleAttributeChange('identifier', val), required: true }), _jsx(PropertyField, { label: "Match Max", type: "number", value: attrs['match-max'] || '1', onChange: (val) => handleAttributeChange('match-max', val), min: "0" }), _jsx(PropertyCheckbox, { label: "Fixed position", checked: attrs.fixed === 'true', onChange: (checked) => handleAttributeChange('fixed', checked ? 'true' : '') }), _jsxs("div", { className: "gap-text-actions", children: [_jsx("button", { type: "button", className: "gap-text-action-btn", onClick: handleMoveLeft, disabled: isFirstChoice, title: "Move left", children: _jsx(ArrowUpIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "gap-text-action-btn", onClick: handleMoveRight, disabled: isLastChoice, title: "Move right", children: _jsx(ArrowDownIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "gap-text-action-btn gap-text-action-btn-delete", onClick: handleDelete, disabled: !canDelete, title: canDelete ? 'Delete choice' : 'Cannot delete (minimum 1 choice)', children: _jsx(DeleteIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "gap-text-action-btn gap-text-action-btn-add", onClick: handleAddChoice, title: "Add choice", children: _jsx(AddIcon, { size: 16 }) })] })] }));
}
const GAP_TEXT_ACTIONS_STYLES = `
  .gap-text-actions {
    display: flex;
    gap: 4px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  .gap-text-action-btn {
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

  .gap-text-action-btn:hover:not(:disabled) {
    background-color: #f5f5f5;
    border-color: #bbb;
    color: #333;
  }

  .gap-text-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .gap-text-action-btn-delete:hover:not(:disabled) {
    background-color: #ffebee;
    border-color: #ef9a9a;
    color: #c62828;
  }

  .gap-text-action-btn-add:hover:not(:disabled) {
    background-color: #e8f5e9;
    border-color: #a5d6a7;
    color: #2e7d32;
  }
`;
export function GapImgPropertiesPanel({ element, path, onUpdate, }) {
    const editor = useSlate();
    useStyle('gap-text-actions', GAP_TEXT_ACTIONS_STYLES);
    const attrs = element.attributes;
    // Get parent choices container and position info
    const parentPath = path.slice(0, -1);
    const myIndex = path[path.length - 1];
    const parent = Node.get(editor, parentPath);
    // Count choices
    const choices = parent.children.filter((c) => 'type' in c && (c.type === 'qti-gap-text' || c.type === 'qti-gap-img'));
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
    const handleMoveLeft = () => {
        if (isFirstChoice)
            return;
        Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, myIndex - 1],
        });
    };
    const handleMoveRight = () => {
        if (isLastChoice)
            return;
        Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, myIndex + 2],
        });
    };
    const handleDelete = () => {
        if (!canDelete)
            return;
        Transforms.removeNodes(editor, { at: path });
    };
    const handleAddChoice = () => {
        const newId = generateChoiceId(editor, interactionPath);
        const newChoice = {
            type: 'qti-gap-text',
            attributes: { identifier: newId, 'match-max': '1' },
            children: [{ text: `Choice ${newId}` }],
        };
        // Insert after current choice
        Transforms.insertNodes(editor, newChoice, {
            at: [...parentPath, myIndex + 1],
        });
    };
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Gap Image Choice" }), _jsx(PropertyField, { label: "Identifier", value: attrs.identifier, onChange: (val) => handleAttributeChange('identifier', val), required: true }), _jsx(PropertyField, { label: "Match Max", type: "number", value: attrs['match-max'] || '1', onChange: (val) => handleAttributeChange('match-max', val), min: "0" }), _jsx(PropertyCheckbox, { label: "Fixed position", checked: attrs.fixed === 'true', onChange: (checked) => handleAttributeChange('fixed', checked ? 'true' : '') }), _jsxs("div", { className: "gap-text-actions", children: [_jsx("button", { type: "button", className: "gap-text-action-btn", onClick: handleMoveLeft, disabled: isFirstChoice, title: "Move left", children: _jsx(ArrowUpIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "gap-text-action-btn", onClick: handleMoveRight, disabled: isLastChoice, title: "Move right", children: _jsx(ArrowDownIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "gap-text-action-btn gap-text-action-btn-delete", onClick: handleDelete, disabled: !canDelete, title: canDelete ? 'Delete choice' : 'Cannot delete (minimum 1 choice)', children: _jsx(DeleteIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "gap-text-action-btn gap-text-action-btn-add", onClick: handleAddChoice, title: "Add choice", children: _jsx(AddIcon, { size: 16 }) })] })] }));
}
export function GapPropertiesPanel({ element, path, onUpdate, }) {
    const editor = useSlate();
    useStyle('gap-panel-actions', GAP_PANEL_ACTIONS_STYLES);
    const attrs = element.attributes;
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
    const handleDelete = () => {
        Transforms.removeNodes(editor, { at: path });
    };
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Gap" }), _jsx(PropertyField, { label: "Identifier", value: attrs.identifier, onChange: (val) => handleAttributeChange('identifier', val), required: true }), _jsx("div", { className: "gap-panel-actions", children: _jsxs("button", { type: "button", className: "gap-panel-delete-btn", onClick: handleDelete, title: "Delete gap", children: [_jsx(DeleteIcon, { size: 16 }), _jsx("span", { children: "Delete gap" })] }) })] }));
}
const GAP_PANEL_ACTIONS_STYLES = `
  .gap-panel-actions {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  .gap-panel-delete-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    color: #555;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  }

  .gap-panel-delete-btn:hover {
    background-color: #ffebee;
    border-color: #ef9a9a;
    color: #c62828;
  }
`;
