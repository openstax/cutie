import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import { useStyle } from '../../hooks/useStyle';
import type { QtiChoiceInteraction, QtiSimpleChoice, ChoiceIdLabel, ElementAttributes, XmlNode } from '../../types';
import { findChild, findChildren } from '../../serialization/xmlNode';

interface ChoicePropertiesPanelProps {
  element: QtiChoiceInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}

/**
 * Extract correct values from responseDeclaration
 */
function getCorrectValues(decl: XmlNode): string[] {
  const correctResponse = findChild(decl, 'qti-correct-response');
  if (!correctResponse) return [];
  return findChildren(correctResponse, 'qti-value')
    .map(v => (typeof v.children[0] === 'string' ? v.children[0] : ''))
    .filter(Boolean);
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
 * Update correct values and cardinality in responseDeclaration
 */
function setCorrectValues(decl: XmlNode, values: string[], cardinality: 'single' | 'multiple'): XmlNode {
  // Clone the declaration with updated cardinality
  const newDecl: XmlNode = {
    tagName: decl.tagName,
    attributes: { ...decl.attributes, cardinality },
    children: decl.children.filter(
      (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-correct-response'
    ),
  };

  // Add new correct response if there are values
  if (values.length > 0) {
    const correctResponse: XmlNode = {
      tagName: 'qti-correct-response',
      attributes: {},
      children: values.map(v => ({
        tagName: 'qti-value',
        attributes: {},
        children: [v],
      })),
    };
    newDecl.children.push(correctResponse);
  }

  return newDecl;
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

  // responseDeclaration is now required on the type
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
      updatedDecl = {
        ...updatedDecl,
        attributes: { ...updatedDecl.attributes, identifier: value },
      };
    }

    // If max-choices changed, update the cardinality in the response declaration
    if (key === 'max-choices') {
      const newCardinality = value === '1' ? 'single' : 'multiple';
      updatedDecl = {
        ...updatedDecl,
        attributes: { ...updatedDecl.attributes, cardinality: newCardinality },
      };
      // If switching to single cardinality and there are multiple correct values, keep only the first
      if (newCardinality === 'single' && correctValues.length > 1) {
        updatedDecl = setCorrectValues(updatedDecl, [correctValues[0]], 'single');
      }
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

    // Update with new correct values and cardinality
    const newDecl = setCorrectValues(responseDecl, newValues, cardinality);

    onUpdate(path, attrs, newDecl);
  };

  // Add styles for correct answer section
  useStyle('choice-correct-answer', CHOICE_CORRECT_ANSWER_STYLES);

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

      <div className="correct-answer-section">
        <PropertyCheckbox
          label="Set correct answer"
          checked={hasCorrectAnswer}
          onChange={handleToggleCorrectAnswer}
        />

        {hasCorrectAnswer && (
          <fieldset className="correct-answer-fieldset">
            <legend className="correct-answer-legend">
              {isSingleCardinality ? 'Correct answer' : 'Correct answers'}
            </legend>

            {isSingleCardinality ? (
              // Radio buttons for single cardinality
              choiceIdentifiers.map((identifier, i) => (
                <label key={`${i}-${identifier}`} className="correct-answer-option">
                  <input
                    type="radio"
                    name="correct-answer"
                    className="correct-answer-input"
                    checked={correctValues.includes(identifier)}
                    onChange={() => handleCorrectValueToggle(identifier, true)}
                  />
                  <span className="correct-answer-label">{identifier}</span>
                </label>
              ))
            ) : (
              // Checkboxes for multiple cardinality
              choiceIdentifiers.map((identifier, i) => (
                <PropertyCheckbox key={`${i}-${identifier}`}
                  label={identifier}
                  checked={correctValues.includes(identifier)}
                  onChange={(checked) => handleCorrectValueToggle(identifier, checked)}
                />
              ))
            )}

            {choiceIdentifiers.length === 0 && (
              <p style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
                No choices available yet.
              </p>
            )}
          </fieldset>
        )}
      </div>

      <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '4px', fontSize: '13px', color: '#0369a1' }}>
        Tip: Choice identifiers can be edited directly in the editor.
      </div>
    </div>
  );
}

const CHOICE_CORRECT_ANSWER_STYLES = `
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

  .correct-answer-option {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: #333;
    margin-bottom: 12px;
  }

  .correct-answer-input {
    margin-right: 8px;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  .correct-answer-label {
    user-select: none;
  }

  .correct-answer-option:hover .correct-answer-label {
    color: #2196f3;
  }
`;
