import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSelected, useFocused } from 'slate-react';
import { getCorrectValue } from '../../utils/responseDeclaration';
import { getMapping } from '../../utils/mappingDeclaration';
/**
 * Get the display value for an extended text interaction.
 * Priority: highest mapped value → correct value → null
 */
function getDisplayValue(element) {
    const responseDecl = element.responseDeclaration;
    // Check for mapping first - find the entry with highest mapped value
    const mappingData = getMapping(responseDecl);
    if (mappingData && mappingData.entries.length > 0) {
        const highestEntry = mappingData.entries.reduce((best, entry) => entry.mappedValue > best.mappedValue ? entry : best);
        if (highestEntry.mapKey) {
            return highestEntry.mapKey;
        }
    }
    // Fall back to correct value
    const correctValue = getCorrectValue(responseDecl);
    if (correctValue) {
        return correctValue;
    }
    return null;
}
/**
 * Renders an extended text interaction in the editor
 */
export function ExtendedTextElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    const displayValue = getDisplayValue(el);
    return (_jsxs("fieldset", { ...attributes, style: {
            margin: '16px 0',
            padding: selected && focused ? '12px' : '13px',
            border: selected && focused ? '2px solid #3b82f6' : '1px solid #94a3b8',
            borderRadius: '8px',
        }, children: [_jsx("legend", { contentEditable: false, style: {
                    padding: '0 8px',
                    fontWeight: 'bold',
                    color: selected && focused ? '#1e40af' : '#64748b',
                    userSelect: 'none',
                }, children: "Extended Text Interaction" }), children, displayValue && (_jsxs("div", { contentEditable: false, style: {
                    marginTop: '8px',
                    fontSize: '0.85em',
                    color: '#64748b',
                    userSelect: 'none',
                    whiteSpace: 'pre-wrap',
                }, children: ["Correct answer:", _jsx("br", {}), displayValue] }))] }));
}
