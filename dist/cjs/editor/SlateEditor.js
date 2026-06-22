"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlateEditor = SlateEditor;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const slate_1 = require("slate");
const slate_react_1 = require("slate-react");
const slate_history_1 = require("slate-history");
const plugins_1 = require("../plugins");
const Toolbar_1 = require("./Toolbar");
const xmlToSlate_1 = require("../serialization/xmlToSlate");
const slateToXml_1 = require("../serialization/slateToXml");
const PropertiesPanel_1 = require("../components/PropertiesPanel");
const choice_1 = require("../interactions/choice");
const textEntry_1 = require("../interactions/textEntry");
const inlineChoice_1 = require("../interactions/inlineChoice");
const extendedText_1 = require("../interactions/extendedText");
const gapMatch_1 = require("../interactions/gapMatch");
const match_1 = require("../interactions/match");
const prompt_1 = require("../elements/prompt");
const simpleChoice_1 = require("../elements/simpleChoice");
const image_1 = require("../elements/image");
const feedbackInline_1 = require("../elements/feedback/feedbackInline");
const feedbackBlock_1 = require("../elements/feedback/feedbackBlock");
const modalFeedback_1 = require("../elements/feedback/modalFeedback");
const contentBody_1 = require("../elements/contentBody");
const useStyle_1 = require("../hooks/useStyle");
const AssetContext_1 = require("../contexts/AssetContext");
const FeedbackIdentifiersContext_1 = require("../contexts/FeedbackIdentifiersContext");
const feedbackIdentifiers_1 = require("../utils/feedbackIdentifiers");
/**
 * Main Slate editor component for QTI editing
 */
