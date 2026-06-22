"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleChoicePropertiesPanel = SimpleChoicePropertiesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_1 = require("slate");
const slate_react_1 = require("slate-react");
const PropertyField_1 = require("../../components/properties/PropertyField");
const icons_1 = require("../../components/icons");
const useStyle_1 = require("../../hooks/useStyle");
/**
 * Generate a unique choice identifier within a choice interaction
 */
function generateChoiceId(interaction) {
    const existingIds = new Set();
    for (const child of interaction.children) {
        if ('type' in child && child.type === 'qti-simple-choice') {
            const choice = child;
            if (choice.attributes.identifier) {
                existingIds.add(choice.attributes.identifier);
            }
        }
    }
    let counter = 1;
    let id = `choice-${counter}`;
    while (existingIds.has(id)) {
        counter++;
        id = `choice-${counter}`;
    }
    return id;
}
/**
 * Properties panel for editing simple choice attributes
 */
function SimpleChoicePropertiesPanel({ element, path, onUpdate, }) {
    var _a;
    const editor = (0, slate_react_1.useSlate)();
    (0, useStyle_1.useStyle)('simple-choice-actions', SIMPLE_CHOICE_ACTIONS_STYLES);
    // Get the current identifier from the choice-id-label child's attributes
    const idLabel = element.children.find((c) => 'type' in c && c.type === 'choice-id-label');
    const currentIdentifier = ((_a = idLabel === null || idLabel === void 0 ? void 0 : idLabel.attributes) === null || _a === void 0 ? void 0 : _a.identifier) || element.attributes.identifier;
    // Get parent interaction and position info
    const parentPath = path.slice(0, -1);
    const myIndex = path[path.length - 1];
    const parent = slate_1.Node.get(editor, parentPath);
    // Count simple-choice siblings (excluding prompt)
    const choices = parent.children.filter((c) => 'type' in c && c.type === 'qti-simple-choice');
    const choiceCount = choices.length;
    // Find my position among choices (accounting for prompt at index 0)
    const choiceIndices = parent.children
        .map((c, i) => ('type' in c && c.type === 'qti-simple-choice' ? i : -1))
        .filter((i) => i !== -1);
    const myChoicePosition = choiceIndices.indexOf(myIndex);
    const isFirstChoice = myChoicePosition === 0;
    const isLastChoice = myChoicePosition === choiceIndices.length - 1;
    const canDelete = choiceCount > 2;
    const handleIdentifierChange = (newIdentifier) => {
        // Find the choice-id-label child and update its attributes
        const labelIndex = element.children.findIndex((c) => 'type' in c && c.type === 'choice-id-label');
        if (labelIndex !== -1) {
            const labelPath = [...path, labelIndex];
            // Update the choice-id-label's attributes
            slate_1.Transforms.setNodes(editor, { attributes: { identifier: newIdentifier } }, { at: labelPath });
        }
        // Also update the parent qti-simple-choice attribute for serialization
        const newAttrs = { ...element.attributes, identifier: newIdentifier };
        onUpdate(path, newAttrs);
    };
    const handleMoveUp = () => {
        if (isFirstChoice)
            return;
        const targetIndex = choiceIndices[myChoicePosition - 1];
        slate_1.Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, targetIndex],
        });
    };
    const handleMoveDown = () => {
        if (isLastChoice)
            return;
        // Move to index + 2 because moveNodes inserts before the target
        const targetIndex = choiceIndices[myChoicePosition + 1];
        slate_1.Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, targetIndex + 1],
        });
    };
    const handleDelete = () => {
        if (!canDelete)
            return;
        slate_1.Transforms.removeNodes(editor, { at: path });
    };
    const handleAddChoice = () => {
        const newId = generateChoiceId(parent);
        const newChoice = {
            type: 'qti-simple-choice',
            attributes: {
                identifier: newId,
            },
            children: [
                {
                    type: 'choice-id-label',
                    children: [{ text: '' }],
                    attributes: { identifier: newId },
                },
                {
                    type: 'choice-content',
                    children: [
                        {
                            type: 'paragraph',
                            children: [{ text: 'New choice' }],
                            attributes: {},
                        },
                    ],
                    attributes: {},
                },
            ],
        };
        // Insert after current choice
        slate_1.Transforms.insertNodes(editor, newChoice, {
            at: [...parentPath, myIndex + 1],
        });
        // Select the new choice
        const newChoicePath = [...parentPath, myIndex + 1];
        slate_1.Editor.withoutNormalizing(editor, () => {
            slate_1.Transforms.select(editor, newChoicePath);
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-editor", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Choice" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Identifier", value: currentIdentifier, onChange: handleIdentifierChange, required: true }), (0, jsx_runtime_1.jsxs)("div", { className: "simple-choice-actions", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "choice-action-btn", onClick: handleMoveUp, disabled: isFirstChoice, title: "Move up", children: (0, jsx_runtime_1.jsx)(icons_1.ArrowUpIcon, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "choice-action-btn", onClick: handleMoveDown, disabled: isLastChoice, title: "Move down", children: (0, jsx_runtime_1.jsx)(icons_1.ArrowDownIcon, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "choice-action-btn choice-action-btn-delete", onClick: handleDelete, disabled: !canDelete, title: canDelete ? 'Delete choice' : 'Cannot delete (minimum 2 choices)', children: (0, jsx_runtime_1.jsx)(icons_1.DeleteIcon, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "choice-action-btn choice-action-btn-add", onClick: handleAddChoice, title: "Add choice below", children: (0, jsx_runtime_1.jsx)(icons_1.AddIcon, { size: 16 }) })] })] }));
}
const SIMPLE_CHOICE_ACTIONS_STYLES = `
  .simple-choice-actions {
    display: flex;
    gap: 4px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  .choice-action-btn {
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

  .choice-action-btn:hover:not(:disabled) {
    background-color: #f5f5f5;
    border-color: #bbb;
    color: #333;
  }

  .choice-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .choice-action-btn-delete:hover:not(:disabled) {
    background-color: #ffebee;
    border-color: #ef9a9a;
    color: #c62828;
  }

  .choice-action-btn-add:hover:not(:disabled) {
    background-color: #e8f5e9;
    border-color: #a5d6a7;
    color: #2e7d32;
  }
`;
