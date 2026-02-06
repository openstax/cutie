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
  getResponseDeclAttribute,
  updateDeclAttribute,
  removeDeclAttribute,
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

const COMPARISON_MODE_OPTIONS = [
  { value: 'canonical', label: "Canonical (default) - order doesn't matter" },
  { value: 'strict', label: 'Strict - exact structure required' },
  { value: 'algebraic', label: 'Algebraic - full mathematical equivalence' },
];

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

  // Formula mode state
  const isFormulaMode = getResponseDeclAttribute(responseDecl, 'data-response-type') === 'formula';
  const comparisonMode = getResponseDeclAttribute(responseDecl, 'data-comparison-mode') || 'canonical';

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

  const handleFormulaModeToggle = (enabled: boolean) => {
    let updatedDecl = responseDecl;
    if (enabled) {
      updatedDecl = updateDeclAttribute(updatedDecl, 'data-response-type', 'formula');
      updatedDecl = updateDeclAttribute(updatedDecl, 'data-comparison-mode', 'canonical');
    } else {
      updatedDecl = removeDeclAttribute(updatedDecl, 'data-response-type');
      updatedDecl = removeDeclAttribute(updatedDecl, 'data-comparison-mode');
    }
    onUpdate(path, attrs, updatedDecl);
  };

  const handleComparisonModeChange = (mode: string) => {
    const updatedDecl = updateDeclAttribute(responseDecl, 'data-comparison-mode', mode);
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
        label="Response is mathematical formula"
        enabled={isFormulaMode}
        onToggle={handleFormulaModeToggle}
      >
        <div className="property-field">
          <label className="property-label">Comparison mode</label>
          <select
            className="property-select"
            value={comparisonMode}
            onChange={(e) => handleComparisonModeChange(e.target.value)}
          >
            {COMPARISON_MODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
