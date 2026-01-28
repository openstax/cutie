import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import type { QtiExtendedTextInteraction, ElementAttributes } from '../../types';

interface ExtendedTextPropertiesPanelProps {
  element: QtiExtendedTextInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
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

  const handleChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      // Remove attribute if empty (except for required fields)
      if (key !== 'response-identifier') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }
    onUpdate(path, newAttrs);
  };

  return (
    <div className="property-editor">
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
        Extended Text Interaction
      </h3>

      <PropertyField
        label="Response Identifier"
        value={attrs['response-identifier']}
        onChange={(val) => handleChange('response-identifier', val)}
        required
      />

      <PropertyField
        label="Expected Lines"
        type="number"
        value={attrs['expected-lines'] || ''}
        onChange={(val) => handleChange('expected-lines', val)}
        placeholder="Number of lines"
        min="1"
      />

      <PropertyField
        label="Expected Length"
        type="number"
        value={attrs['expected-length'] || ''}
        onChange={(val) => handleChange('expected-length', val)}
        placeholder="Number of characters"
        min="1"
      />

      <PropertyField
        label="Placeholder Text"
        value={attrs['placeholder-text'] || ''}
        onChange={(val) => handleChange('placeholder-text', val)}
        placeholder="Hint text for learner"
      />
    </div>
  );
}
