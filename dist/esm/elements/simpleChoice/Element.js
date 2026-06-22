import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSelected, useFocused } from 'slate-react';
import { useChoiceScoring } from '../../interactions/choice/ChoiceScoringContext';
import { CheckIcon, CloseIcon } from '../../components/icons';
/**
 * Render a simple choice element
 */
export function SimpleChoiceElement({ attributes, children, element, }) {
    var _a;
    const el = element;
    const identifier = el.attributes.identifier;
    const scoringInfo = useChoiceScoring();
    const selected = useSelected();
    const focused = useFocused();
    // Determine correctness indicator
    let correctnessIcon = null;
    if (scoringInfo === null || scoringInfo === void 0 ? void 0 : scoringInfo.hasCorrectness) {
        const isCorrect = scoringInfo.correctValues.includes(identifier);
        correctnessIcon = isCorrect ? (_jsx("span", { contentEditable: false, style: {
                display: 'inline-flex',
                alignItems: 'center',
                color: '#16a34a',
                marginRight: '4px',
                userSelect: 'none',
            }, title: "Correct", children: _jsx(CheckIcon, { size: 16 }) })) : (_jsx("span", { contentEditable: false, style: {
                display: 'inline-flex',
                alignItems: 'center',
                color: '#dc2626',
                marginRight: '4px',
                userSelect: 'none',
            }, title: "Incorrect", children: _jsx(CloseIcon, { size: 16 }) }));
    }
    // Determine points badge
    let pointsBadge = null;
    if (scoringInfo === null || scoringInfo === void 0 ? void 0 : scoringInfo.hasMapping) {
        const entry = scoringInfo.mappingByKey.get(identifier);
        const points = (_a = entry === null || entry === void 0 ? void 0 : entry.mappedValue) !== null && _a !== void 0 ? _a : scoringInfo.defaultMappedValue;
        pointsBadge = (_jsxs("span", { contentEditable: false, style: {
                display: 'inline-block',
                marginLeft: '8px',
                padding: '1px 6px',
                backgroundColor: points > 0 ? '#dcfce7' : '#f3f4f6',
                color: points > 0 ? '#166534' : '#6b7280',
                borderRadius: '4px',
                fontSize: '0.75em',
                fontWeight: 500,
                userSelect: 'none',
            }, children: [points, "pts"] }));
    }
    return (_jsxs("div", { ...attributes, style: {
            display: 'flex',
            alignItems: 'flex-start',
            padding: selected && focused ? '7px' : '8px',
            margin: '4px 0',
            backgroundColor: '#f8fafc',
            border: selected && focused ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '4px',
        }, children: [correctnessIcon, _jsx("div", { style: { flex: 1 }, children: children }), pointsBadge] }));
}
