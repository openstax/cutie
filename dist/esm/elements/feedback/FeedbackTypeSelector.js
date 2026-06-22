import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Dropdown selector for feedback type styling
 */
export function FeedbackTypeSelector({ value, onChange, disabled = false, }) {
    return (_jsxs("div", { className: "feedback-type-selector", children: [_jsx("label", { className: "feedback-type-selector__label", htmlFor: "feedback-type", children: "Feedback Type" }), _jsxs("select", { id: "feedback-type", className: "feedback-type-selector__select", value: value, onChange: (e) => onChange(e.target.value), disabled: disabled, children: [_jsx("option", { value: "", children: "(none)" }), _jsx("option", { value: "correct", children: "Correct" }), _jsx("option", { value: "incorrect", children: "Incorrect" }), _jsx("option", { value: "info", children: "Info" })] })] }));
}
