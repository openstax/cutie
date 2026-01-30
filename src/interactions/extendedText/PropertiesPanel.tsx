import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import { useStyle } from '../../hooks/useStyle';
import type { QtiExtendedTextInteraction, ElementAttributes, XmlNode } from '../../types';
import { findChild } from '../../serialization/xmlNode';

interface ExtendedTextPropertiesPanelProps {
  element: QtiExtendedTextInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
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
  const cleanDecl = removeCorrectResponse(decl);
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
  const otherChildren = decl.children.filter(
    (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-correct-response'
  );

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

  useStyle('extended-text-correct-answer', EXTENDED_TEXT_CORRECT_ANSWER_STYLES);

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
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
        Extended Text Interaction
      </h3>

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
              <textarea
                className="property-textarea"
                value={correctValue}
                onChange={(e) => handleCorrectValueChange(e.target.value)}
                placeholder="Enter correct answer"
                rows={4}
              />
            </div>
          </fieldset>
        )}
      </div>
    </div>
  );
}

const EXTENDED_TEXT_CORRECT_ANSWER_STYLES = `
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

  .property-textarea {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    box-sizing: border-box;
    resize: vertical;
    font-family: inherit;
  }

  .property-textarea:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }
`;
