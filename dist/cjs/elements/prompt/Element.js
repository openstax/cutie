"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptElement = PromptElement;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Render a prompt element
 */
function PromptElement({ attributes, children, }) {
    return ((0, jsx_runtime_1.jsx)("div", { ...attributes, style: { marginBottom: '8px', fontWeight: 500 }, children: children }));
}
