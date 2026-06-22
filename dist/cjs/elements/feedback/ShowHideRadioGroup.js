"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowHideRadioGroup = ShowHideRadioGroup;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Radio buttons for selecting show/hide visibility
 */
function ShowHideRadioGroup({ value, onChange, name, disabled = false, }) {
    return ((0, jsx_runtime_1.jsxs)("fieldset", { className: "radio-fieldset", children: [(0, jsx_runtime_1.jsx)("legend", { className: "radio-fieldset-legend", children: "Visibility" }), (0, jsx_runtime_1.jsxs)("label", { className: "radio-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: name, value: "show", checked: value === 'show', onChange: () => onChange('show'), disabled: disabled }), (0, jsx_runtime_1.jsx)("span", { children: "Show when matched" })] }), (0, jsx_runtime_1.jsxs)("label", { className: "radio-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: name, value: "hide", checked: value === 'hide', onChange: () => onChange('hide'), disabled: disabled }), (0, jsx_runtime_1.jsx)("span", { children: "Hide when matched" })] })] }));
}
