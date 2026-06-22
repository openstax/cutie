import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSelected, useFocused } from 'slate-react';
import { getCorrectValue } from '../../utils/responseDeclaration';
import { getMapping } from '../../utils/mappingDeclaration';
/**
 * Get the display value for a text entry interaction.
 * Priority: highest mapped value → correct value → fallback
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
 * Renders a text entry interaction in the editor
 */
export function TextEntryElement({ attributes, children, element, }) {
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
                }, children: _jsx("span", { style: { fontWeight: 'bold' }, children: displayValue ? `Text: ${displayValue}` : `Text Input` }) }), children] }));
}
