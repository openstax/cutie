import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Tip showing what the selected identifier is based on
 */
export function IdentifierTip({ identifier, options, }) {
    const matchingOption = options.find((o) => o.id === identifier);
    return (_jsxs("div", { className: "property-tip", children: [_jsx("strong", { children: "Based on:" }), " ", (matchingOption === null || matchingOption === void 0 ? void 0 : matchingOption.interactionType) || 'Unknown', _jsx("br", {}), _jsx("small", { children: (matchingOption === null || matchingOption === void 0 ? void 0 : matchingOption.description) || '' })] }));
}
