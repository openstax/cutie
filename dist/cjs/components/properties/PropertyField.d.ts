interface PropertyFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'number';
    required?: boolean;
    placeholder?: string;
    min?: string;
}
/**
 * Reusable input field component for property editing
 */
export declare function PropertyField({ label, value, onChange, type, required, placeholder, min, }: PropertyFieldProps): React.JSX.Element;
export {};
