import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useSelected, useFocused } from 'slate-react';
import { getCorrectValues, hasCorrectResponse } from '../../utils/responseDeclaration';
import { getMapping, hasMapping } from '../../utils/mappingDeclaration';
import { MatchScoringProvider } from './MatchScoringContext';
/**
 * Renders a match interaction in the editor
 */
export function MatchInteractionElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    // Build scoring info for children
    const scoringInfo = useMemo(() => {
        var _a;
        const responseDecl = el.responseDeclaration;
        const correctValues = getCorrectValues(responseDecl);
        const mappingData = getMapping(responseDecl);
        // Parse directedPair values into a set
        const correctPairings = new Set(correctValues);
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
                }, children: "Match Interaction" }), _jsx(MatchScoringProvider, { value: scoringInfo, children: children })] }));
}
/**
 * Renders the source items container (editor-only wrapper)
 */
export function MatchSourceSetElement({ attributes, children, }) {
    return (_jsxs("div", { ...attributes, style: {
            marginBottom: '12px',
        }, children: [_jsx("div", { contentEditable: false, style: {
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                    userSelect: 'none',
                }, children: "Source Items" }), _jsx("div", { style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                }, children: children })] }));
}
/**
 * Renders the target items container (editor-only wrapper)
 */
export function MatchTargetSetElement({ attributes, children, }) {
    return (_jsxs("div", { ...attributes, style: {
            marginBottom: '8px',
        }, children: [_jsx("div", { contentEditable: false, style: {
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                    userSelect: 'none',
                }, children: "Target Items" }), _jsx("div", { style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                }, children: children })] }));
}
/**
 * Renders a simple associable choice element
 */
export function SimpleAssociableChoiceElement({ attributes, children, element, }) {
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
