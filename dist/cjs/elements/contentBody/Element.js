"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentBodyElement = ContentBodyElement;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Render a qti-content-body element
 * This is a transparent container - it just renders its children
 */
function ContentBodyElement({ attributes, children, }) {
    return ((0, jsx_runtime_1.jsx)("div", { ...attributes, children: children }));
}
