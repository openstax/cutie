"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChoiceElement = ChoiceElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const slate_react_1 = require("slate-react");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
const ChoiceScoringContext_1 = require("./ChoiceScoringContext");
/**
 * Renders a choice interaction in the editor
 */
function ChoiceElement({ attributes, children, element, }) {
    const el = element;
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    // Build scoring info for children
    const scoringInfo = (0, react_1.useMemo)(() => {
        var _a;
        const responseDecl = el.responseDeclaration;
        const correctValues = (0, responseDeclaration_1.getCorrectValues)(responseDecl);
        const mappingData = (0, mappingDeclaration_1.getMapping)(responseDecl);
        const mappingByKey = new Map();
        if (mappingData) {
            for (const entry of mappingData.entries) {
                mappingByKey.set(entry.mapKey, entry);
            }
        }
        return {
            correctValues,
            hasCorrectness: (0, responseDeclaration_1.hasCorrectResponse)(responseDecl),
            mappingByKey,
            hasMapping: (0, mappingDeclaration_1.hasMapping)(responseDecl),
            defaultMappedValue: (_a = mappingData === null || mappingData === void 0 ? void 0 : mappingData.metadata.defaultValue) !== null && _a !== void 0 ? _a : 0,
        };
    }, [el.responseDeclaration]);
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
                }, children: "Choice Interaction" }), (0, jsx_runtime_1.jsx)(ChoiceScoringContext_1.ChoiceScoringProvider, { value: scoringInfo, children: children })] }));
}
