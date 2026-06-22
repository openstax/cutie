import type { Path } from 'slate';
import type { ElementAttributes, QtiMatchInteraction, QtiSimpleAssociableChoice, XmlNode } from '../../types';
interface MatchPropertiesPanelProps {
    element: QtiMatchInteraction;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}
/**
 * Properties panel for editing match interaction attributes
 */
export declare function MatchPropertiesPanel({ element, path, onUpdate, }: MatchPropertiesPanelProps): React.JSX.Element;
/**
 * Properties panel for simple associable choice element
 */
interface SimpleAssociableChoicePropertiesPanelProps {
    element: QtiSimpleAssociableChoice;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
}
export declare function SimpleAssociableChoicePropertiesPanel({ element, path, onUpdate, }: SimpleAssociableChoicePropertiesPanelProps): React.JSX.Element;
export {};
