import type { Path } from 'slate';
import type { QtiSimpleChoice, ElementAttributes } from '../../types';
interface SimpleChoicePropertiesPanelProps {
    element: QtiSimpleChoice;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
}
/**
 * Properties panel for editing simple choice attributes
 */
export declare function SimpleChoicePropertiesPanel({ element, path, onUpdate, }: SimpleChoicePropertiesPanelProps): React.JSX.Element;
export {};
