"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = Toolbar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const slate_1 = require("slate");
const slate_react_1 = require("slate-react");
const choice_1 = require("../interactions/choice");
const textEntry_1 = require("../interactions/textEntry");
const inlineChoice_1 = require("../interactions/inlineChoice");
const extendedText_1 = require("../interactions/extendedText");
const gapMatch_1 = require("../interactions/gapMatch");
const match_1 = require("../interactions/match");
const image_1 = require("../elements/image");
const feedbackInline_1 = require("../elements/feedback/feedbackInline");
const feedbackBlock_1 = require("../elements/feedback/feedbackBlock");
const modalFeedback_1 = require("../elements/feedback/modalFeedback");
const AssetContext_1 = require("../contexts/AssetContext");
const icons_1 = require("../components/icons");
/**
 * Toolbar component for the Slate editor
 */
function Toolbar() {
    const editor = (0, slate_react_1.useSlate)();
    const { uploadAsset } = (0, AssetContext_1.useAssetHandlers)();
    const [interactionsOpen, setInteractionsOpen] = react_1.default.useState(false);
    const [elementsOpen, setElementsOpen] = react_1.default.useState(false);
    const [feedbackOpen, setFeedbackOpen] = react_1.default.useState(false);
    const [blockTypeOpen, setBlockTypeOpen] = react_1.default.useState(false);
    const [isUploading, setIsUploading] = react_1.default.useState(false);
    const interactionsDropdownRef = react_1.default.useRef(null);
    const elementsDropdownRef = react_1.default.useRef(null);
    const feedbackDropdownRef = react_1.default.useRef(null);
    const blockTypeDropdownRef = react_1.default.useRef(null);
    const fileInputRef = react_1.default.useRef(null);
    // Close dropdowns when clicking outside
    react_1.default.useEffect(() => {
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
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            padding: '8px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            backgroundColor: '#f5f5f5',
            alignItems: 'center',
        }, children: [(0, jsx_runtime_1.jsxs)("div", { ref: blockTypeDropdownRef, style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            setBlockTypeOpen(!blockTypeOpen);
                        }, title: "Block Type", style: { minWidth: '120px', textAlign: 'left' }, children: (0, jsx_runtime_1.jsxs)("span", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [currentBlockType, (0, jsx_runtime_1.jsx)(icons_1.ExpandMoreIcon, { size: 16 })] }) }), blockTypeOpen && ((0, jsx_runtime_1.jsxs)("div", { style: {
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
                        }, children: [(0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'paragraph');
                                    setBlockTypeOpen(false);
                                }, active: isBlockActive(editor, 'paragraph'), children: "Normal Text" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'heading', { level: 1 });
                                    setBlockTypeOpen(false);
                                }, active: isHeadingActive(editor, 1), children: "Heading 1" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'heading', { level: 2 });
                                    setBlockTypeOpen(false);
                                }, active: isHeadingActive(editor, 2), children: "Heading 2" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'heading', { level: 3 });
                                    setBlockTypeOpen(false);
                                }, active: isHeadingActive(editor, 3), children: "Heading 3" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    toggleBlock(editor, 'blockquote');
                                    setBlockTypeOpen(false);
                                }, active: isBlockActive(editor, 'blockquote'), children: "Blockquote" })] }))] }), (0, jsx_runtime_1.jsxs)(ButtonGroup, { children: [(0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'bold');
                        }, title: "Bold", active: isMarkActive(editor, 'bold'), position: "first", children: (0, jsx_runtime_1.jsx)(icons_1.BoldIcon, {}) }), (0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'italic');
                        }, title: "Italic", active: isMarkActive(editor, 'italic'), position: "middle", children: (0, jsx_runtime_1.jsx)(icons_1.ItalicIcon, {}) }), (0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'underline');
                        }, title: "Underline", active: isMarkActive(editor, 'underline'), position: "middle", children: (0, jsx_runtime_1.jsx)(icons_1.UnderlineIcon, {}) }), (0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'strikethrough');
                        }, title: "Strikethrough", active: isMarkActive(editor, 'strikethrough'), position: "middle", children: (0, jsx_runtime_1.jsx)(icons_1.StrikethroughIcon, {}) }), (0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleMark(editor, 'code');
                        }, title: "Code", active: isMarkActive(editor, 'code'), position: "last", children: (0, jsx_runtime_1.jsx)(icons_1.CodeIcon, {}) })] }), (0, jsx_runtime_1.jsxs)(ButtonGroup, { children: [(0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleList(editor, false);
                        }, title: "Bulleted List", active: isListActive(editor, false), position: "first", children: (0, jsx_runtime_1.jsx)(icons_1.BulletedListIcon, {}) }), (0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleList(editor, true);
                        }, title: "Numbered List", active: isListActive(editor, true), position: "last", children: (0, jsx_runtime_1.jsx)(icons_1.NumberedListIcon, {}) })] }), (0, jsx_runtime_1.jsxs)(ButtonGroup, { children: [(0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleAlignment(editor, 'left');
                        }, title: "Align Left", active: isAlignmentActive(editor, 'left'), disabled: !isAlignmentAvailable(editor), position: "first", children: (0, jsx_runtime_1.jsx)(icons_1.AlignLeftIcon, {}) }), (0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleAlignment(editor, 'center');
                        }, title: "Align Center", active: isAlignmentActive(editor, 'center'), disabled: !isAlignmentAvailable(editor), position: "middle", children: (0, jsx_runtime_1.jsx)(icons_1.AlignCenterIcon, {}) }), (0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            toggleAlignment(editor, 'right');
                        }, title: "Align Right", active: isAlignmentActive(editor, 'right'), disabled: !isAlignmentAvailable(editor), position: "last", children: (0, jsx_runtime_1.jsx)(icons_1.AlignRightIcon, {}) })] }), (0, jsx_runtime_1.jsx)("div", { style: { flex: 1 } }), uploadAsset && ((0, jsx_runtime_1.jsx)("input", { type: "file", accept: "image/*", ref: fileInputRef, style: { display: 'none' }, onChange: async (event) => {
                    var _a;
                    const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
                    if (!file)
                        return;
                    setIsUploading(true);
                    try {
                        const src = await uploadAsset(file);
                        (0, image_1.insertImage)(editor, src);
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
                } })), (0, jsx_runtime_1.jsxs)("div", { ref: elementsDropdownRef, style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            setElementsOpen(!elementsOpen);
                        }, title: "Insert Element", children: (0, jsx_runtime_1.jsxs)("span", { style: { display: 'flex', alignItems: 'center', gap: '2px' }, children: [(0, jsx_runtime_1.jsx)(icons_1.AddBoxIcon, {}), (0, jsx_runtime_1.jsx)(icons_1.ExpandMoreIcon, { size: 16 })] }) }), elementsOpen && ((0, jsx_runtime_1.jsxs)("div", { style: {
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
                        }, children: [(0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    insertHorizontalRule(editor);
                                    setElementsOpen(false);
                                }, children: (0, jsx_runtime_1.jsxs)("span", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)(icons_1.HorizontalRuleIcon, {}), "Divider"] }) }), uploadAsset && ((0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    var _a;
                                    (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
                                    setElementsOpen(false);
                                }, style: { opacity: isUploading ? 0.5 : 1 }, children: (0, jsx_runtime_1.jsxs)("span", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)(icons_1.ImageIcon, {}), "Image"] }) }))] }))] }), (0, jsx_runtime_1.jsxs)("div", { ref: interactionsDropdownRef, style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            setInteractionsOpen(!interactionsOpen);
                        }, title: "Insert Interaction", children: (0, jsx_runtime_1.jsxs)("span", { style: { display: 'flex', alignItems: 'center', gap: '2px' }, children: [(0, jsx_runtime_1.jsx)(icons_1.CheckBoxIcon, {}), (0, jsx_runtime_1.jsx)(icons_1.ExpandMoreIcon, { size: 16 })] }) }), interactionsOpen && ((0, jsx_runtime_1.jsxs)("div", { style: {
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
                        }, children: [(0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, textEntry_1.insertTextEntryInteraction)(editor);
                                    setInteractionsOpen(false);
                                }, children: "Text Entry" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, inlineChoice_1.insertInlineChoiceInteraction)(editor);
                                    setInteractionsOpen(false);
                                }, children: "Inline Choice" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, extendedText_1.insertExtendedTextInteraction)(editor);
                                    setInteractionsOpen(false);
                                }, children: "Extended Text" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, choice_1.insertChoiceInteraction)(editor);
                                    setInteractionsOpen(false);
                                }, children: "Choice" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, gapMatch_1.insertGapMatchInteraction)(editor);
                                    setInteractionsOpen(false);
                                }, children: "Gap Match" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, match_1.insertMatchInteraction)(editor);
                                    setInteractionsOpen(false);
                                }, children: "Match" })] }))] }), (0, jsx_runtime_1.jsxs)("div", { ref: feedbackDropdownRef, style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsx)(ToolbarButton, { onMouseDown: (event) => {
                            event.preventDefault();
                            setFeedbackOpen(!feedbackOpen);
                        }, title: "Insert Feedback", children: (0, jsx_runtime_1.jsxs)("span", { style: { display: 'flex', alignItems: 'center', gap: '2px' }, children: [(0, jsx_runtime_1.jsx)(icons_1.FeedbackIcon, {}), (0, jsx_runtime_1.jsx)(icons_1.ExpandMoreIcon, { size: 16 })] }) }), feedbackOpen && ((0, jsx_runtime_1.jsxs)("div", { style: {
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
                        }, children: [(0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, feedbackInline_1.insertFeedbackInline)(editor, '');
                                    setFeedbackOpen(false);
                                }, children: "Inline Feedback" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, feedbackBlock_1.insertFeedbackBlock)(editor, '');
                                    setFeedbackOpen(false);
                                }, children: "Block Feedback" }), (0, jsx_runtime_1.jsx)(DropdownItem, { onClick: () => {
                                    (0, modalFeedback_1.insertModalFeedback)(editor, '');
                                    setFeedbackOpen(false);
                                }, children: "Modal Feedback" })] }))] })] }));
}
/**
 * Button group component for grouping related toolbar buttons
 */
