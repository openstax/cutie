import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { MapEntryList } from '../../components/properties/MapEntryList';
import type { QtiChoiceInteraction, QtiSimpleChoice, ChoiceIdLabel, ElementAttributes, XmlNode } from '../../types';
import {
  getCorrectValues,
  setCorrectValues,
  hasCorrectResponse,
  removeCorrectResponse,
  addEmptyCorrectResponse,
  updateIdentifier,
  updateCardinality,
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

interface ChoicePropertiesPanelProps {
  element: QtiChoiceInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}

/**
 * Get choice identifiers from the element's children by reading from choice-id-label text
 */
function getChoiceIdentifiers(element: QtiChoiceInteraction): string[] {
  return element.children
    .filter((child): child is QtiSimpleChoice => 'type' in child && child.type === 'qti-simple-choice')
    .map(choice => {
      // Find the choice-id-label child and extract text from it
      const idLabel = choice.children.find(
        (c): c is ChoiceIdLabel => 'type' in c && c.type === 'choice-id-label'
      );
      if (idLabel) {
        // Get text content from the label's children
        return idLabel.children
          .filter((c): c is { text: string } => 'text' in c)
          .map(c => c.text)
          .join('');
      }
      // Fallback to attribute if no label found
      return choice.attributes.identifier;
    })
    .filter(Boolean);
}

/**
 * Properties panel for editing choice interaction attributes
 */
export function ChoicePropertiesPanel({
  element,
  path,
  onUpdate,
}: ChoicePropertiesPanelProps): React.JSX.Element {
  const attrs = element.attributes;
  const isSingleCardinality = attrs['max-choices'] === '1';
  const cardinality = isSingleCardinality ? 'single' : 'multiple';

  const responseDecl = element.responseDeclaration;
  const correctValues = getCorrectValues(responseDecl);
  const hasCorrectAnswer = hasCorrectResponse(responseDecl);
  const choiceIdentifiers = getChoiceIdentifiers(element);

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

  const handleToggleCorrectAnswer = (enabled: boolean) => {
    if (enabled) {
      const updatedDecl = addEmptyCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    } else {
      const updatedDecl = removeCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    }
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

  const handleCorrectValueToggle = (choiceId: string, isCorrect: boolean) => {
    let newValues = [...correctValues];
    if (isCorrect) {
      if (isSingleCardinality) {
        // Single cardinality: only one correct answer
        newValues = [choiceId];
      } else {
        // Multiple cardinality: add to list
        if (!newValues.includes(choiceId)) {
          newValues.push(choiceId);
        }
      }
    } else {
      // Remove from list
      newValues = newValues.filter(v => v !== choiceId);
    }

    const newDecl = setCorrectValues(responseDecl, newValues, cardinality);
    onUpdate(path, attrs, newDecl);
  };

  // Mapping data
  const mappingEnabled = hasMapping(responseDecl);
  const mappingData = getMapping(responseDecl);
  const mappingEntries = mappingData?.entries ?? [];
  const mappingMetadata: MappingMetadata = mappingData?.metadata ?? { defaultValue: 0 };

  // Get choice identifiers that are not already mapped
  const mappedKeys = new Set(mappingEntries.map(e => e.mapKey));
  const unmappedChoices = choiceIdentifiers.filter(id => !mappedKeys.has(id));

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
    // Add a new entry with the first unmapped choice, or empty if none available
    const newEntry: MapEntry = {
      mapKey: unmappedChoices[0] || '',
      mappedValue: 1,
    };
    handleMappingEntriesChange([...mappingEntries, newEntry]);
  };

  return (
    <div className="property-editor">
      <h3>Choice Interaction</h3>

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

      <ToggleableFormSection
        label="Set correct answer"
        enabled={hasCorrectAnswer}
        onToggle={handleToggleCorrectAnswer}
      >
        <fieldset className="radio-fieldset">
          <legend className="radio-fieldset-legend">
            {isSingleCardinality ? 'Correct answer' : 'Correct answers'}
          </legend>

          {isSingleCardinality ? (
            // Radio buttons for single cardinality
            choiceIdentifiers.map((identifier, i) => (
              <label key={`${i}-${identifier}`} className="radio-option">
                <input
                  type="radio"
                  name="correct-answer"
                  checked={correctValues.includes(identifier)}
                  onChange={() => handleCorrectValueToggle(identifier, true)}
                />
                <span>{identifier}</span>
              </label>
            ))
          ) : (
            // Checkboxes for multiple cardinality
            choiceIdentifiers.map((identifier, i) => (
              <PropertyCheckbox
                key={`${i}-${identifier}`}
                label={identifier}
                checked={correctValues.includes(identifier)}
                onChange={(checked) => handleCorrectValueToggle(identifier, checked)}
              />
            ))
          )}

          {choiceIdentifiers.length === 0 && (
            <p className="property-empty-state">No choices available yet.</p>
          )}
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
              value={response}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">Select choice...</option>
              {unmappedChoices.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
              {/* Show current value if it's mapped (so it appears selected) */}
              {response && !unmappedChoices.includes(response) && (
                <option value={response}>{response}</option>
              )}
            </select>
          )}
          onAddEntry={handleAddMappingEntry}
          addButtonLabel="Add choice mapping"
        />
      </ToggleableFormSection>

      <div className="property-tip">
        Tip: Choice identifiers can be edited directly in the editor.
      </div>
    </div>
  );
}
