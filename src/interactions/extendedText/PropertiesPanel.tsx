import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import type { QtiExtendedTextInteraction, ElementAttributes, XmlNode } from '../../types';
import {
  getCorrectValue,
  updateCorrectValue,
  hasCorrectResponse,
  removeCorrectResponse,
  addEmptyCorrectResponse,
  updateIdentifier,
} from '../../utils/responseDeclaration';

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
    </div>
  );
}
