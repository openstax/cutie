import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { MapEntryList } from '../../components/properties/MapEntryList';
import type { QtiTextEntryInteraction, ElementAttributes, XmlNode } from '../../types';
import {
  getCorrectValue,
  updateCorrectValue,
  hasCorrectResponse,
  removeCorrectResponse,
  addEmptyCorrectResponse,
  updateIdentifier,
  updateBaseType,
  getBaseType,
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

interface TextEntryPropertiesPanelProps {
  element: QtiTextEntryInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}

type BaseType = 'string' | 'integer' | 'float';

const BASE_TYPE_OPTIONS: { value: BaseType; label: string }[] = [
  { value: 'string', label: 'Text (string)' },
  { value: 'integer', label: 'Integer' },
  { value: 'float', label: 'Decimal (float)' },
];

/**
 * Get the HTML input type for a base-type
 */
function getInputType(baseType: BaseType): string {
  switch (baseType) {
    case 'integer':
    case 'float':
      return 'number';
    default:
      return 'text';
  }
}

/**
 * Get the step attribute for number inputs
 */
function getInputStep(baseType: BaseType): string | undefined {
  if (baseType === 'float') return 'any';
  if (baseType === 'integer') return '1';
  return undefined;
}

/**
 * Properties panel for editing text entry interaction attributes
 */
export function TextEntryPropertiesPanel({
  element,
  path,
  onUpdate,
}: TextEntryPropertiesPanelProps): React.JSX.Element {
  const attrs = element.attributes;
  const responseDecl = element.responseDeclaration;

  const baseType = getBaseType(responseDecl) as BaseType;
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

  const handleToggleCorrectAnswer = (enabled: boolean) => {
    if (enabled) {
      const updatedDecl = addEmptyCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    } else {
      const updatedDecl = removeCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    }
  };

  const handleBaseTypeChange = (newBaseType: string) => {
    const updatedDecl = updateBaseType(responseDecl, newBaseType);
    onUpdate(path, attrs, updatedDecl);
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
      <h3>Text Entry Interaction</h3>

      <PropertyField
        label="Response Identifier"
        value={attrs['response-identifier']}
        onChange={(val) => handleAttributeChange('response-identifier', val)}
        required
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
        label="Pattern Mask"
        value={attrs['pattern-mask'] || ''}
        onChange={(val) => handleAttributeChange('pattern-mask', val)}
        placeholder="e.g., [0-9]+"
      />

      <PropertyField
        label="Placeholder Text"
        value={attrs['placeholder-text'] || ''}
        onChange={(val) => handleAttributeChange('placeholder-text', val)}
        placeholder="Hint text for learner"
      />

      <div className="property-field">
        <label className="property-label">Response type</label>
        <select
          className="property-select"
          value={baseType}
          onChange={(e) => handleBaseTypeChange(e.target.value)}
        >
          {BASE_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <ToggleableFormSection
        label="Set correct answer"
        enabled={hasCorrectAnswer}
        onToggle={handleToggleCorrectAnswer}
      >
        <div className="property-field">
          <label className="property-label">Correct value</label>
          <input
            type={getInputType(baseType)}
            step={getInputStep(baseType)}
            className="property-input"
            value={correctValue}
            onChange={(e) => handleCorrectValueChange(e.target.value)}
            placeholder={baseType === 'string' ? 'Enter correct answer' : 'Enter number'}
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
              type={getInputType(baseType)}
              step={getInputStep(baseType)}
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
