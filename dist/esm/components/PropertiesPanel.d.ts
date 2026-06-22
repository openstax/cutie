import type { Path } from 'slate';
import type { SlateElement, ElementAttributes, XmlNode, ResponseProcessingConfig, ResponseProcessingMode } from '../types';
interface PropertiesPanelProps {
    selectedElement: SlateElement | null;
    selectedPath: Path | null;
    onUpdateAttributes: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode, additionalProps?: Record<string, unknown>) => void;
    responseProcessingConfig?: ResponseProcessingConfig;
    interactionCount?: number;
    hasFeedbackElements?: boolean;
    onResponseProcessingModeChange?: (mode: ResponseProcessingMode) => void;
}
/**
 * Main properties panel component that routes to interaction-specific editors
 */
export declare function PropertiesPanel({ selectedElement, selectedPath, onUpdateAttributes, responseProcessingConfig, interactionCount, hasFeedbackElements, onResponseProcessingModeChange, }: PropertiesPanelProps): React.JSX.Element;
export {};