function SlateEditor({ qtiXml, onQtiChange, onError, className = '', readOnly = false, placeholder = 'Enter content...', assetHandlers, }) {
    // Create editor instance with plugins (stable across renders)
    const editor = (0, react_1.useMemo)(() => {
        const baseEditor = (0, slate_react_1.withReact)((0, slate_history_1.withHistory)((0, slate_1.createEditor)()));
        return (0, plugins_1.withUnknownElements)((0, plugins_1.withQtiInteractions)((0, plugins_1.withXhtml)(baseEditor)));
    }, []);
    // Track the current QTI XML to detect external changes
    const qtiXmlRef = (0, react_1.useRef)(qtiXml);
    // Parse QTI XML to Slate format
    // Separate error from value to avoid calling onError during render
    const parseResult = (0, react_1.useMemo)(() => {
        try {
            return { value: (0, xmlToSlate_1.parseXmlToSlate)(qtiXml), error: null };
        }
        catch (err) {
            return {
                value: [{ type: 'paragraph', children: [{ text: '' }] }],
                error: err instanceof Error ? err.message : 'Failed to parse QTI XML',
            };
        }
    }, [qtiXml]);
    // Defer error callback to useEffect to avoid setState during render
    (0, react_1.useEffect)(() => {
        if (parseResult.error) {
            onError === null || onError === void 0 ? void 0 : onError(parseResult.error);
        }
    }, [parseResult.error, onError]);
    const initialValue = parseResult.value;
    // Internal Slate value state
    const [value, setValue] = (0, react_1.useState)(initialValue);
    // Track selected interaction element for properties panel
    const [selectedElement, setSelectedElement] = (0, react_1.useState)(null);
    const [selectedPath, setSelectedPath] = (0, react_1.useState)(null);
    // Normalize on initial mount to ensure trailing paragraph exists
    (0, react_1.useEffect)(() => {
        slate_1.Editor.normalize(editor, { force: true });
    }, [editor]);
    // Handle Slate value changes
    const handleChange = (0, react_1.useCallback)((newValue) => {
        setValue(newValue);
        // Track selected element for properties panel
        const { selection } = editor;
        if (!selection) {
            setSelectedElement(null);
            setSelectedPath(null);
        }
        else {
            // Find the deepest element with a properties panel at selection
            // We want the most specific element (e.g., image inside an interaction)
            let deepestMatch = null;
            for (const [node, path] of slate_1.Editor.nodes(editor, {
                at: selection,
                match: (n) => slate_1.Element.isElement(n) &&
                    hasPropertiesPanel(n),
            })) {
                // Keep the match with the longest path (deepest in the tree)
                if (!deepestMatch || path.length > deepestMatch[1].length) {
                    deepestMatch = [node, path];
                }
            }
            if (deepestMatch) {
                setSelectedElement(deepestMatch[0]);
                setSelectedPath(deepestMatch[1]);
            }
            else {
                setSelectedElement(null);
                setSelectedPath(null);
            }
        }
        // Serialize back to QTI and notify parent
        if (onQtiChange && !readOnly) {
            try {
                const result = (0, slateToXml_1.serializeSlateToQti)(newValue, qtiXmlRef.current);
                // Check for errors
                if (result.errors && result.errors.length > 0) {
                    const errorMessages = result.errors.map(e => e.message).join(', ');
                    onError === null || onError === void 0 ? void 0 : onError(errorMessages);
                }
                // Update the ref and notify parent
                qtiXmlRef.current = result.xml;
                onQtiChange(result.xml, result);
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to serialize QTI XML';
                onError === null || onError === void 0 ? void 0 : onError(errorMessage);
            }
        }
    }, [editor, onQtiChange, onError, readOnly]);
    // When qtiXml changes externally, update the editor
    (0, react_1.useEffect)(() => {
        if (qtiXml !== qtiXmlRef.current) {
            qtiXmlRef.current = qtiXml;
            try {
                const newValue = (0, xmlToSlate_1.parseXmlToSlate)(qtiXml);
                setValue(newValue);
                // Directly update the Slate editor instance since initialValue only works on mount
                editor.children = newValue;
                slate_1.Transforms.deselect(editor);
                // Force normalization to ensure trailing paragraph exists
                slate_1.Editor.normalize(editor, { force: true });
                editor.onChange();
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to parse QTI XML';
                onError === null || onError === void 0 ? void 0 : onError(errorMessage);
            }
        }
    }, [qtiXml, onError, editor]);
    // Handle attribute updates from properties panel
    const handleUpdateAttributes = (0, react_1.useCallback)((path, attributes, responseDeclaration, additionalProps) => {
        // Always include responseDeclaration in updates so it can be removed (set to undefined)
        const updates = { attributes, responseDeclaration, ...additionalProps };
        slate_1.Transforms.setNodes(editor, updates, { at: path });
    }, [editor]);
    // Handle response processing mode change
    const handleResponseProcessingModeChange = (0, react_1.useCallback)((mode) => {
        // Find the metadata node at [0]
        const metadata = getDocumentMetadata(value);
        if (!metadata)
            return;
        // If switching to 'custom' mode, preserve the existing customXml if any
        // If switching to a managed mode, clear customXml (we'll regenerate response processing)
        const newConfig = mode === 'custom'
            ? { mode, customXml: metadata.responseProcessing.customXml }
            : { mode };
        // Update the mode using Transforms.setNodes
        slate_1.Transforms.setNodes(editor, {
            responseProcessing: newConfig,
        }, { at: [0] });
    }, [editor, value]);
    // Extract response processing config and interaction info
    const metadata = getDocumentMetadata(value);
    const responseProcessingConfig = metadata === null || metadata === void 0 ? void 0 : metadata.responseProcessing;
    const { count: interactionCount, hasFeedbackElements } = analyzeInteractions(value);
    // Compute available feedback identifiers from interactions
    const feedbackOptions = (0, react_1.useMemo)(() => (0, feedbackIdentifiers_1.getAllFeedbackIdentifierOptions)(value), [value]);
    // Context value for feedback identifiers
    const feedbackIdentifiersContextValue = (0, react_1.useMemo)(() => ({
        availableIdentifiers: new Set(feedbackOptions.map(o => o.id)),
        identifierLabels: new Map(feedbackOptions.map(o => [o.id, o.label])),
        isCustomMode: (responseProcessingConfig === null || responseProcessingConfig === void 0 ? void 0 : responseProcessingConfig.mode) === 'custom',
    }), [feedbackOptions, responseProcessingConfig === null || responseProcessingConfig === void 0 ? void 0 : responseProcessingConfig.mode]);
    // Render element callback
    const renderElement = (0, react_1.useCallback)((props) => {
        return (0, jsx_runtime_1.jsx)(Element, { ...props });
    }, []);
    // Render leaf callback
    const renderLeaf = (0, react_1.useCallback)((props) => {
        return (0, jsx_runtime_1.jsx)(Leaf, { ...props });
    }, []);
    // Add container styles
    (0, useStyle_1.useStyle)('slate-editor-container', EDITOR_LAYOUT_STYLES);
    return ((0, jsx_runtime_1.jsx)(AssetContext_1.AssetContext.Provider, { value: assetHandlers !== null && assetHandlers !== void 0 ? assetHandlers : {}, children: (0, jsx_runtime_1.jsx)(FeedbackIdentifiersContext_1.FeedbackIdentifiersContext.Provider, { value: feedbackIdentifiersContextValue, children: (0, jsx_runtime_1.jsx)(slate_react_1.Slate, { editor: editor, initialValue: value, onChange: handleChange, children: (0, jsx_runtime_1.jsxs)("div", { className: "slate-editor-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: `slate-editor ${className}`, children: [(0, jsx_runtime_1.jsx)(Toolbar_1.Toolbar, {}), (0, jsx_runtime_1.jsx)(slate_react_1.Editable, { renderElement: renderElement, renderLeaf: renderLeaf, placeholder: placeholder, readOnly: readOnly, spellCheck: true, autoFocus: true, style: {
                                        flex: 1,
                                        padding: '16px',
                                        minHeight: 0,
                                        overflowY: 'auto',
                                    } })] }), (0, jsx_runtime_1.jsx)(PropertiesPanel_1.PropertiesPanel, { selectedElement: selectedElement, selectedPath: selectedPath, onUpdateAttributes: handleUpdateAttributes, responseProcessingConfig: responseProcessingConfig, interactionCount: interactionCount, hasFeedbackElements: hasFeedbackElements, onResponseProcessingModeChange: handleResponseProcessingModeChange })] }) }) }) }));
}
/**
 * Helper function to check if an element is a QTI interaction
 */
