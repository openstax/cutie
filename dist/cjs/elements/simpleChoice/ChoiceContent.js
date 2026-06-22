"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChoiceContent = ChoiceContent;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Renders the choice content wrapper
 * Note: This is a block element in Slate's schema but styled to display inline
 * It wraps the actual choice text to ensure qti-simple-choice only has element children
 */
function ChoiceContent({ attributes, children, }) {
    return ((0, jsx_runtime_1.jsx)("div", { ...attributes, children: children }));
}
