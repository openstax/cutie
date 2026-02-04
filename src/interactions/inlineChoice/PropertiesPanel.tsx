import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { MapEntryList } from '../../components/properties/MapEntryList';
import { DeleteIcon } from '../../components/icons';
import type { QtiInlineChoiceInteraction, ElementAttributes, XmlNode, InlineChoiceOption } from '../../types';
import {
  getCorrectValue,
  hasCorrectResponse,
  removeCorrectResponse,
  addEmptyCorrectResponse,
  updateIdentifier,
  updateCorrectValue,
} from '../../utils/responseDeclaration';
import {
  hasMapping,
  getMapping,
  removeMapping,
  addEmptyMapping,
  updateMapping,
  type MappingMetadata,
  type MapEntry,
} from '../../utils/mappingDeclaration';

interface InlineChoicePropertiesPanelProps {
  element: QtiInlineChoiceInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode, additionalProps?: Record<string, unknown>) => void;
}

/**
 * Generate a unique choice identifier
 */
function generateChoiceId(existingChoices: InlineChoiceOption[]): string {
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
export function InlineChoicePropertiesPanel({
  element,
  path,
  onUpdate,
}: InlineChoicePropertiesPanelProps): React.JSX.Element {
  const attrs = element.attributes;
  const responseDecl = element.responseDeclaration;
  const choices = element.choices || [];

  const correctValue = getCorrectValue(responseDecl);
  const hasCorrectAnswer = hasCorrectResponse(responseDecl);

  const handleAttributeChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      // Remove attribute if empty (except for required fields)
      if (key !== 'response-identifier') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }

    // If response-identifier changed, update it in the response declaration too
    let updatedDecl = responseDecl;
    if (key === 'response-identifier') {
      updatedDecl = updateIdentifier(updatedDecl, value);
    }

    onUpdate(path, newAttrs, updatedDecl);
  };

  const handleShuffleChange = (checked: boolean) => {
    const newAttrs = { ...attrs };
    if (checked) {
      newAttrs.shuffle = 'true';
    } else {
      delete newAttrs.shuffle;
    }
    onUpdate(path, newAttrs, responseDecl);
  };

  const handleToggleCorrectAnswer = (enabled: boolean) => {
    if (enabled) {
      const updatedDecl = addEmptyCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    } else {
      const updatedDecl = removeCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    }
  };

  const handleCorrectAnswerChange = (identifier: string) => {
    const updatedDecl = updateCorrectValue(responseDecl, identifier);
    onUpdate(path, attrs, updatedDecl);
  };

  // Choice management
  const handleChoiceTextChange = (index: number, text: string) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], text };
    updateChoices(newChoices);
  };

  const handleChoiceIdentifierChange = (index: number, identifier: string) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], identifier };
    updateChoices(newChoices);
  };

  const handleChoiceFixedChange = (index: number, fixed: boolean) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], fixed: fixed || undefined };
    updateChoices(newChoices);
  };

  const handleAddChoice = () => {
    const newId = generateChoiceId(choices);
    const newChoices = [...choices, { identifier: newId, text: `Option ${choices.length + 1}` }];
    updateChoices(newChoices);
  };

  const handleDeleteChoice = (index: number) => {
    if (choices.length <= 2) {
      // Minimum 2 choices required
      return;
    }
    const newChoices = choices.filter((_, i) => i !== index);
    updateChoices(newChoices);
  };

  const updateChoices = (newChoices: InlineChoiceOption[]) => {
    // Update choices using the additional props parameter
    onUpdate(path, attrs, responseDecl, { choices: newChoices });
  };

  // Mapping data
  const mappingEnabled = hasMapping(responseDecl);
  const mappingData = getMapping(responseDecl);
  const mappingEntries = mappingData?.entries ?? [];
  const mappingMetadata: MappingMetadata = mappingData?.metadata ?? { defaultValue: 0 };

  const handleToggleMapping = (enabled: boolean) => {
    if (enabled) {
      const updatedDecl = addEmptyMapping(responseDecl, 0);
      onUpdate(path, attrs, updatedDecl);
    } else {
      const updatedDecl = removeMapping(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    }
  };

  const handleMappingMetadataChange = (metadata: MappingMetadata) => {
    const updatedDecl = updateMapping(responseDecl, metadata, mappingEntries);
    onUpdate(path, attrs, updatedDecl);
  };

  const handleMappingEntriesChange = (entries: MapEntry[]) => {
    const updatedDecl = updateMapping(responseDecl, mappingMetadata, entries);
    onUpdate(path, attrs, updatedDecl);
  };

  const handleAddMappingEntry = () => {
    // Add entry for first choice that doesn't have a mapping
    const mappedKeys = new Set(mappingEntries.map(e => e.mapKey));
    const unmappedChoice = choices.find(c => !mappedKeys.has(c.identifier));
    const newEntry: MapEntry = {
      mapKey: unmappedChoice?.identifier || '',
      mappedValue: 1,
    };
    handleMappingEntriesChange([...mappingEntries, newEntry]);
  };

  return (
    <div className="property-editor">
      <h3>Inline Choice Interaction</h3>

      <PropertyField
        label="Response Identifier"
        value={attrs['response-identifier']}
        onChange={(val) => handleAttributeChange('response-identifier', val)}
        required
      />

      <div className="property-field">
        <label className="property-label">
          <input
            type="checkbox"
            checked={attrs.shuffle === 'true'}
            onChange={(e) => handleShuffleChange(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Shuffle choices
        </label>
      </div>

      {/* Choices list */}
      <div style={{ marginTop: '16px', marginBottom: '16px' }}>
        <label className="property-label" style={{ marginBottom: '8px', display: 'block' }}>
          Choices (minimum 2)
        </label>
        {choices.map((choice, index) => (
          <div
            key={index}
            style={{
              paddingBottom: '10px',
              marginBottom: '10px',
              borderBottom: index < choices.length - 1 ? '1px solid #d1d5db' : 'none',
            }}
          >
            {/* Row 1: ID label + input, Fixed, Delete */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end',
                marginBottom: '4px',
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#4b5563',
                    marginBottom: '2px',
                  }}
                >
                  ID
                </label>
                <input
                  type="text"
                  className="property-input"
                  value={choice.identifier}
                  onChange={(e) => handleChoiceIdentifierChange(index, e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '13px' }}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  color: '#374151',
                  paddingBottom: '4px',
                }}
              >
                <input
                  type="checkbox"
                  checked={choice.fixed || false}
                  onChange={(e) => handleChoiceFixedChange(index, e.target.checked)}
                  style={{ marginRight: '4px' }}
                />
                Fixed
              </label>
              <button
                type="button"
                onClick={() => handleDeleteChoice(index)}
                disabled={choices.length <= 2}
                title="Delete choice"
                style={{
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
                }}
                onMouseEnter={(e) => {
                  if (choices.length > 2) {
                    e.currentTarget.style.color = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (choices.length > 2) {
                    e.currentTarget.style.color = '#4b5563';
                  }
                }}
              >
                <DeleteIcon size={16} />
              </button>
            </div>
            {/* Row 2: Text label + input */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#4b5563',
                  marginBottom: '2px',
                }}
              >
                Text
              </label>
              <input
                type="text"
                className="property-input"
                value={choice.text}
                onChange={(e) => handleChoiceTextChange(index, e.target.value)}
                style={{ width: '100%', padding: '4px 8px', fontSize: '13px' }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddChoice}
          style={{
            padding: '6px 12px',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            background: '#fff',
            color: '#2196f3',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          + Add Choice
        </button>
      </div>

      <ToggleableFormSection
        label="Set correct answer"
        enabled={hasCorrectAnswer}
        onToggle={handleToggleCorrectAnswer}
      >
        <fieldset className="radio-fieldset">
          <legend className="radio-fieldset-legend">Correct choice</legend>
          {choices.map((choice) => (
            <label key={choice.identifier} className="radio-option">
              <input
                type="radio"
                name="correct-choice"
                value={choice.identifier}
                checked={correctValue === choice.identifier}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
              />
              <span>{choice.identifier}: {choice.text}</span>
            </label>
          ))}
        </fieldset>
      </ToggleableFormSection>

      <ToggleableFormSection
        label="Response mapping"
        enabled={mappingEnabled}
        onToggle={handleToggleMapping}
      >
        <MappingMetadataFields
          metadata={mappingMetadata}
          onChange={handleMappingMetadataChange}
        />
        <MapEntryList
          entries={mappingEntries}
          onEntriesChange={handleMappingEntriesChange}
          responseDisplay={(response, onChange) => (
            <select
              className="property-select"
              value={response}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">Select choice...</option>
              {choices.map((choice) => (
                <option key={choice.identifier} value={choice.identifier}>
                  {choice.identifier}: {choice.text}
                </option>
              ))}
            </select>
          )}
          onAddEntry={handleAddMappingEntry}
          addButtonLabel="Add choice mapping"
        />
      </ToggleableFormSection>
    </div>
  );
}
