import type { Path } from 'slate';
import type { QtiInlineChoiceInteraction, ElementAttributes, XmlNode } from '../../types';
interface InlineChoicePropertiesPanelProps {
    element: QtiInlineChoiceInteraction;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode, additionalProps?: Record<string, unknown>) => void;
}
/**
 * Properties panel for editing inline choice interaction attributes
 */
export declare function InlineChoicePropertiesPanel({ element, path, onUpdate, }: InlineChoicePropertiesPanelProps): React.JSX.Element;
export {};
