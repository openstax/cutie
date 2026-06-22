import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Radio buttons for selecting show/hide visibility
 */
export function ShowHideRadioGroup({ value, onChange, name, disabled = false, }) {
    return (_jsxs("fieldset", { className: "radio-fieldset", children: [_jsx("legend", { className: "radio-fieldset-legend", children: "Visibility" }), _jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: name, value: "show", checked: value === 'show', onChange: () => onChange('show'), disabled: disabled }), _jsx("span", { children: "Show when matched" })] }), _jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: name, value: "hide", checked: value === 'hide', onChange: () => onChange('hide'), disabled: disabled }), _jsx("span", { children: "Hide when matched" })] })] }));
}
