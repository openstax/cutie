"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierSelector = IdentifierSelector;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Dropdown/input for selecting a feedback identifier
 */
function IdentifierSelector({ value, options, onChange, disabled = false, }) {
    if (disabled) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "property-field", children: [(0, jsx_runtime_1.jsx)("label", { className: "property-label", children: "Show this feedback when:" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "property-input", value: value, disabled: true, style: { backgroundColor: '#f3f4f6' } })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-field", children: [(0, jsx_runtime_1.jsx)("label", { className: "property-label", children: "Show this feedback when:" }), (0, jsx_runtime_1.jsxs)("select", { className: "property-select", value: value, onChange: (e) => onChange(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "-- Select condition --" }), options.map((option) => ((0, jsx_runtime_1.jsx)("option", { value: option.id, children: option.label }, option.id))), value && !options.some((o) => o.id === value) && ((0, jsx_runtime_1.jsxs)("option", { value: value, children: [value, " (custom)"] }))] }), options.length === 0 && ((0, jsx_runtime_1.jsx)("p", { className: "property-empty-state", children: "No interactions found. Add an interaction to enable feedback conditions." }))] }));
}
