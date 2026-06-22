import type { Path } from 'slate';
import type { ImageElement, ElementAttributes } from '../../types';
interface ImagePropertiesPanelProps {
    element: ImageElement;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
}
/**
 * Properties panel for editing image attributes
 */
export declare function ImagePropertiesPanel({ element, path, onUpdate, }: ImagePropertiesPanelProps): React.JSX.Element;
export {};
