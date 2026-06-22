"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToggleableFormSection = ToggleableFormSection;
const jsx_runtime_1 = require("react/jsx-runtime");
const PropertyCheckbox_1 = require("./PropertyCheckbox");
/**
 * A form section that can be toggled on/off with a checkbox.
 * When enabled, renders children directly - caller controls the content structure.
 * Useful for optional configuration like correct answers, mappings, etc.
 */
function ToggleableFormSection({ label, enabled, onToggle, children, helpText, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "toggleable-form-section", children: [(0, jsx_runtime_1.jsx)(PropertyCheckbox_1.PropertyCheckbox, { label: label, checked: enabled, onChange: onToggle }), helpText && (0, jsx_runtime_1.jsx)("div", { className: "property-help", children: helpText }), enabled && ((0, jsx_runtime_1.jsx)("div", { className: "toggleable-content", children: children }))] }));
}
