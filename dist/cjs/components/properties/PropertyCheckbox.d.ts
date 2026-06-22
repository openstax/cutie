interface PropertyCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}
/**
 * Reusable checkbox component for property editing
 */
export declare function PropertyCheckbox({ label, checked, onChange, }: PropertyCheckboxProps): React.JSX.Element;
export {};
