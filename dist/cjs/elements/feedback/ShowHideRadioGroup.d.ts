interface ShowHideRadioGroupProps {
    value: 'show' | 'hide';
    onChange: (value: 'show' | 'hide') => void;
    name: string;
    disabled?: boolean;
}
/**
 * Radio buttons for selecting show/hide visibility
 */
export declare function ShowHideRadioGroup({ value, onChange, name, disabled, }: ShowHideRadioGroupProps): React.JSX.Element;
export {};
