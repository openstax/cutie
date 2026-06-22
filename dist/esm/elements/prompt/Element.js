import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Render a prompt element
 */
export function PromptElement({ attributes, children, }) {
    return (_jsx("div", { ...attributes, style: { marginBottom: '8px', fontWeight: 500 }, children: children }));
}
