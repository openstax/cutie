import type { Path } from 'slate';
import { Transforms } from 'slate';
import { useSlate } from 'slate-react';
import { PropertyField } from '../../components/properties/PropertyField';
import type { QtiSimpleChoice, ChoiceIdLabel, ElementAttributes } from '../../types';

interface SimpleChoicePropertiesPanelProps {
  element: QtiSimpleChoice;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
}

/**
 * Properties panel for editing simple choice attributes
 */
export function SimpleChoicePropertiesPanel({
  element,
  path,
  onUpdate,
}: SimpleChoicePropertiesPanelProps): React.JSX.Element {
  const editor = useSlate();

  // Get the current identifier from the choice-id-label child's attributes
  const idLabel = element.children.find(
    (c): c is ChoiceIdLabel => 'type' in c && c.type === 'choice-id-label'
  );
  const currentIdentifier = idLabel?.attributes?.identifier || element.attributes.identifier;

  const handleIdentifierChange = (newIdentifier: string) => {
    // Find the choice-id-label child and update its attributes
    const labelIndex = element.children.findIndex(
      (c) => 'type' in c && c.type === 'choice-id-label'
    );

    if (labelIndex !== -1) {
      const labelPath = [...path, labelIndex];
      // Update the choice-id-label's attributes
      Transforms.setNodes(
        editor,
        { attributes: { identifier: newIdentifier } },
        { at: labelPath }
      );
    }

    // Also update the parent qti-simple-choice attribute for serialization
    const newAttrs = { ...element.attributes, identifier: newIdentifier };
    onUpdate(path, newAttrs);
  };

  return (
    <div className="property-editor">
      <h3>Choice</h3>

      <PropertyField
        label="Identifier"
        value={currentIdentifier}
        onChange={handleIdentifierChange}
        required
      />
    </div>
  );
}
