import { useState } from 'react';
import { Transforms } from 'slate';
import type { Path, Editor } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import { useStyle } from '../../hooks/useStyle';
import type { QtiChoiceInteraction, QtiSimpleChoice, ElementAttributes } from '../../types';

interface ChoicePropertiesPanelProps {
  editor: Editor;
  element: QtiChoiceInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
}

/**
 * Properties panel for editing choice interaction attributes
 */
export function ChoicePropertiesPanel({
  editor,
  element,
  path,
  onUpdate,
}: ChoicePropertiesPanelProps): React.JSX.Element {
  useStyle('choice-properties-panel', CHOICE_PROPERTIES_STYLES);

  const attrs = element.attributes;

  // Get simple-choice children (filter out prompts)
  const choices = element.children.filter(
    (child) => child.type === 'qti-simple-choice'
  ) as QtiSimpleChoice[];

  const handleAttributeChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      // Remove attribute if empty (except for required fields)
      if (key !== 'response-identifier' && key !== 'max-choices') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }
    onUpdate(path, newAttrs);
  };

  const handleShuffleChange = (checked: boolean) => {
    const newAttrs = { ...attrs };
    if (checked) {
      newAttrs.shuffle = 'true';
    } else {
      delete newAttrs.shuffle;
    }
    onUpdate(path, newAttrs);
  };

  return (
    <div className="property-editor">
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
        Choice Interaction
      </h3>

      <PropertyField
        label="Response Identifier"
        value={attrs['response-identifier']}
        onChange={(val) => handleAttributeChange('response-identifier', val)}
        required
      />

      <PropertyField
        label="Max Choices"
        type="number"
        value={attrs['max-choices']}
        onChange={(val) => handleAttributeChange('max-choices', val)}
        required
        min="1"
      />

      <PropertyField
        label="Min Choices"
        type="number"
        value={attrs['min-choices'] || ''}
        onChange={(val) => handleAttributeChange('min-choices', val)}
        min="0"
      />

      <PropertyCheckbox
        label="Shuffle choices"
        checked={attrs.shuffle === 'true'}
        onChange={handleShuffleChange}
      />

      <div className="choice-identifiers-section">
        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', marginTop: '24px' }}>
          Choice Identifiers
        </h4>
        {choices.map((choice, index) => (
          <ChoiceIdentifierField
            key={index}
            editor={editor}
            choice={choice}
            choiceIndex={index}
            interactionPath={path}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Sub-component for editing individual choice identifiers
 */
function ChoiceIdentifierField({
  editor,
  choice,
  choiceIndex,
  interactionPath,
}: {
  editor: Editor;
  choice: QtiSimpleChoice;
  choiceIndex: number;
  interactionPath: Path;
}): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(choice.attributes.identifier);

  const handleSave = () => {
    // Calculate path to this specific choice
    // Need to account for prompts which come before choices
    const interactionElement = editor.children[interactionPath[0]] as any;
    const allChildren = interactionElement.children;

    // Find the actual index of this choice among all children
    let choiceCount = 0;
    let actualIndex = -1;
    for (let i = 0; i < allChildren.length; i++) {
      if (allChildren[i].type === 'qti-simple-choice') {
        if (choiceCount === choiceIndex) {
          actualIndex = i;
          break;
        }
        choiceCount++;
      }
    }

    if (actualIndex !== -1) {
      const choicePath = [...interactionPath, actualIndex];
      Transforms.setNodes(
        editor,
        { attributes: { ...choice.attributes, identifier: value } } as any,
        { at: choicePath }
      );
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(choice.attributes.identifier);
    setIsEditing(false);
  };

  return (
    <div className="choice-identifier-row">
      {isEditing ? (
        <>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="choice-id-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
          />
          <button onClick={handleSave} className="choice-id-button choice-id-save">
            Save
          </button>
          <button onClick={handleCancel} className="choice-id-button choice-id-cancel">
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="choice-id-display">{choice.attributes.identifier}</span>
          <button onClick={() => setIsEditing(true)} className="choice-id-button choice-id-edit">
            Edit
          </button>
        </>
      )}
    </div>
  );
}

const CHOICE_PROPERTIES_STYLES = `
  .choice-identifiers-section {
    border-top: 1px solid #e0e0e0;
    padding-top: 16px;
  }

  .choice-identifier-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 8px;
    background: #f9f9f9;
    border-radius: 4px;
  }

  .choice-id-display {
    flex: 1;
    font-family: monospace;
    font-size: 13px;
    color: #333;
    background: white;
    padding: 6px 8px;
    border: 1px solid #e0e0e0;
    border-radius: 3px;
  }

  .choice-id-input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid #2196f3;
    border-radius: 3px;
    font-family: monospace;
    font-size: 13px;
    outline: none;
  }

  .choice-id-button {
    padding: 4px 12px;
    border: 1px solid #ccc;
    border-radius: 3px;
    background: white;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .choice-id-button:hover {
    background: #f5f5f5;
  }

  .choice-id-edit {
    border-color: #2196f3;
    color: #2196f3;
  }

  .choice-id-edit:hover {
    background: #e3f2fd;
  }

  .choice-id-save {
    border-color: #4caf50;
    color: #4caf50;
  }

  .choice-id-save:hover {
    background: #e8f5e9;
  }

  .choice-id-cancel {
    border-color: #f44336;
    color: #f44336;
  }

  .choice-id-cancel:hover {
    background: #ffebee;
  }
`;
