import type { Path } from 'slate';
import type { QtiExtendedTextInteraction, ElementAttributes, XmlNode } from '../../types';
interface ExtendedTextPropertiesPanelProps {
    element: QtiExtendedTextInteraction;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}
/**
 * Properties panel for editing extended text interaction attributes
 */
export declare function ExtendedTextPropertiesPanel({ element, path, onUpdate, }: ExtendedTextPropertiesPanelProps): React.JSX.Element;
export {};
