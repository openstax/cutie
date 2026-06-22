"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackTypeSelector = FeedbackTypeSelector;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Dropdown selector for feedback type styling
 */
function FeedbackTypeSelector({ value, onChange, disabled = false, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "feedback-type-selector", children: [(0, jsx_runtime_1.jsx)("label", { className: "feedback-type-selector__label", htmlFor: "feedback-type", children: "Feedback Type" }), (0, jsx_runtime_1.jsxs)("select", { id: "feedback-type", className: "feedback-type-selector__select", value: value, onChange: (e) => onChange(e.target.value), disabled: disabled, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "(none)" }), (0, jsx_runtime_1.jsx)("option", { value: "correct", children: "Correct" }), (0, jsx_runtime_1.jsx)("option", { value: "incorrect", children: "Incorrect" }), (0, jsx_runtime_1.jsx)("option", { value: "info", children: "Info" })] })] }));
}
