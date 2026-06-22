import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Warning banner displayed when feedback is in custom response processing mode
 */
export function CustomModeWarning() {
    return (_jsxs("div", { className: "feedback-custom-warning", children: [_jsx("strong", { children: "Custom Response Processing" }), _jsx("p", { children: "This item uses response processing patterns that cannot be managed by the editor. Feedback attributes are read-only, but you can still edit the feedback content." })] }));
}
