"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineChoiceElement = InlineChoiceElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_react_1 = require("slate-react");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
/**
 * Get the display value for an inline choice interaction.
 * Priority: correct value identifier text -> first choice text -> fallback
 */
function getDisplayValue(element) {
    const responseDecl = element.responseDeclaration;
    const choices = element.choices;
    // Check for correct value first
    const correctValue = (0, responseDeclaration_1.getCorrectValue)(responseDecl);
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
function InlineChoiceElement({ attributes, children, element, }) {
    const el = element;
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    const displayValue = getDisplayValue(el);
    return ((0, jsx_runtime_1.jsxs)("span", { ...attributes, children: [(0, jsx_runtime_1.jsx)("span", { contentEditable: false, style: {
                    display: 'inline-block',
                    padding: selected && focused ? '2px 8px' : '3px 9px',
                    margin: '0 4px',
                    backgroundColor: selected && focused ? '#eff6ff' : '#f8fafc',
                    border: selected && focused ? '2px solid #3b82f6' : '1px solid #94a3b8',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    color: selected && focused ? '#1e40af' : '#64748b',
                    userSelect: 'none',
                }, children: (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 'bold' }, children: displayValue ? `Dropdown: ${displayValue}` : 'Dropdown' }) }), children] }));
}
