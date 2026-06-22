import type { Path } from 'slate';
import type { ElementAttributes, QtiGap, QtiGapImg, QtiGapMatchInteraction, QtiGapText, XmlNode } from '../../types';
interface GapMatchPropertiesPanelProps {
    element: QtiGapMatchInteraction;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}
/**
 * Properties panel for editing gap-match interaction attributes
 */
export declare function GapMatchPropertiesPanel({ element, path, onUpdate, }: GapMatchPropertiesPanelProps): React.JSX.Element;
/**
 * Properties panel for gap-text element
 */
interface GapTextPropertiesPanelProps {
    element: QtiGapText;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
}
export declare function GapTextPropertiesPanel({ element, path, onUpdate, }: GapTextPropertiesPanelProps): React.JSX.Element;
/**
 * Properties panel for gap-img element
 */
interface GapImgPropertiesPanelProps {
    element: QtiGapImg;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
}
export declare function GapImgPropertiesPanel({ element, path, onUpdate, }: GapImgPropertiesPanelProps): React.JSX.Element;
/**
 * Properties panel for gap element
 */
interface GapPropertiesPanelProps {
    element: QtiGap;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
}
export declare function GapPropertiesPanel({ element, path, onUpdate, }: GapPropertiesPanelProps): React.JSX.Element;
export {};
