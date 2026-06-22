import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { useSlate } from 'slate-react';
import { insertChoiceInteraction } from '../interactions/choice';
import { insertTextEntryInteraction } from '../interactions/textEntry';
import { insertInlineChoiceInteraction } from '../interactions/inlineChoice';
import { insertExtendedTextInteraction } from '../interactions/extendedText';
import { insertGapMatchInteraction } from '../interactions/gapMatch';
import { insertMatchInteraction } from '../interactions/match';
import { insertImage } from '../elements/image';
import { insertFeedbackInline } from '../elements/feedback/feedbackInline';
import { insertFeedbackBlock } from '../elements/feedback/feedbackBlock';
import { insertModalFeedback } from '../elements/feedback/modalFeedback';
import { useAssetHandlers } from '../contexts/AssetContext';
import { BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon, BulletedListIcon, NumberedListIcon, HorizontalRuleIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AddBoxIcon, ExpandMoreIcon, ImageIcon, CheckBoxIcon, FeedbackIcon, } from '../components/icons';
/**
 * Toolbar component for the Slate editor
 */
export function Toolbar() {
    const editor = useSlate();
    const { uploadAsset } = useAssetHandlers();
    const [interactionsOpen, setInteractionsOpen] = React.useState(false);
    const [elementsOpen, setElementsOpen] = React.useState(false);
    const [feedbackOpen, setFeedbackOpen] = React.useState(false);
    const [blockTypeOpen, setBlockTypeOpen] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const interactionsDropdownRef = React.useRef(null);
    const elementsDropdownRef = React.useRef(null);
    const feedbackDropdownRef = React.useRef(null);
    const blockTypeDropdownRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    // Close dropdowns when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (interactionsOpen &&
                interactionsDropdownRef.current &&
                !interactionsDropdownRef.current.contains(event.target)) {
                setInteractionsOpen(false);
            }
            if (elementsOpen &&
                elementsDropdownRef.current &&
                !elementsDropdownRef.current.contains(event.target)) {
                setElementsOpen(false);
            }
            if (feedbackOpen &&
                feedbackDropdownRef.current &&
                !feedbackDropdownRef.current.contains(event.target)) {
                setFeedbackOpen(false);
            }
            if (blockTypeOpen &&
                blockTypeDropdownRef.current &&
                !blockTypeDropdownRef.current.contains(event.target)) {
                setBlockTypeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [interactionsOpen, elementsOpen, feedbackOpen, blockTypeOpen]);
    // Get current block type for dropdown label
    const currentBlockType = getCurrentBlockType(editor);
    return (_jsxs("div", { style: {
            padding: '8px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            backgroundColor: '#f5f5f5',
            alignItems: 'center',
        }, children: [_jsxs("div", { ref: blockTypeDropdownRef, style: { position: 'relative' }, children: [_jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            setBlockTypeOpen(!blockTypeOpen);
                        }, title: "Block Type", style: { minWidth: '120px', textAlign: 'left' }, children: _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [currentBlockType, _jsx(ExpandMoreIcon, { size: 16 })] }) }), blockTypeOpen && (_jsxs("div", { style: {
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '140px',
                        }, children: [_jsx(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'paragraph');
                                    setBlockTypeOpen(false);
                                }, active: isBlockActive(editor, 'paragraph'), children: "Normal Text" }), _jsx(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'heading', { level: 1 });
                                    setBlockTypeOpen(false);
                                }, active: isHeadingActive(editor, 1), children: "Heading 1" }), _jsx(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'heading', { level: 2 });
                                    setBlockTypeOpen(false);
                                }, active: isHeadingActive(editor, 2), children: "Heading 2" }), _jsx(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'heading', { level: 3 });
                                    setBlockTypeOpen(false);
                                }, active: isHeadingActive(editor, 3), children: "Heading 3" }), _jsx(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'blockquote');
                                    setBlockTypeOpen(false);
                                }, active: isBlockActive(editor, 'blockquote'), children: "Blockquote" })] }))] }), _jsxs(ButtonGroup, { children: [_jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'bold');
                        }, title: "Bold", active: isMarkActive(editor, 'bold'), position: "first", children: _jsx(BoldIcon, {}) }), _jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'italic');
                        }, title: "Italic", active: isMarkActive(editor, 'italic'), position: "middle", children: _jsx(ItalicIcon, {}) }), _jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'underline');
                        }, title: "Underline", active: isMarkActive(editor, 'underline'), position: "middle", children: _jsx(UnderlineIcon, {}) }), _jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'strikethrough');
                        }, title: "Strikethrough", active: isMarkActive(editor, 'strikethrough'), position: "middle", children: _jsx(StrikethroughIcon, {}) }), _jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'code');
                        }, title: "Code", active: isMarkActive(editor, 'code'), position: "last", children: _jsx(CodeIcon, {}) })] }), _jsxs(ButtonGroup, { children: [_jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleList(editor, false);
                        }, title: "Bulleted List", active: isListActive(editor, false), position: "first", children: _jsx(BulletedListIcon, {}) }), _jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleList(editor, true);
                        }, title: "Numbered List", active: isListActive(editor, true), position: "last", children: _jsx(NumberedListIcon, {}) })] }), _jsxs(ButtonGroup, { children: [_jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleAlignment(editor, 'left');
                        }, title: "Align Left", active: isAlignmentActive(editor, 'left'), disabled: !isAlignmentAvailable(editor), position: "first", children: _jsx(AlignLeftIcon, {}) }), _jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleAlignment(editor, 'center');
                        }, title: "Align Center", active: isAlignmentActive(editor, 'center'), disabled: !isAlignmentAvailable(editor), position: "middle", children: _jsx(AlignCenterIcon, {}) }), _jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleAlignment(editor, 'right');
                        }, title: "Align Right", active: isAlignmentActive(editor, 'right'), disabled: !isAlignmentAvailable(editor), position: "last", children: _jsx(AlignRightIcon, {}) })] }), _jsx("div", { style: { flex: 1 } }), uploadAsset && (_jsx("input", { type: "file", accept: "image/*", ref: fileInputRef, style: { display: 'none' }, onChange: async (event) => {
                    var _a;
                    const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
                    if (!file)
                        return;
                    setIsUploading(true);
                    try {
                        const src = await uploadAsset(file);
                        insertImage(editor, src);
                    }
                    catch (error) {
                        console.error('Failed to upload image:', error);
                    }
                    finally {
                        setIsUploading(false);
                        // Reset input so the same file can be selected again
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                    }
                } })), _jsxs("div", { ref: elementsDropdownRef, style: { position: 'relative' }, children: [_jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            setElementsOpen(!elementsOpen);
                        }, title: "Insert Element", children: _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '2px' }, children: [_jsx(AddBoxIcon, {}), _jsx(ExpandMoreIcon, { size: 16 })] }) }), elementsOpen && (_jsxs("div", { style: {
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '160px',
                        }, children: [_jsx(DropdownItem, { onClick: () => {
                                    insertHorizontalRule(editor);
                                    setElementsOpen(false);
                                }, children: _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(HorizontalRuleIcon, {}), "Divider"] }) }), uploadAsset && (_jsx(DropdownItem, { onClick: () => {
                                    var _a;
                                    (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
                                    setElementsOpen(false);
                                }, style: { opacity: isUploading ? 0.5 : 1 }, children: _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(ImageIcon, {}), "Image"] }) }))] }))] }), _jsxs("div", { ref: interactionsDropdownRef, style: { position: 'relative' }, children: [_jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            setInteractionsOpen(!interactionsOpen);
                        }, title: "Insert Interaction", children: _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '2px' }, children: [_jsx(CheckBoxIcon, {}), _jsx(ExpandMoreIcon, { size: 16 })] }) }), interactionsOpen && (_jsxs("div", { style: {
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '160px',
                        }, children: [_jsx(DropdownItem, { onClick: () => {
                                    insertTextEntryInteraction(editor);
                                    setInteractionsOpen(false);
                                }, children: "Text Entry" }), _jsx(DropdownItem, { onClick: () => {
                                    insertInlineChoiceInteraction(editor);
                                    setInteractionsOpen(false);
                                }, children: "Inline Choice" }), _jsx(DropdownItem, { onClick: () => {
                                    insertExtendedTextInteraction(editor);
                                    setInteractionsOpen(false);
                                }, children: "Extended Text" }), _jsx(DropdownItem, { onClick: () => {
                                    insertChoiceInteraction(editor);
                                    setInteractionsOpen(false);
                                }, children: "Choice" }), _jsx(DropdownItem, { onClick: () => {
                                    insertGapMatchInteraction(editor);
                                    setInteractionsOpen(false);
                                }, children: "Gap Match" }), _jsx(DropdownItem, { onClick: () => {
                                    insertMatchInteraction(editor);
                                    setInteractionsOpen(false);
                                }, children: "Match" })] }))] }), _jsxs("div", { ref: feedbackDropdownRef, style: { position: 'relative' }, children: [_jsx(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            setFeedbackOpen(!feedbackOpen);
                        }, title: "Insert Feedback", children: _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '2px' }, children: [_jsx(FeedbackIcon, {}), _jsx(ExpandMoreIcon, { size: 16 })] }) }), feedbackOpen && (_jsxs("div", { style: {
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '160px',
                        }, children: [_jsx(DropdownItem, { onClick: () => {
                                    insertFeedbackInline(editor, '');
                                    setFeedbackOpen(false);
                                }, children: "Inline Feedback" }), _jsx(DropdownItem, { onClick: () => {
                                    insertFeedbackBlock(editor, '');
                                    setFeedbackOpen(false);
                                }, children: "Block Feedback" }), _jsx(DropdownItem, { onClick: () => {
                                    insertModalFeedback(editor, '');
                                    setFeedbackOpen(false);
                                }, children: "Modal Feedback" })] }))] })] }));
}
/**
 * Button group component for grouping related toolbar buttons
 */
