import type { Path } from 'slate';
import type { QtiTextEntryInteraction, ElementAttributes, XmlNode } from '../../types';
interface TextEntryPropertiesPanelProps {
    element: QtiTextEntryInteraction;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}
/**
 * Properties panel for editing text entry interaction attributes
 */
export declare function TextEntryPropertiesPanel({ element, path, onUpdate, }: TextEntryPropertiesPanelProps): React.JSX.Element;
export {};
