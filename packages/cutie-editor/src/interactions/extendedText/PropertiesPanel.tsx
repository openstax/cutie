import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { MapEntryList } from '../../components/properties/MapEntryList';
import type { QtiExtendedTextInteraction, ElementAttributes, XmlNode } from '../../types';
import {
  getCorrectValue,
  updateCorrectValue,
  hasCorrectResponse,
  removeCorrectResponse,
  addEmptyCorrectResponse,
  updateIdentifier,
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

interface ExtendedTextPropertiesPanelProps {
  element: QtiExtendedTextInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}

/**
 * Properties panel for editing extended text interaction attributes
 */
export function ExtendedTextPropertiesPanel({
  element,
  path,
  onUpdate,
}: ExtendedTextPropertiesPanelProps): React.JSX.Element {
  const attrs = element.attributes;
  const responseDecl = element.responseDeclaration;

  const correctValue = getCorrectValue(responseDecl);
  const hasCorrectAnswer = hasCorrectResponse(responseDecl);

  const handleAttributeChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      if (key !== 'response-identifier') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }

    let updatedDecl = responseDecl;
    if (key === 'response-identifier') {
      updatedDecl = updateIdentifier(updatedDecl, value);
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

  const handleCorrectValueChange = (value: string) => {
    const updatedDecl = updateCorrectValue(responseDecl, value);
    onUpdate(path, attrs, updatedDecl);
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
    const newEntry: MapEntry = { mapKey: '', mappedValue: 1 };
    handleMappingEntriesChange([...mappingEntries, newEntry]);
  };

  return (
    <div className="property-editor">
      <h3>Extended Text Interaction</h3>

      <PropertyField
        label="Response Identifier"
        value={attrs['response-identifier']}
        onChange={(val) => handleAttributeChange('response-identifier', val)}
        required
      />

      <PropertyField
        label="Expected Lines"
        type="number"
        value={attrs['expected-lines'] || ''}
        onChange={(val) => handleAttributeChange('expected-lines', val)}
        placeholder="Number of lines"
        min="1"
      />

      <PropertyField
        label="Expected Length"
        type="number"
        value={attrs['expected-length'] || ''}
        onChange={(val) => handleAttributeChange('expected-length', val)}
        placeholder="Number of characters"
        min="1"
      />

      <PropertyField
        label="Placeholder Text"
        value={attrs['placeholder-text'] || ''}
        onChange={(val) => handleAttributeChange('placeholder-text', val)}
        placeholder="Hint text for learner"
      />

      <ToggleableFormSection
        label="Set correct answer"
        enabled={hasCorrectAnswer}
        onToggle={handleToggleCorrectAnswer}
      >
        <div className="property-field">
          <label className="property-label">Correct value</label>
          <textarea
            className="property-textarea"
            value={correctValue}
            onChange={(e) => handleCorrectValueChange(e.target.value)}
            placeholder="Enter correct answer"
            rows={4}
          />
        </div>
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
            <input
              type="text"
              value={response}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Response value"
            />
          )}
          onAddEntry={handleAddMappingEntry}
          addButtonLabel="Add response mapping"
        />
      </ToggleableFormSection>
    </div>
  );
}
