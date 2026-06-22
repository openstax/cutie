import type { ResponseProcessingConfig, ResponseProcessingMode } from '../types';
interface ResponseProcessingPanelProps {
    config: ResponseProcessingConfig;
    interactionCount: number;
    hasFeedbackElements: boolean;
    onModeChange: (mode: ResponseProcessingMode) => void;
}
/**
 * Panel for configuring response processing (scoring mode)
 */
export declare function ResponseProcessingPanel({ config, interactionCount, hasFeedbackElements, onModeChange, }: ResponseProcessingPanelProps): React.JSX.Element;
export {};
