export type FeedbackType = 'correct' | 'incorrect' | 'info' | '';
interface FeedbackTypeSelectorProps {
    value: FeedbackType;
    onChange: (value: FeedbackType) => void;
    disabled?: boolean;
}
/**
 * Dropdown selector for feedback type styling
 */
export declare function FeedbackTypeSelector({ value, onChange, disabled, }: FeedbackTypeSelectorProps): React.JSX.Element;
export {};