function isInteractionElement(element) {
    return (element.type === 'qti-text-entry-interaction' ||
        element.type === 'qti-inline-choice-interaction' ||
        element.type === 'qti-extended-text-interaction' ||
        element.type === 'qti-choice-interaction' ||
        element.type === 'qti-gap-match-interaction' ||
        element.type === 'qti-match-interaction');
}
/**
 * Helper function to check if an element has a properties panel
 */
function hasPropertiesPanel(element) {
    return (isInteractionElement(element) ||
        element.type === 'image' ||
        element.type === 'qti-simple-choice' ||
        element.type === 'qti-gap-text' ||
        element.type === 'qti-gap-img' ||
        element.type === 'qti-gap' ||
        element.type === 'qti-simple-associable-choice' ||
        element.type === 'qti-feedback-inline' ||
        element.type === 'qti-feedback-block' ||
        element.type === 'qti-modal-feedback');
}
/**
 * Extract document metadata from Slate value
 */
function getDocumentMetadata(nodes) {
    if (nodes.length > 0 && 'type' in nodes[0] && nodes[0].type === 'document-metadata') {
        return nodes[0];
    }
    return null;
}
/**
 * Count interactions and check for mappings and feedback elements in the document
 */
function analyzeInteractions(nodes) {
    let count = 0;
    let hasFeedbackElements = false;
    function traverse(node) {
        if ('type' in node) {
            const element = node;
            if (isInteractionElement(element)) {
                count++;
            }
            // Check for feedback elements
            if (element.type === 'qti-feedback-inline' || element.type === 'qti-feedback-block' || element.type === 'qti-modal-feedback') {
                hasFeedbackElements = true;
            }
            if ('children' in element) {
                for (const child of element.children) {
                    traverse(child);
                }
            }
        }
    }
    for (const node of nodes) {
        traverse(node);
    }
    return { count, hasFeedbackElements };
}
// Single contact point per interaction: spread all renderer objects
const interactionRenderers = {
    ...choice_1.choiceRenderers,
    ...textEntry_1.textEntryRenderers,
    ...inlineChoice_1.inlineChoiceRenderers,
    ...extendedText_1.extendedTextRenderers,
    ...gapMatch_1.gapMatchRenderers,
    ...match_1.matchRenderers,
    ...prompt_1.promptRenderers,
    ...simpleChoice_1.simpleChoiceRenderers,
    ...image_1.imageRenderers,
    ...feedbackInline_1.feedbackInlineRenderers,
    ...feedbackBlock_1.feedbackBlockRenderers,
    ...modalFeedback_1.modalFeedbackRenderers,
    ...contentBody_1.contentBodyRenderers,
};
/**
 * Element renderer component
 */
