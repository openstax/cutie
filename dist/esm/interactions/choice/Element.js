import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useSelected, useFocused } from 'slate-react';
import { getCorrectValues, hasCorrectResponse } from '../../utils/responseDeclaration';
import { getMapping, hasMapping } from '../../utils/mappingDeclaration';
import { ChoiceScoringProvider } from './ChoiceScoringContext';
/**
 * Renders a choice interaction in the editor
 */
export function ChoiceElement({ attributes, children, element, }) {
    const el = element;
    const selected = useSelected();
    const focused = useFocused();
    // Build scoring info for children
    const scoringInfo = useMemo(() => {
        var _a;
        const responseDecl = el.responseDeclaration;
        const correctValues = getCorrectValues(responseDecl);
        const mappingData = getMapping(responseDecl);
        const mappingByKey = new Map();
        if (mappingData) {
            for (const entry of mappingData.entries) {
                mappingByKey.set(entry.mapKey, entry);
            }
        }
        return {
            correctValues,
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
                }, children: "Choice Interaction" }), _jsx(ChoiceScoringProvider, { value: scoringInfo, children: children })] }));
}
