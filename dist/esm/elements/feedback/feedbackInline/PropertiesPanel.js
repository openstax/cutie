import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSlate } from 'slate-react';
import { getAllFeedbackIdentifierOptions } from '../../../utils/feedbackIdentifiers';
import { useStyle } from '../../../hooks/useStyle';
import { FEEDBACK_PROPERTIES_STYLES, CustomModeWarning, IdentifierSelector, ShowHideRadioGroup, ReadonlyAttributeInfo, IdentifierTip, FeedbackTypeSelector, } from '..';
/**
 * Properties panel for editing feedback inline attributes
 */
export function FeedbackInlinePropertiesPanel({ element, path, onUpdate, responseProcessingConfig, }) {
    const editor = useSlate();
    useStyle('feedback-properties', FEEDBACK_PROPERTIES_STYLES);
    const isCustomMode = (responseProcessingConfig === null || responseProcessingConfig === void 0 ? void 0 : responseProcessingConfig.mode) === 'custom';
    const attrs = element.attributes;
    const currentIdentifier = attrs.identifier || '';
    const currentShowHide = attrs['show-hide'] || 'show';
    const currentFeedbackType = (attrs['data-feedback-type'] || '');
    const feedbackOptions = getAllFeedbackIdentifierOptions(editor.children);
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
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Feedback (Inline)" }), isCustomMode && _jsx(CustomModeWarning, {}), _jsx(IdentifierSelector, { value: currentIdentifier, options: feedbackOptions, onChange: handleIdentifierChange, disabled: isCustomMode }), _jsx(ShowHideRadioGroup, { value: currentShowHide, onChange: handleShowHideChange, name: "show-hide-inline", disabled: isCustomMode }), _jsx(FeedbackTypeSelector, { value: currentFeedbackType, onChange: handleFeedbackTypeChange }), currentIdentifier && !isCustomMode && (_jsx(IdentifierTip, { identifier: currentIdentifier, options: feedbackOptions })), isCustomMode && (_jsx(ReadonlyAttributeInfo, { outcomeIdentifier: attrs['outcome-identifier'] || 'FEEDBACK', identifier: currentIdentifier, showHide: currentShowHide }))] }));
}
