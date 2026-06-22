"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchInteractionElement = MatchInteractionElement;
exports.MatchSourceSetElement = MatchSourceSetElement;
exports.MatchTargetSetElement = MatchTargetSetElement;
exports.SimpleAssociableChoiceElement = SimpleAssociableChoiceElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const slate_react_1 = require("slate-react");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
const MatchScoringContext_1 = require("./MatchScoringContext");
/**
 * Renders a match interaction in the editor
 */
function MatchInteractionElement({ attributes, children, element, }) {
    const el = element;
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    // Build scoring info for children
    const scoringInfo = (0, react_1.useMemo)(() => {
        var _a;
        const responseDecl = el.responseDeclaration;
        const correctValues = (0, responseDeclaration_1.getCorrectValues)(responseDecl);
        const mappingData = (0, mappingDeclaration_1.getMapping)(responseDecl);
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
                }, children: "Match Interaction" }), (0, jsx_runtime_1.jsx)(MatchScoringContext_1.MatchScoringProvider, { value: scoringInfo, children: children })] }));
}
/**
 * Renders the source items container (editor-only wrapper)
 */
function MatchSourceSetElement({ attributes, children, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { ...attributes, style: {
            marginBottom: '12px',
        }, children: [(0, jsx_runtime_1.jsx)("div", { contentEditable: false, style: {
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                    userSelect: 'none',
                }, children: "Source Items" }), (0, jsx_runtime_1.jsx)("div", { style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                }, children: children })] }));
}
/**
 * Renders the target items container (editor-only wrapper)
 */
function MatchTargetSetElement({ attributes, children, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { ...attributes, style: {
            marginBottom: '8px',
        }, children: [(0, jsx_runtime_1.jsx)("div", { contentEditable: false, style: {
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                    userSelect: 'none',
                }, children: "Target Items" }), (0, jsx_runtime_1.jsx)("div", { style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                }, children: children })] }));
}
/**
 * Renders a simple associable choice element
 */
function SimpleAssociableChoiceElement({ attributes, children, element, }) {
    const el = element;
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    return ((0, jsx_runtime_1.jsxs)("span", { ...attributes, style: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            backgroundColor: selected && focused ? '#dbeafe' : '#e0f2fe',
            border: selected && focused ? '2px solid #3b82f6' : '1px solid #0ea5e9',
            borderRadius: '4px',
            cursor: 'text',
        }, children: [(0, jsx_runtime_1.jsx)("span", { contentEditable: false, style: {
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
