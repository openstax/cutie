"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChoiceIdLabel = ChoiceIdLabel;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Renders a decorative (non-editable) choice identifier label
 * This is a void element - the identifier is stored in attributes and edited via properties panel
 */
function ChoiceIdLabel({ attributes, children, element, }) {
    var _a;
    const el = element;
    const identifier = ((_a = el.attributes) === null || _a === void 0 ? void 0 : _a.identifier) || '';
    return ((0, jsx_runtime_1.jsxs)("div", { ...attributes, contentEditable: false, style: {
            display: 'inline-block',
            marginRight: '8px',
            color: '#475569',
            fontWeight: 'bold',
            fontSize: '1.1em',
            userSelect: 'none',
            verticalAlign: 'baseline',
            cursor: 'default',
        }, children: [identifier, (0, jsx_runtime_1.jsx)("span", { style: { display: 'none' }, children: children })] }));
}
