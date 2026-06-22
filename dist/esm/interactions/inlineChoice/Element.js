import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSelected, useFocused } from 'slate-react';
import { getCorrectValue } from '../../utils/responseDeclaration';
/**
 * Get the display value for an inline choice interaction.
 * Priority: correct value identifier text -> first choice text -> fallback
 */
function getDisplayValue(element) {
    const responseDecl = element.responseDeclaration;
    const choices = element.choices;
    // Check for correct value first
    const correctValue = getCorrectValue(responseDecl);
    if (correctValue && choices.length > 0) {
        const correctChoice = choices.find(c => c.identifier === correctValue);
        if (correctChoice) {
            return correctChoice.text;
        }
    }
    // Fall back to first choice
    if (choices.length > 0) {
        return choices[0].text;
    }
    return null;
}
/**
 * Renders an inline choice interaction in the editor as a styled pill
 */
export function InlineChoiceElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    const displayValue = getDisplayValue(el);
    return (_jsxs("span", { ...attributes, children: [_jsx("span", { contentEditable: false, style: {
                    display: 'inline-block',
                    padding: selected && focused ? '2px 8px' : '3px 9px',
                    margin: '0 4px',
                    backgroundColor: selected && focused ? '#eff6ff' : '#f8fafc',
                    border: selected && focused ? '2px solid #3b82f6' : '1px solid #94a3b8',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    color: selected && focused ? '#1e40af' : '#64748b',
                    userSelect: 'none',
                }, children: _jsx("span", { style: { fontWeight: 'bold' }, children: displayValue ? `Dropdown: ${displayValue}` : 'Dropdown' }) }), children] }));
}
