import type { Path } from 'slate';
import type { QtiChoiceInteraction, ElementAttributes, XmlNode } from '../../types';
interface ChoicePropertiesPanelProps {
    element: QtiChoiceInteraction;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}
/**
 * Properties panel for editing choice interaction attributes
 */
export declare function ChoicePropertiesPanel({ element, path, onUpdate, }: ChoicePropertiesPanelProps): React.JSX.Element;
export {};
