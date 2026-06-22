import type { Path } from 'slate';
import type { QtiModalFeedback, ElementAttributes, ResponseProcessingConfig } from '../../../types';
interface ModalFeedbackPropertiesPanelProps {
    element: QtiModalFeedback;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
    responseProcessingConfig?: ResponseProcessingConfig;
}
/**
 * Properties panel for editing modal feedback attributes
 */
export declare function ModalFeedbackPropertiesPanel({ element, path, onUpdate, responseProcessingConfig, }: ModalFeedbackPropertiesPanelProps): React.JSX.Element;
export {};