function ButtonGroup({ children }) {
    return ((0, jsx_runtime_1.jsx)("div", { style: { display: 'flex' }, children: children }));
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
    return ((0, jsx_runtime_1.jsx)("button", { onMouseDown: disabled ? undefined : onMouseDown, title: title, disabled: disabled, style: {
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
    return ((0, jsx_runtime_1.jsx)("button", { onMouseDown: (event) => {
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
        slate_1.Editor.removeMark(editor, format);
    }
    else {
        slate_1.Editor.addMark(editor, format, true);
    }
}
/**
 * Check if a mark is active
 */
function isMarkActive(editor, format) {
    const marks = slate_1.Editor.marks(editor);
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
    slate_1.Transforms.setNodes(editor, { type: isActive ? 'paragraph' : format, ...props }, { match: (n) => slate_1.Element.isElement(n) && slate_1.Editor.isBlock(editor, n) });
}
/**
 * Check if a block type is active
 */
function isBlockActive(editor, format) {
    const [match] = slate_1.Editor.nodes(editor, {
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === format,
    });
    return !!match;
}
/**
 * Check if a specific heading level is active
 */
function isHeadingActive(editor, level) {
    const [match] = slate_1.Editor.nodes(editor, {
        match: (n) => slate_1.Element.isElement(n) &&
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
    const listEntry = slate_1.Editor.above(editor, {
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'list',
    });
    if (listEntry) {
        // We're in a list
        if (isThisListTypeActive) {
            // Toggle off: unwrap the list structure entirely
            slate_1.Transforms.unwrapNodes(editor, {
                match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'list',
                split: true,
            });
            // Convert list-items back to paragraphs
            slate_1.Transforms.setNodes(editor, { type: 'paragraph' }, {
                match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'list-item',
            });
        }
        else {
            // Switch list type: just change the ordered property
            slate_1.Transforms.setNodes(editor, { ordered }, {
                match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'list',
            });
        }
    }
    else {
        // Not in a list - create a new one
        // Convert the current block to a list-item
        slate_1.Transforms.setNodes(editor, { type: 'list-item' }, {
            match: (n) => slate_1.Element.isElement(n) &&
                slate_1.Editor.isBlock(editor, n) &&
                'type' in n &&
                n.type !== 'list' &&
                n.type !== 'list-item',
        });
        // Wrap the list-item in a list
        slate_1.Transforms.wrapNodes(editor, { type: 'list', ordered, children: [] }, {
            match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'list-item',
        });
    }
}
/**
 * Check if a list type is active
 */
function isListActive(editor, ordered) {
    const [match] = slate_1.Editor.nodes(editor, {
        match: (n) => slate_1.Element.isElement(n) &&
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
    const entry = slate_1.Editor.above(editor, {
        match: (n) => slate_1.Element.isElement(n) && isAlignable(n),
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
    slate_1.Transforms.setNodes(editor, { align: newAlign }, { at: path });
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
    slate_1.Transforms.insertNodes(editor, {
        type: 'horizontal-rule',
        children: [{ text: '' }],
    });
    // Insert paragraph after for cursor positioning
    slate_1.Transforms.insertNodes(editor, {
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
