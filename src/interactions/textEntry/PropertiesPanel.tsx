import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import { useStyle } from '../../hooks/useStyle';
import type { QtiTextEntryInteraction, ElementAttributes, XmlNode } from '../../types';
import { findChild } from '../../serialization/xmlNode';

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
 * Extract correct value from responseDeclaration
 */
function getCorrectValue(decl: XmlNode): string {
  const correctResponse = findChild(decl, 'qti-correct-response');
  if (!correctResponse) return '';
  const value = findChild(correctResponse, 'qti-value');
  if (!value) return '';
  return typeof value.children[0] === 'string' ? value.children[0] : '';
}

/**
 * Check if a response declaration has a correct response defined
 */
function hasCorrectResponse(decl: XmlNode): boolean {
  return !!findChild(decl, 'qti-correct-response');
}

/**
 * Remove the correct response from a declaration (keeps the declaration itself)
 */
function removeCorrectResponse(decl: XmlNode): XmlNode {
  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes },
    children: decl.children.filter(
      (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-correct-response'
    ),
  };
}

/**
 * Add an empty correct response to a declaration
 */
function addEmptyCorrectResponse(decl: XmlNode): XmlNode {
  // First remove any existing correct response
  const cleanDecl = removeCorrectResponse(decl);
  // Add empty correct response element
  return {
    ...cleanDecl,
    children: [
      ...cleanDecl.children,
      {
        tagName: 'qti-correct-response',
        attributes: {},
        children: [],
      },
    ],
  };
}

/**
 * Get base-type from response declaration
 */
function getBaseType(decl: XmlNode): BaseType {
  const baseType = decl.attributes['base-type'];
  if (baseType === 'integer' || baseType === 'float') return baseType;
  return 'string';
}

/**
 * Update the base-type in a response declaration
 */
function updateBaseType(decl: XmlNode, baseType: BaseType): XmlNode {
  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes, 'base-type': baseType },
    children: [...decl.children],
  };
}

/**
 * Update the identifier in a response declaration
 */
function updateIdentifier(decl: XmlNode, identifier: string): XmlNode {
  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes, identifier },
    children: [...decl.children],
  };
}

/**
 * Update the correct value in a response declaration (preserves qti-correct-response element)
 */
function updateCorrectValue(decl: XmlNode, value: string): XmlNode {
  // Remove existing correct response
  const otherChildren = decl.children.filter(
    (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-correct-response'
  );

  // Build correct response with value (or empty if no value)
  const correctResponse: XmlNode = {
    tagName: 'qti-correct-response',
    attributes: {},
    children: value !== '' ? [{
      tagName: 'qti-value',
      attributes: {},
      children: [value],
    }] : [],
  };

  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes },
    children: [...otherChildren, correctResponse],
  };
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

  // responseDeclaration is now required on the type
  const responseDecl = element.responseDeclaration;

  const baseType = getBaseType(responseDecl);
  const correctValue = getCorrectValue(responseDecl);
  const hasCorrectAnswer = hasCorrectResponse(responseDecl);

  useStyle('text-entry-correct-answer', TEXT_ENTRY_CORRECT_ANSWER_STYLES);

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
      // Add an empty correct response element
      const updatedDecl = addEmptyCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    } else {
      // Remove just the correct response, keep the declaration
      const updatedDecl = removeCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    }
  };

  const handleBaseTypeChange = (newBaseType: string) => {
    const updatedDecl = updateBaseType(responseDecl, newBaseType as BaseType);
    onUpdate(path, attrs, updatedDecl);
  };

  const handleCorrectValueChange = (value: string) => {
    const updatedDecl = updateCorrectValue(responseDecl, value);
    onUpdate(path, attrs, updatedDecl);
  };

  return (
    <div className="property-editor">
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
        Text Entry Interaction
      </h3>

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

      <div className="property-field" style={{ marginTop: '16px' }}>
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

      <div className="correct-answer-section">
        <PropertyCheckbox
          label="Set correct answer"
          checked={hasCorrectAnswer}
          onChange={handleToggleCorrectAnswer}
        />

        {hasCorrectAnswer && (
          <fieldset className="correct-answer-fieldset">
            <legend className="correct-answer-legend">Correct answer</legend>

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
          </fieldset>
        )}
      </div>
    </div>
  );
}

const TEXT_ENTRY_CORRECT_ANSWER_STYLES = `
  .correct-answer-section {
    margin-top: 24px;
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
  }

  .correct-answer-fieldset {
    margin-top: 12px;
    border: none;
    padding: 0;
  }

  .correct-answer-legend {
    font-weight: 600;
    padding: 0;
    font-size: 14px;
    margin-bottom: 12px;
  }

  .property-field {
    margin-bottom: 16px;
  }

  .property-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 4px;
  }

  .property-select {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
    cursor: pointer;
  }

  .property-select:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .property-input {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .property-input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }
`;
