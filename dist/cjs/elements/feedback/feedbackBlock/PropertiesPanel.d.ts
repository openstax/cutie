import type { Path } from 'slate';
import type { QtiFeedbackBlock, ElementAttributes, ResponseProcessingConfig } from '../../../types';
interface FeedbackBlockPropertiesPanelProps {
    element: QtiFeedbackBlock;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
    responseProcessingConfig?: ResponseProcessingConfig;
}
/**
 * Properties panel for editing feedback block attributes
 */
export declare function FeedbackBlockPropertiesPanel({ element, path, onUpdate, responseProcessingConfig, }: FeedbackBlockPropertiesPanelProps): React.JSX.Element;
export {};