function ButtonGroup({ children }) {
    return (_jsx("div", { style: { display: 'flex' }, children: children }));
}
function getButtonRadius(position) {
    switch (position) {
        case 'first':
            return '4px 0 0 4px';
        case 'middle':
            return '0';
        case 'last':
            return '0 4px 4px 0';
        case 'single':
        default:
            return '4px';
    }
}
function getButtonBorder(position) {
    switch (position) {
        case 'middle':
        case 'last':
            return '1px solid #ccc';
        default:
            return '1px solid #ccc';
    }
}
function getButtonMarginLeft(position) {
    switch (position) {
        case 'middle':
        case 'last':
            return '-1px';
        default:
            return '0';
    }
}
/**
 * Toolbar button component with active state support
 */
function ToolbarButton({ children, onMouseDown, title, active = false, disabled = false, position = 'single', style = {}, }) {
    return (_jsx("button", { onMouseDown: disabled ? undefined : onMouseDown, title: title, disabled: disabled, style: {
            padding: '6px 10px',
            border: getButtonBorder(position),
            borderRadius: getButtonRadius(position),
            marginLeft: getButtonMarginLeft(position),
            backgroundColor: active ? '#e0e0e0' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontFamily: 'inherit',
            fontWeight: active ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: active ? 1 : 0,
            opacity: disabled ? 0.5 : 1,
            ...style,
        }, children: children }));
}
/**
 * Dropdown menu item component
 */
