import type { FeedbackIdentifierOption } from './types';
interface IdentifierSelectorProps {
    value: string;
    options: FeedbackIdentifierOption[];
    onChange: (identifier: string) => void;
    disabled?: boolean;
}
/**
 * Dropdown/input for selecting a feedback identifier
 */
export declare function IdentifierSelector({ value, options, onChange, disabled, }: IdentifierSelectorProps): React.JSX.Element;
export {};
