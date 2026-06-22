"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedTextElement = ExtendedTextElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_react_1 = require("slate-react");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
/**
 * Get the display value for an extended text interaction.
 * Priority: highest mapped value → correct value → null
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
 * Renders an extended text interaction in the editor
 */
function ExtendedTextElement({ attributes, children, element, }) {
    const el = element;
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    const displayValue = getDisplayValue(el);
    return ((0, jsx_runtime_1.jsxs)("fieldset", { ...attributes, style: {
            margin: '16px 0',
            padding: selected && focused ? '12px' : '13px',
            border: selected && focused ? '2px solid #3b82f6' : '1px solid #94a3b8',
            borderRadius: '8px',
        }, children: [(0, jsx_runtime_1.jsx)("legend", { contentEditable: false, style: {
                    padding: '0 8px',
                    fontWeight: 'bold',
                    color: selected && focused ? '#1e40af' : '#64748b',
                    userSelect: 'none',
                }, children: "Extended Text Interaction" }), children, displayValue && ((0, jsx_runtime_1.jsxs)("div", { contentEditable: false, style: {
                    marginTop: '8px',
                    fontSize: '0.85em',
                    color: '#64748b',
                    userSelect: 'none',
                    whiteSpace: 'pre-wrap',
                }, children: ["Correct answer:", (0, jsx_runtime_1.jsx)("br", {}), displayValue] }))] }));
}
