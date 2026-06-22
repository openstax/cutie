"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackBlockPropertiesPanel = FeedbackBlockPropertiesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const slate_react_1 = require("slate-react");
const feedbackIdentifiers_1 = require("../../../utils/feedbackIdentifiers");
const useStyle_1 = require("../../../hooks/useStyle");
const __1 = require("..");
/**
 * Properties panel for editing feedback block attributes
 */
function FeedbackBlockPropertiesPanel({ element, path, onUpdate, responseProcessingConfig, }) {
    const editor = (0, slate_react_1.useSlate)();
    (0, useStyle_1.useStyle)('feedback-properties', __1.FEEDBACK_PROPERTIES_STYLES);
    const isCustomMode = (responseProcessingConfig === null || responseProcessingConfig === void 0 ? void 0 : responseProcessingConfig.mode) === 'custom';
    const attrs = element.attributes;
    const currentIdentifier = attrs.identifier || '';
    const currentShowHide = attrs['show-hide'] || 'show';
    const currentFeedbackType = (attrs['data-feedback-type'] || '');
    const feedbackOptions = (0, feedbackIdentifiers_1.getAllFeedbackIdentifierOptions)(editor.children);
    const handleIdentifierChange = (newIdentifier) => {
        const newAttrs = {
            ...attrs,
            identifier: newIdentifier,
        };
        onUpdate(path, newAttrs);
    };
    const handleShowHideChange = (value) => {
        const newAttrs = {
            ...attrs,
            'show-hide': value,
        };
        onUpdate(path, newAttrs);
    };
    const handleFeedbackTypeChange = (value) => {
        const newAttrs = {
            ...attrs,
            'data-feedback-type': value || undefined,
        };
        onUpdate(path, newAttrs);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-editor", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Feedback (Block)" }), isCustomMode && (0, jsx_runtime_1.jsx)(__1.CustomModeWarning, {}), (0, jsx_runtime_1.jsx)(__1.IdentifierSelector, { value: currentIdentifier, options: feedbackOptions, onChange: handleIdentifierChange, disabled: isCustomMode }), (0, jsx_runtime_1.jsx)(__1.ShowHideRadioGroup, { value: currentShowHide, onChange: handleShowHideChange, name: "show-hide-block", disabled: isCustomMode }), (0, jsx_runtime_1.jsx)(__1.FeedbackTypeSelector, { value: currentFeedbackType, onChange: handleFeedbackTypeChange }), currentIdentifier && !isCustomMode && ((0, jsx_runtime_1.jsx)(__1.IdentifierTip, { identifier: currentIdentifier, options: feedbackOptions })), isCustomMode && ((0, jsx_runtime_1.jsx)(__1.ReadonlyAttributeInfo, { outcomeIdentifier: attrs['outcome-identifier'] || 'FEEDBACK', identifier: currentIdentifier, showHide: currentShowHide }))] }));
}