function DropdownItem({ children, onClick, active = false, style = {}, }) {
    const baseBackgroundColor = active ? '#e8f4fc' : '#fff';
    return (_jsx("button", { onMouseDown: (event) => {
            event.preventDefault();
            onClick();
        }, style: {
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            backgroundColor: baseBackgroundColor,
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'inherit',
            textAlign: 'left',
            fontWeight: active ? 'bold' : 'normal',
            ...style,
        }, onMouseEnter: (e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
        }, onMouseLeave: (e) => {
            e.currentTarget.style.backgroundColor = style.backgroundColor || baseBackgroundColor;
        }, children: children }));
}
/**
 * Toggle a text mark (bold, italic, underline, code, strikethrough)
 */
function toggleMark(editor, format) {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
        Editor.removeMark(editor, format);
    }
    else {
        Editor.addMark(editor, format, true);
    }
}
/**
 * Check if a mark is active
 */
function isMarkActive(editor, format) {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
}
/**
 * Toggle a block type
 */
function toggleBlock(editor, format, props = {}) {
    const isActive = format === 'heading'
        ? isHeadingActive(editor, props.level)
        : isBlockActive(editor, format);
    // Remove any existing block type
    Transforms.setNodes(editor, { type: isActive ? 'paragraph' : format, ...props }, { match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n) });
}
/**
 * Check if a block type is active
 */
function isBlockActive(editor, format) {
    const [match] = Editor.nodes(editor, {
        match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === format,
    });
    return !!match;
}
/**
 * Check if a specific heading level is active
 */
function isHeadingActive(editor, level) {
    const [match] = Editor.nodes(editor, {
        match: (n) => SlateElement.isElement(n) &&
            'type' in n &&
            n.type === 'heading' &&
            'level' in n &&
            n.level === level,
    });
    return !!match;
}
/**
 * Toggle a list (ordered or unordered)
 */
