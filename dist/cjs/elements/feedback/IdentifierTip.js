"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierTip = IdentifierTip;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Tip showing what the selected identifier is based on
 */
function IdentifierTip({ identifier, options, }) {
    const matchingOption = options.find((o) => o.id === identifier);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-tip", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Based on:" }), " ", (matchingOption === null || matchingOption === void 0 ? void 0 : matchingOption.interactionType) || 'Unknown', (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("small", { children: (matchingOption === null || matchingOption === void 0 ? void 0 : matchingOption.description) || '' })] }));
}
