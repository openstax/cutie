import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Editor, Node, Transforms } from 'slate';
import { useSlate } from 'slate-react';
import { PropertyField } from '../../components/properties/PropertyField';
import { ArrowUpIcon, ArrowDownIcon, DeleteIcon, AddIcon } from '../../components/icons';
import { useStyle } from '../../hooks/useStyle';
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
export function SimpleChoicePropertiesPanel({ element, path, onUpdate, }) {
    var _a;
    const editor = useSlate();
    useStyle('simple-choice-actions', SIMPLE_CHOICE_ACTIONS_STYLES);
    // Get the current identifier from the choice-id-label child's attributes
    const idLabel = element.children.find((c) => 'type' in c && c.type === 'choice-id-label');
    const currentIdentifier = ((_a = idLabel === null || idLabel === void 0 ? void 0 : idLabel.attributes) === null || _a === void 0 ? void 0 : _a.identifier) || element.attributes.identifier;
    // Get parent interaction and position info
    const parentPath = path.slice(0, -1);
    const myIndex = path[path.length - 1];
    const parent = Node.get(editor, parentPath);
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
            Transforms.setNodes(editor, { attributes: { identifier: newIdentifier } }, { at: labelPath });
        }
        // Also update the parent qti-simple-choice attribute for serialization
        const newAttrs = { ...element.attributes, identifier: newIdentifier };
        onUpdate(path, newAttrs);
    };
    const handleMoveUp = () => {
        if (isFirstChoice)
            return;
        const targetIndex = choiceIndices[myChoicePosition - 1];
        Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, targetIndex],
        });
    };
    const handleMoveDown = () => {
        if (isLastChoice)
            return;
        // Move to index + 2 because moveNodes inserts before the target
        const targetIndex = choiceIndices[myChoicePosition + 1];
        Transforms.moveNodes(editor, {
            at: path,
            to: [...parentPath, targetIndex + 1],
        });
    };
    const handleDelete = () => {
        if (!canDelete)
            return;
        Transforms.removeNodes(editor, { at: path });
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
        Transforms.insertNodes(editor, newChoice, {
            at: [...parentPath, myIndex + 1],
        });
        // Select the new choice
        const newChoicePath = [...parentPath, myIndex + 1];
        Editor.withoutNormalizing(editor, () => {
            Transforms.select(editor, newChoicePath);
        });
    };
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Choice" }), _jsx(PropertyField, { label: "Identifier", value: currentIdentifier, onChange: handleIdentifierChange, required: true }), _jsxs("div", { className: "simple-choice-actions", children: [_jsx("button", { type: "button", className: "choice-action-btn", onClick: handleMoveUp, disabled: isFirstChoice, title: "Move up", children: _jsx(ArrowUpIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "choice-action-btn", onClick: handleMoveDown, disabled: isLastChoice, title: "Move down", children: _jsx(ArrowDownIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "choice-action-btn choice-action-btn-delete", onClick: handleDelete, disabled: !canDelete, title: canDelete ? 'Delete choice' : 'Cannot delete (minimum 2 choices)', children: _jsx(DeleteIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "choice-action-btn choice-action-btn-add", onClick: handleAddChoice, title: "Add choice below", children: _jsx(AddIcon, { size: 16 }) })] })] }));
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