function toggleList(editor, ordered) {
    const isThisListTypeActive = isListActive(editor, ordered);
    // Check if we're in any list at all
    const listEntry = Editor.above(editor, {
        match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'list',
    });
    if (listEntry) {
        // We're in a list
        if (isThisListTypeActive) {
            // Toggle off: unwrap the list structure entirely
            Transforms.unwrapNodes(editor, {
                match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'list',
                split: true,
            });
            // Convert list-items back to paragraphs
            Transforms.setNodes(editor, { type: 'paragraph' }, {
                match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'list-item',
            });
        }
        else {
            // Switch list type: just change the ordered property
            Transforms.setNodes(editor, { ordered }, {
                match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'list',
            });
        }
    }
    else {
        // Not in a list - create a new one
        // Convert the current block to a list-item
        Transforms.setNodes(editor, { type: 'list-item' }, {
            match: (n) => SlateElement.isElement(n) &&
                Editor.isBlock(editor, n) &&
                'type' in n &&
                n.type !== 'list' &&
                n.type !== 'list-item',
        });
        // Wrap the list-item in a list
        Transforms.wrapNodes(editor, { type: 'list', ordered, children: [] }, {
            match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'list-item',
        });
    }
}
/**
 * Check if a list type is active
 */
function isListActive(editor, ordered) {
    const [match] = Editor.nodes(editor, {
        match: (n) => SlateElement.isElement(n) &&
            'type' in n &&
            n.type === 'list' &&
            'ordered' in n &&
            n.ordered === ordered,
    });
    return !!match;
}
/**
 * Element types that support text alignment
 */
const ALIGNABLE_TYPES = ['paragraph', 'heading', 'blockquote'];
/**
 * Check if an element type supports alignment
 */
function isAlignable(element) {
    return 'type' in element && ALIGNABLE_TYPES.includes(element.type);
}
/**
 * Find the closest alignable ancestor element at the current selection
 * Returns the element and path, or null if none found
 */
function findAlignableAncestor(editor) {
    if (!editor.selection)
        return null;
    // Use Editor.above to walk up from the selection point
    const entry = Editor.above(editor, {
        match: (n) => SlateElement.isElement(n) && isAlignable(n),
    });
    if (entry) {
        const [element, path] = entry;
        return { element: element, path };
    }
    return null;
}
/**
 * Get the current alignment of the closest alignable ancestor
 * Returns 'left' if no alignment set (default), or null if no alignable ancestor
 */
function getCurrentAlignment(editor) {
    const alignable = findAlignableAncestor(editor);
    if (!alignable)
        return null;
    const { element } = alignable;
    if ('align' in element && element.align) {
        return element.align;
    }
    return 'left'; // Default alignment
}
/**
 * Toggle text alignment on the closest alignable ancestor
 */
function toggleAlignment(editor, align) {
    const alignable = findAlignableAncestor(editor);
    if (!alignable)
        return; // No alignable ancestor, do nothing
    const { path } = alignable;
    const currentAlign = getCurrentAlignment(editor);
    // If clicking the active alignment or clicking left, remove alignment (reset to default)
    const newAlign = (currentAlign === align || align === 'left') ? undefined : align;
    Transforms.setNodes(editor, { align: newAlign }, { at: path });
}
/**
 * Check if a specific alignment is active
 */
function isAlignmentActive(editor, align) {
    const currentAlign = getCurrentAlignment(editor);
    return currentAlign === align;
}
/**
 * Check if alignment buttons should be enabled
 * Returns true if there's an alignable ancestor at the selection
 */
function isAlignmentAvailable(editor) {
    return findAlignableAncestor(editor) !== null;
}
/**
 * Insert a horizontal rule
 */
function insertHorizontalRule(editor) {
    Transforms.insertNodes(editor, {
        type: 'horizontal-rule',
        children: [{ text: '' }],
    });
    // Insert paragraph after for cursor positioning
    Transforms.insertNodes(editor, {
        type: 'paragraph',
        children: [{ text: '' }],
    });
}
/**
 * Get the current block type label for the dropdown
 */
function getCurrentBlockType(editor) {
    if (isHeadingActive(editor, 1))
        return 'Heading 1';
    if (isHeadingActive(editor, 2))
        return 'Heading 2';
    if (isHeadingActive(editor, 3))
        return 'Heading 3';
    if (isBlockActive(editor, 'blockquote'))
        return 'Blockquote';
    return 'Normal Text';
}
