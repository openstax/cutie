import type { Path } from 'slate';
import type { QtiFeedbackInline, ElementAttributes, ResponseProcessingConfig } from '../../../types';
interface FeedbackInlinePropertiesPanelProps {
    element: QtiFeedbackInline;
    path: Path;
    onUpdate: (path: Path, attributes: ElementAttributes) => void;
    responseProcessingConfig?: ResponseProcessingConfig;
}
/**
 * Properties panel for editing feedback inline attributes
 */
export declare function FeedbackInlinePropertiesPanel({ element, path, onUpdate, responseProcessingConfig, }: FeedbackInlinePropertiesPanelProps): React.JSX.Element;
export {};
