"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadonlyAttributeInfo = ReadonlyAttributeInfo;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Info box showing read-only feedback attributes in custom mode
 */
function ReadonlyAttributeInfo({ outcomeIdentifier, identifier, showHide, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "feedback-readonly-info", children: [(0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "outcome-identifier:" }), " ", outcomeIdentifier] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "identifier:" }), " ", identifier] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "show-hide:" }), " ", showHide] })] }));
}
