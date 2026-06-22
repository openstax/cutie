import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Info box showing read-only feedback attributes in custom mode
 */
export function ReadonlyAttributeInfo({ outcomeIdentifier, identifier, showHide, }) {
    return (_jsxs("div", { className: "feedback-readonly-info", children: [_jsxs("p", { children: [_jsx("strong", { children: "outcome-identifier:" }), " ", outcomeIdentifier] }), _jsxs("p", { children: [_jsx("strong", { children: "identifier:" }), " ", identifier] }), _jsxs("p", { children: [_jsx("strong", { children: "show-hide:" }), " ", showHide] })] }));
}
