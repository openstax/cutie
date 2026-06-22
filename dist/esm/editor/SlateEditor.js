import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { createEditor, Editor, Element as SlateElementType, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { withQtiInteractions, withXhtml, withUnknownElements } from '../plugins';
import { Toolbar } from './Toolbar';
import { parseXmlToSlate } from '../serialization/xmlToSlate';
import { serializeSlateToQti } from '../serialization/slateToXml';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { choiceRenderers } from '../interactions/choice';
import { textEntryRenderers } from '../interactions/textEntry';
import { inlineChoiceRenderers } from '../interactions/inlineChoice';
import { extendedTextRenderers } from '../interactions/extendedText';
import { gapMatchRenderers } from '../interactions/gapMatch';
import { matchRenderers } from '../interactions/match';
import { promptRenderers } from '../elements/prompt';
import { simpleChoiceRenderers } from '../elements/simpleChoice';
import { imageRenderers } from '../elements/image';
import { feedbackInlineRenderers } from '../elements/feedback/feedbackInline';
import { feedbackBlockRenderers } from '../elements/feedback/feedbackBlock';
import { modalFeedbackRenderers } from '../elements/feedback/modalFeedback';
import { contentBodyRenderers } from '../elements/contentBody';
import { useStyle } from '../hooks/useStyle';
import { AssetContext } from '../contexts/AssetContext';
import { FeedbackIdentifiersContext } from '../contexts/FeedbackIdentifiersContext';
import { getAllFeedbackIdentifierOptions } from '../utils/feedbackIdentifiers';
/**
 * Main Slate editor component for QTI editing
 */
export function SlateEditor({ qtiXml, onQtiChange, onError, className = '', readOnly = false, placeholder = 'Enter content...', assetHandlers, }) {
    // Create editor instance with plugins (stable across renders)
    const editor = useMemo(() => {
        const baseEditor = withReact(withHistory(createEditor()));
        return withUnknownElements(withQtiInteractions(withXhtml(baseEditor)));
    }, []);
    // Track the current QTI XML to detect external changes
    const qtiXmlRef = useRef(qtiXml);
    // Parse QTI XML to Slate format
    // Separate error from value to avoid calling onError during render
    const parseResult = useMemo(() => {
        try {
            return { value: parseXmlToSlate(qtiXml), error: null };
        }
        catch (err) {
            return {
                value: [{ type: 'paragraph', children: [{ text: '' }] }],
                error: err instanceof Error ? err.message : 'Failed to parse QTI XML',
            };
        }
    }, [qtiXml]);
    // Defer error callback to useEffect to avoid setState during render
    useEffect(() => {
        if (parseResult.error) {
            onError === null || onError === void 0 ? void 0 : onError(parseResult.error);
        }
    }, [parseResult.error, onError]);
    const initialValue = parseResult.value;
    // Internal Slate value state
    const [value, setValue] = useState(initialValue);
    // Track selected interaction element for properties panel
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);
    // Normalize on initial mount to ensure trailing paragraph exists
    useEffect(() => {
        Editor.normalize(editor, { force: true });
    }, [editor]);
    // Handle Slate value changes
    const handleChange = useCallback((newValue) => {
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
            for (const [node, path] of Editor.nodes(editor, {
                at: selection,
                match: (n) => SlateElementType.isElement(n) &&
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
                const result = serializeSlateToQti(newValue, qtiXmlRef.current);
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
    useEffect(() => {
        if (qtiXml !== qtiXmlRef.current) {
            qtiXmlRef.current = qtiXml;
            try {
                const newValue = parseXmlToSlate(qtiXml);
                setValue(newValue);
                // Directly update the Slate editor instance since initialValue only works on mount
                editor.children = newValue;
                Transforms.deselect(editor);
                // Force normalization to ensure trailing paragraph exists
                Editor.normalize(editor, { force: true });
                editor.onChange();
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to parse QTI XML';
                onError === null || onError === void 0 ? void 0 : onError(errorMessage);
            }
        }
    }, [qtiXml, onError, editor]);
    // Handle attribute updates from properties panel
    const handleUpdateAttributes = useCallback((path, attributes, responseDeclaration, additionalProps) => {
        // Always include responseDeclaration in updates so it can be removed (set to undefined)
        const updates = { attributes, responseDeclaration, ...additionalProps };
        Transforms.setNodes(editor, updates, { at: path });
    }, [editor]);
    // Handle response processing mode change
    const handleResponseProcessingModeChange = useCallback((mode) => {
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
        Transforms.setNodes(editor, {
            responseProcessing: newConfig,
        }, { at: [0] });
    }, [editor, value]);
    // Extract response processing config and interaction info
    const metadata = getDocumentMetadata(value);
    const responseProcessingConfig = metadata === null || metadata === void 0 ? void 0 : metadata.responseProcessing;
    const { count: interactionCount, hasFeedbackElements } = analyzeInteractions(value);
    // Compute available feedback identifiers from interactions
    const feedbackOptions = useMemo(() => getAllFeedbackIdentifierOptions(value), [value]);
    // Context value for feedback identifiers
    const feedbackIdentifiersContextValue = useMemo(() => ({
        availableIdentifiers: new Set(feedbackOptions.map(o => o.id)),
        identifierLabels: new Map(feedbackOptions.map(o => [o.id, o.label])),
        isCustomMode: (responseProcessingConfig === null || responseProcessingConfig === void 0 ? void 0 : responseProcessingConfig.mode) === 'custom',
    }), [feedbackOptions, responseProcessingConfig === null || responseProcessingConfig === void 0 ? void 0 : responseProcessingConfig.mode]);
    // Render element callback
    const renderElement = useCallback((props) => {
        return _jsx(Element, { ...props });
    }, []);
    // Render leaf callback
    const renderLeaf = useCallback((props) => {
        return _jsx(Leaf, { ...props });
    }, []);
    // Add container styles
    useStyle('slate-editor-container', EDITOR_LAYOUT_STYLES);
    return (_jsx(AssetContext.Provider, { value: assetHandlers !== null && assetHandlers !== void 0 ? assetHandlers : {}, children: _jsx(FeedbackIdentifiersContext.Provider, { value: feedbackIdentifiersContextValue, children: _jsx(Slate, { editor: editor, initialValue: value, onChange: handleChange, children: _jsxs("div", { className: "slate-editor-container", children: [_jsxs("div", { className: `slate-editor ${className}`, children: [_jsx(Toolbar, {}), _jsx(Editable, { renderElement: renderElement, renderLeaf: renderLeaf, placeholder: placeholder, readOnly: readOnly, spellCheck: true, autoFocus: true, style: {
                                        flex: 1,
                                        padding: '16px',
                                        minHeight: 0,
                                        overflowY: 'auto',
                                    } })] }), _jsx(PropertiesPanel, { selectedElement: selectedElement, selectedPath: selectedPath, onUpdateAttributes: handleUpdateAttributes, responseProcessingConfig: responseProcessingConfig, interactionCount: interactionCount, hasFeedbackElements: hasFeedbackElements, onResponseProcessingModeChange: handleResponseProcessingModeChange })] }) }) }) }));
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
    ...choiceRenderers,
    ...textEntryRenderers,
    ...inlineChoiceRenderers,
    ...extendedTextRenderers,
    ...gapMatchRenderers,
    ...matchRenderers,
    ...promptRenderers,
    ...simpleChoiceRenderers,
    ...imageRenderers,
    ...feedbackInlineRenderers,
    ...feedbackBlockRenderers,
    ...modalFeedbackRenderers,
    ...contentBodyRenderers,
};
/**
 * Element renderer component
 */
function Element({ attributes, children, element }) {
    const el = element;
    // Check interaction renderers first
    const Renderer = interactionRenderers[el.type];
    if (Renderer) {
        return _jsx(Renderer, { attributes: attributes, children: children, element: element });
    }
    // Fall through to generic elements
    switch (el.type) {
        // Document metadata is a void element that stores response processing config
        // It should not be visible in the editor
        case 'document-metadata':
            return (_jsx("span", { ...attributes, style: { display: 'none' }, children: children }));
        case 'qti-unknown':
            return (_jsxs("span", { ...attributes, style: {
                    display: 'inline-block',
                    padding: '12px',
                    margin: '8px 0',
                    backgroundColor: '#fff3e0',
                    border: '2px dashed #ff9800',
                    borderRadius: '4px',
                }, children: [_jsxs("span", { contentEditable: false, style: {
                            display: 'block',
                            marginBottom: '8px',
                            padding: '4px 8px',
                            backgroundColor: '#ffe0b2',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            color: '#e65100',
                            userSelect: 'none',
                        }, children: ["\u26A0\uFE0F Unsupported element: ", _jsx("code", { children: el.originalTagName }), _jsx("span", { style: { display: 'block', fontSize: '0.85em', marginTop: '4px' }, children: "This QTI element is not yet supported by the editor. Content will be preserved when you save." })] }), children] }));
        case 'paragraph':
            return _jsx("p", { ...attributes, style: { textAlign: el.align }, children: children });
        case 'div':
            return _jsx("div", { ...attributes, children: children });
        case 'span':
            return _jsx("span", { ...attributes, children: children });
        case 'heading':
            const headingStyle = { textAlign: el.align };
            switch (el.level) {
                case 1:
                    return _jsx("h1", { ...attributes, style: headingStyle, children: children });
                case 2:
                    return _jsx("h2", { ...attributes, style: headingStyle, children: children });
                case 3:
                    return _jsx("h3", { ...attributes, style: headingStyle, children: children });
                case 4:
                    return _jsx("h4", { ...attributes, style: headingStyle, children: children });
                case 5:
                    return _jsx("h5", { ...attributes, style: headingStyle, children: children });
                case 6:
                    return _jsx("h6", { ...attributes, style: headingStyle, children: children });
                default:
                    return _jsx("h2", { ...attributes, style: headingStyle, children: children });
            }
        case 'line-break':
            return _jsx("br", { ...attributes });
        case 'list':
            const ListTag = el.ordered ? 'ol' : 'ul';
            return _jsx(ListTag, { ...attributes, children: children });
        case 'list-item':
            return _jsx("li", { ...attributes, children: children });
        case 'strong':
            return _jsx("strong", { ...attributes, children: children });
        case 'em':
            return _jsx("em", { ...attributes, children: children });
        case 'blockquote':
            return (_jsx("blockquote", { ...attributes, style: {
                    borderLeft: '3px solid #ccc',
                    paddingLeft: '12px',
                    margin: '8px 0',
                    color: '#666',
                    textAlign: el.align,
                }, children: children }));
        case 'horizontal-rule':
            return (_jsxs("div", { ...attributes, contentEditable: false, children: [_jsx("hr", { style: { border: 'none', borderTop: '1px solid #ccc', margin: '16px 0' } }), children] }));
        default:
            return _jsx("div", { ...attributes, children: children });
    }
}
/**
 * Leaf renderer component
 */
function Leaf({ attributes, children, leaf }) {
    let content = children;
    if (leaf.bold) {
        content = _jsx("strong", { children: content });
    }
    if (leaf.italic) {
        content = _jsx("em", { children: content });
    }
    if (leaf.underline) {
        content = _jsx("u", { children: content });
    }
    if (leaf.code) {
        content = _jsx("code", { children: content });
    }
    if (leaf.strikethrough) {
        content = _jsx("s", { children: content });
    }
    return _jsx("span", { ...attributes, children: content });
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
