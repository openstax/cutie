"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleChoiceElement = SimpleChoiceElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_react_1 = require("slate-react");
const ChoiceScoringContext_1 = require("../../interactions/choice/ChoiceScoringContext");
const icons_1 = require("../../components/icons");
/**
 * Render a simple choice element
 */
function SimpleChoiceElement({ attributes, children, element, }) {
    var _a;
    const el = element;
    const identifier = el.attributes.identifier;
    const scoringInfo = (0, ChoiceScoringContext_1.useChoiceScoring)();
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    // Determine correctness indicator
    let correctnessIcon = null;
    if (scoringInfo === null || scoringInfo === void 0 ? void 0 : scoringInfo.hasCorrectness) {
        const isCorrect = scoringInfo.correctValues.includes(identifier);
        correctnessIcon = isCorrect ? ((0, jsx_runtime_1.jsx)("span", { contentEditable: false, style: {
                display: 'inline-flex',
                alignItems: 'center',
                color: '#16a34a',
                marginRight: '4px',
                userSelect: 'none',
            }, title: "Correct", children: (0, jsx_runtime_1.jsx)(icons_1.CheckIcon, { size: 16 }) })) : ((0, jsx_runtime_1.jsx)("span", { contentEditable: false, style: {
                display: 'inline-flex',
                alignItems: 'center',
                color: '#dc2626',
                marginRight: '4px',
                userSelect: 'none',
            }, title: "Incorrect", children: (0, jsx_runtime_1.jsx)(icons_1.CloseIcon, { size: 16 }) }));
    }
    // Determine points badge
    let pointsBadge = null;
    if (scoringInfo === null || scoringInfo === void 0 ? void 0 : scoringInfo.hasMapping) {
        const entry = scoringInfo.mappingByKey.get(identifier);
        const points = (_a = entry === null || entry === void 0 ? void 0 : entry.mappedValue) !== null && _a !== void 0 ? _a : scoringInfo.defaultMappedValue;
        pointsBadge = ((0, jsx_runtime_1.jsxs)("span", { contentEditable: false, style: {
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
    return ((0, jsx_runtime_1.jsxs)("div", { ...attributes, style: {
            display: 'flex',
            alignItems: 'flex-start',
            padding: selected && focused ? '7px' : '8px',
            margin: '4px 0',
            backgroundColor: '#f8fafc',
            border: selected && focused ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '4px',
        }, children: [correctnessIcon, (0, jsx_runtime_1.jsx)("div", { style: { flex: 1 }, children: children }), pointsBadge] }));
}