function Element({ attributes, children, element }) {
    const el = element;
    // Check interaction renderers first
    const Renderer = interactionRenderers[el.type];
    if (Renderer) {
        return (0, jsx_runtime_1.jsx)(Renderer, { attributes: attributes, children: children, element: element });
    }
    // Fall through to generic elements
    switch (el.type) {
        // Document metadata is a void element that stores response processing config
        // It should not be visible in the editor
        case 'document-metadata':
            return ((0, jsx_runtime_1.jsx)("span", { ...attributes, style: { display: 'none' }, children: children }));
        case 'qti-unknown':
            return ((0, jsx_runtime_1.jsxs)("span", { ...attributes, style: {
                    display: 'inline-block',
                    padding: '12px',
                    margin: '8px 0',
                    backgroundColor: '#fff3e0',
                    border: '2px dashed #ff9800',
                    borderRadius: '4px',
                }, children: [(0, jsx_runtime_1.jsxs)("span", { contentEditable: false, style: {
                            display: 'block',
                            marginBottom: '8px',
                            padding: '4px 8px',
                            backgroundColor: '#ffe0b2',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            color: '#e65100',
                            userSelect: 'none',
                        }, children: ["\u26A0\uFE0F Unsupported element: ", (0, jsx_runtime_1.jsx)("code", { children: el.originalTagName }), (0, jsx_runtime_1.jsx)("span", { style: { display: 'block', fontSize: '0.85em', marginTop: '4px' }, children: "This QTI element is not yet supported by the editor. Content will be preserved when you save." })] }), children] }));
        case 'paragraph':
            return (0, jsx_runtime_1.jsx)("p", { ...attributes, style: { textAlign: el.align }, children: children });
        case 'div':
            return (0, jsx_runtime_1.jsx)("div", { ...attributes, children: children });
        case 'span':
            return (0, jsx_runtime_1.jsx)("span", { ...attributes, children: children });
        case 'heading':
            const headingStyle = { textAlign: el.align };
            switch (el.level) {
                case 1:
                    return (0, jsx_runtime_1.jsx)("h1", { ...attributes, style: headingStyle, children: children });
                case 2:
                    return (0, jsx_runtime_1.jsx)("h2", { ...attributes, style: headingStyle, children: children });
                case 3:
                    return (0, jsx_runtime_1.jsx)("h3", { ...attributes, style: headingStyle, children: children });
                case 4:
                    return (0, jsx_runtime_1.jsx)("h4", { ...attributes, style: headingStyle, children: children });
                case 5:
                    return (0, jsx_runtime_1.jsx)("h5", { ...attributes, style: headingStyle, children: children });
                case 6:
                    return (0, jsx_runtime_1.jsx)("h6", { ...attributes, style: headingStyle, children: children });
                default:
                    return (0, jsx_runtime_1.jsx)("h2", { ...attributes, style: headingStyle, children: children });
            }
        case 'line-break':
            return (0, jsx_runtime_1.jsx)("br", { ...attributes });
        case 'list':
            const ListTag = el.ordered ? 'ol' : 'ul';
            return (0, jsx_runtime_1.jsx)(ListTag, { ...attributes, children: children });
        case 'list-item':
            return (0, jsx_runtime_1.jsx)("li", { ...attributes, children: children });
        case 'strong':
            return (0, jsx_runtime_1.jsx)("strong", { ...attributes, children: children });
        case 'em':
            return (0, jsx_runtime_1.jsx)("em", { ...attributes, children: children });
        case 'blockquote':
            return ((0, jsx_runtime_1.jsx)("blockquote", { ...attributes, style: {
                    borderLeft: '3px solid #ccc',
                    paddingLeft: '12px',
                    margin: '8px 0',
                    color: '#666',
                    textAlign: el.align,
                }, children: children }));
        case 'horizontal-rule':
            return ((0, jsx_runtime_1.jsxs)("div", { ...attributes, contentEditable: false, children: [(0, jsx_runtime_1.jsx)("hr", { style: { border: 'none', borderTop: '1px solid #ccc', margin: '16px 0' } }), children] }));
        default:
            return (0, jsx_runtime_1.jsx)("div", { ...attributes, children: children });
    }
}
/**
 * Leaf renderer component
 */
function Leaf({ attributes, children, leaf }) {
    let content = children;
    if (leaf.bold) {
        content = (0, jsx_runtime_1.jsx)("strong", { children: content });
    }
    if (leaf.italic) {
        content = (0, jsx_runtime_1.jsx)("em", { children: content });
    }
    if (leaf.underline) {
        content = (0, jsx_runtime_1.jsx)("u", { children: content });
    }
    if (leaf.code) {
        content = (0, jsx_runtime_1.jsx)("code", { children: content });
    }
    if (leaf.strikethrough) {
        content = (0, jsx_runtime_1.jsx)("s", { children: content });
    }
    return (0, jsx_runtime_1.jsx)("span", { ...attributes, children: content });
}
/**
 * Layout styles for editor container
 */
const EDITOR_LAYOUT_STYLES = `
  .slate-editor-container {
    display: flex;
    height: 100%;
    gap: 0;
  }

  .slate-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .slate-editor > div[role="textbox"] {
    outline: none;
  }
`;
