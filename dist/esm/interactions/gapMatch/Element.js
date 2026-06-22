import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useSelected, useFocused } from 'slate-react';
import { getCorrectValues, hasCorrectResponse } from '../../utils/responseDeclaration';
import { getMapping, hasMapping } from '../../utils/mappingDeclaration';
import { GapMatchScoringProvider } from './GapMatchScoringContext';
/**
 * Renders a gap-match interaction in the editor
 */
export function GapMatchInteractionElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    // Build scoring info for children
    const scoringInfo = useMemo(() => {
        var _a;
        const responseDecl = el.responseDeclaration;
        const correctValues = getCorrectValues(responseDecl);
        const mappingData = getMapping(responseDecl);
        // Parse directedPair values into gap -> choice map
        const correctPairings = new Map();
        for (const value of correctValues) {
            // directedPair format: "CHOICE GAP" (e.g., "W G1")
            const parts = value.split(' ');
            if (parts.length === 2) {
                const [choice, gap] = parts;
                correctPairings.set(gap, choice);
            }
        }
        const mappingByKey = new Map();
        if (mappingData) {
            for (const entry of mappingData.entries) {
                mappingByKey.set(entry.mapKey, entry);
            }
        }
        return {
            correctPairings,
            hasCorrectness: hasCorrectResponse(responseDecl),
            mappingByKey,
            hasMapping: hasMapping(responseDecl),
            defaultMappedValue: (_a = mappingData === null || mappingData === void 0 ? void 0 : mappingData.metadata.defaultValue) !== null && _a !== void 0 ? _a : 0,
        };
    }, [el.responseDeclaration]);
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
                }, children: "Gap Match Interaction" }), _jsx(GapMatchScoringProvider, { value: scoringInfo, children: children })] }));
}
/**
 * Renders the choices container (editor-only wrapper)
 */
export function GapMatchChoicesElement({ attributes, children, }) {
    return (_jsx("div", { ...attributes, style: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '12px',
            marginBottom: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px dashed #cbd5e1',
        }, children: children }));
}
/**
 * Renders the content container (editor-only wrapper - invisible)
 */
export function GapMatchContentElement({ attributes, children, }) {
    return _jsx("div", { ...attributes, children: children });
}
/**
 * Renders a gap-text choice element
 */
export function GapTextElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    return (_jsxs("span", { ...attributes, style: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            backgroundColor: selected && focused ? '#dbeafe' : '#e0f2fe',
            border: selected && focused ? '2px solid #3b82f6' : '1px solid #0ea5e9',
            borderRadius: '4px',
            cursor: 'text',
        }, children: [_jsx("span", { contentEditable: false, style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 4px',
                    marginRight: '6px',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    userSelect: 'none',
                }, children: el.attributes.identifier }), children] }));
}
/**
 * Renders a gap-img choice element
 */
export function GapImgElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    return (_jsxs("span", { ...attributes, style: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px',
            backgroundColor: selected && focused ? '#dbeafe' : '#e0f2fe',
            border: selected && focused ? '2px solid #3b82f6' : '1px solid #0ea5e9',
            borderRadius: '4px',
        }, children: [_jsx("span", { contentEditable: false, style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 4px',
                    marginRight: '6px',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    userSelect: 'none',
                }, children: el.attributes.identifier }), children] }));
}
/**
 * Renders a gap (inline void placeholder)
 * Styled to match inline choice and text entry elements
 */
export function GapElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    const { correctPairings, hasCorrectness } = useGapMatchScoring();
    // Get the correct choice for this gap (if defined)
    const correctChoice = hasCorrectness ? correctPairings.get(el.attributes.identifier) : undefined;
    // Format: "Gap {gapId}" or "Gap {gapId}: {choiceId}" if answer configured
    const label = correctChoice
        ? `Gap ${el.attributes.identifier}: ${correctChoice}`
        : `Gap ${el.attributes.identifier}`;
    return (_jsxs("span", { ...attributes, children: [_jsx("span", { contentEditable: false, style: {
                    display: 'inline-block',
                    padding: selected && focused ? '2px 8px' : '3px 9px',
                    margin: '0 4px',
                    backgroundColor: selected && focused ? '#eff6ff' : '#f8fafc',
                    border: selected && focused ? '2px solid #3b82f6' : '1px solid #94a3b8',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    color: selected && focused ? '#1e40af' : '#64748b',
                    fontWeight: 'bold',
                    userSelect: 'none',
                }, children: label }), children] }));
}
// Import the hook for use in GapElement
import { useGapMatchScoring } from './GapMatchScoringContext';
