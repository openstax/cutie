import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Dropdown/input for selecting a feedback identifier
 */
export function IdentifierSelector({ value, options, onChange, disabled = false, }) {
    if (disabled) {
        return (_jsxs("div", { className: "property-field", children: [_jsx("label", { className: "property-label", children: "Show this feedback when:" }), _jsx("input", { type: "text", className: "property-input", value: value, disabled: true, style: { backgroundColor: '#f3f4f6' } })] }));
    }
    return (_jsxs("div", { className: "property-field", children: [_jsx("label", { className: "property-label", children: "Show this feedback when:" }), _jsxs("select", { className: "property-select", value: value, onChange: (e) => onChange(e.target.value), children: [_jsx("option", { value: "", children: "-- Select condition --" }), options.map((option) => (_jsx("option", { value: option.id, children: option.label }, option.id))), value && !options.some((o) => o.id === value) && (_jsxs("option", { value: value, children: [value, " (custom)"] }))] }), options.length === 0 && (_jsx("p", { className: "property-empty-state", children: "No interactions found. Add an interaction to enable feedback conditions." }))] }));
}
