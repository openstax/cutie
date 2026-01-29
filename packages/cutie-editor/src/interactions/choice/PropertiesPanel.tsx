import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import type { QtiChoiceInteraction, ElementAttributes } from '../../types';

interface ChoicePropertiesPanelProps {
  element: QtiChoiceInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
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

      <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '4px', fontSize: '13px', color: '#0369a1' }}>
        💡 Tip: Choice identifiers can be edited directly in the editor.
      </div>
    </div>
  );
}
