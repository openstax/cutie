"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomModeWarning = CustomModeWarning;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Warning banner displayed when feedback is in custom response processing mode
 */
function CustomModeWarning() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "feedback-custom-warning", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Custom Response Processing" }), (0, jsx_runtime_1.jsx)("p", { children: "This item uses response processing patterns that cannot be managed by the editor. Feedback attributes are read-only, but you can still edit the feedback content." })] }));
}
