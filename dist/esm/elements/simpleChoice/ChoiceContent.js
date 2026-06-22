import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Renders the choice content wrapper
 * Note: This is a block element in Slate's schema but styled to display inline
 * It wraps the actual choice text to ensure qti-simple-choice only has element children
 */
export function ChoiceContent({ attributes, children, }) {
    return (_jsx("div", { ...attributes, children: children }));
}
