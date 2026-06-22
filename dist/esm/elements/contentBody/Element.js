import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Render a qti-content-body element
 * This is a transparent container - it just renders its children
 */
export function ContentBodyElement({ attributes, children, }) {
    return (_jsx("div", { ...attributes, children: children }));
}
