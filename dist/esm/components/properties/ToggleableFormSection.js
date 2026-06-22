import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PropertyCheckbox } from './PropertyCheckbox';
/**
 * A form section that can be toggled on/off with a checkbox.
 * When enabled, renders children directly - caller controls the content structure.
 * Useful for optional configuration like correct answers, mappings, etc.
 */
export function ToggleableFormSection({ label, enabled, onToggle, children, helpText, }) {
    return (_jsxs("div", { className: "toggleable-form-section", children: [_jsx(PropertyCheckbox, { label: label, checked: enabled, onChange: onToggle }), helpText && _jsx("div", { className: "property-help", children: helpText }), enabled && (_jsx("div", { className: "toggleable-content", children: children }))] }));
}
