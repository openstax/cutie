"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEntryElement = TextEntryElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_react_1 = require("slate-react");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
/**
 * Get the display value for a text entry interaction.
 * Priority: highest mapped value → correct value → fallback
 */
function getDisplayValue(element) {
    const responseDecl = element.responseDeclaration;
    // Check for mapping first - find the entry with highest mapped value
    const mappingData = (0, mappingDeclaration_1.getMapping)(responseDecl);
    if (mappingData && mappingData.entries.length > 0) {
        const highestEntry = mappingData.entries.reduce((best, entry) => entry.mappedValue > best.mappedValue ? entry : best);
        if (highestEntry.mapKey) {
            return highestEntry.mapKey;
        }
    }
    // Fall back to correct value
    const correctValue = (0, responseDeclaration_1.getCorrectValue)(responseDecl);
    if (correctValue) {
        return correctValue;
    }
    return null;
}
/**
 * Renders a text entry interaction in the editor
 */
function TextEntryElement({ attributes, children, element, }) {
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
                }, children: (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 'bold' }, children: displayValue ? `Text: ${displayValue}` : `Text Input` }) }), children] }));
}
