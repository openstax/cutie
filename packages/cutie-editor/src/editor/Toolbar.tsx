import React from 'react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { useSlate } from 'slate-react';
import { insertChoiceInteraction } from '../interactions/choice';
import { insertTextEntryInteraction } from '../interactions/textEntry';
import { insertExtendedTextInteraction } from '../interactions/extendedText';
import { insertImage } from '../elements/image';
import { useAssetHandlers } from '../contexts/AssetContext';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  BulletedListIcon,
  NumberedListIcon,
  HorizontalRuleIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AddBoxIcon,
  ExpandMoreIcon,
  ImageIcon,
  CheckBoxIcon,
} from '../components/icons';
import type { TextAlign } from '../types';

/**
 * Toolbar component for the Slate editor
 */
export function Toolbar(): React.JSX.Element {
  const editor = useSlate();
  const { uploadAsset } = useAssetHandlers();
  const [interactionsOpen, setInteractionsOpen] = React.useState(false);
  const [elementsOpen, setElementsOpen] = React.useState(false);
  const [blockTypeOpen, setBlockTypeOpen] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const interactionsDropdownRef = React.useRef<HTMLDivElement>(null);
  const elementsDropdownRef = React.useRef<HTMLDivElement>(null);
  const blockTypeDropdownRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        interactionsOpen &&
        interactionsDropdownRef.current &&
        !interactionsDropdownRef.current.contains(event.target as Node)
      ) {
        setInteractionsOpen(false);
      }
      if (
        elementsOpen &&
        elementsDropdownRef.current &&
        !elementsDropdownRef.current.contains(event.target as Node)
      ) {
        setElementsOpen(false);
      }
      if (
        blockTypeOpen &&
        blockTypeDropdownRef.current &&
        !blockTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setBlockTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [interactionsOpen, elementsOpen, blockTypeOpen]);

  // Get current block type for dropdown label
  const currentBlockType = getCurrentBlockType(editor);

  return (
    <div
      style={{
        padding: '8px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
      }}
    >
      {/* Block type dropdown */}
      <div ref={blockTypeDropdownRef} style={{ position: 'relative' }}>
        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            setBlockTypeOpen(!blockTypeOpen);
          }}
          title="Block Type"
          style={{ minWidth: '120px', textAlign: 'left' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {currentBlockType}
            <ExpandMoreIcon size={16} />
          </span>
        </ToolbarButton>

        {blockTypeOpen && (
          <div
            style={{
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
            }}
          >
            <DropdownItem
              onClick={() => {
                toggleBlock(editor, 'paragraph');
                setBlockTypeOpen(false);
              }}
              active={isBlockActive(editor, 'paragraph')}
            >
              Normal Text
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                toggleBlock(editor, 'heading', { level: 1 });
                setBlockTypeOpen(false);
              }}
              active={isHeadingActive(editor, 1)}
            >
              Heading 1
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                toggleBlock(editor, 'heading', { level: 2 });
                setBlockTypeOpen(false);
              }}
              active={isHeadingActive(editor, 2)}
            >
              Heading 2
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                toggleBlock(editor, 'heading', { level: 3 });
                setBlockTypeOpen(false);
              }}
              active={isHeadingActive(editor, 3)}
            >
              Heading 3
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                toggleBlock(editor, 'blockquote');
                setBlockTypeOpen(false);
              }}
              active={isBlockActive(editor, 'blockquote')}
            >
              Blockquote
            </DropdownItem>
          </div>
        )}
      </div>


      {/* Mark formatting buttons */}
      <ButtonGroup>
        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleMark(editor, 'bold');
          }}
          title="Bold"
          active={isMarkActive(editor, 'bold')}
          position="first"
        >
          <BoldIcon />
        </ToolbarButton>

        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleMark(editor, 'italic');
          }}
          title="Italic"
          active={isMarkActive(editor, 'italic')}
          position="middle"
        >
          <ItalicIcon />
        </ToolbarButton>

        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleMark(editor, 'underline');
          }}
          title="Underline"
          active={isMarkActive(editor, 'underline')}
          position="middle"
        >
          <UnderlineIcon />
        </ToolbarButton>

        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleMark(editor, 'strikethrough');
          }}
          title="Strikethrough"
          active={isMarkActive(editor, 'strikethrough')}
          position="middle"
        >
          <StrikethroughIcon />
        </ToolbarButton>

        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleMark(editor, 'code');
          }}
          title="Code"
          active={isMarkActive(editor, 'code')}
          position="last"
        >
          <CodeIcon />
        </ToolbarButton>
      </ButtonGroup>

      {/* List buttons */}
      <ButtonGroup>
        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleList(editor, false);
          }}
          title="Bulleted List"
          active={isListActive(editor, false)}
          position="first"
        >
          <BulletedListIcon />
        </ToolbarButton>

        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleList(editor, true);
          }}
          title="Numbered List"
          active={isListActive(editor, true)}
          position="last"
        >
          <NumberedListIcon />
        </ToolbarButton>
      </ButtonGroup>

      {/* Alignment buttons */}
      <ButtonGroup>
        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleAlignment(editor, 'left');
          }}
          title="Align Left"
          active={isAlignmentActive(editor, 'left')}
          disabled={!isAlignmentAvailable(editor)}
          position="first"
        >
          <AlignLeftIcon />
        </ToolbarButton>

        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleAlignment(editor, 'center');
          }}
          title="Align Center"
          active={isAlignmentActive(editor, 'center')}
          disabled={!isAlignmentAvailable(editor)}
          position="middle"
        >
          <AlignCenterIcon />
        </ToolbarButton>

        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            toggleAlignment(editor, 'right');
          }}
          title="Align Right"
          active={isAlignmentActive(editor, 'right')}
          disabled={!isAlignmentAvailable(editor)}
          position="last"
        >
          <AlignRightIcon />
        </ToolbarButton>
      </ButtonGroup>

      {/* Spacer to push dropdowns to the right */}
      <div style={{ flex: 1 }} />

      {/* Hidden file input for image upload */}
      {uploadAsset && (
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            try {
              const src = await uploadAsset(file);
              insertImage(editor, src);
            } catch (error) {
              console.error('Failed to upload image:', error);
            } finally {
              setIsUploading(false);
              // Reset input so the same file can be selected again
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }
          }}
        />
      )}

      {/* Elements dropdown */}
      <div ref={elementsDropdownRef} style={{ position: 'relative' }}>
        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            setElementsOpen(!elementsOpen);
          }}
          title="Insert Element"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <AddBoxIcon />
            <ExpandMoreIcon size={16} />
          </span>
        </ToolbarButton>

        {elementsOpen && (
          <div
            style={{
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
            }}
          >
            <DropdownItem
              onClick={() => {
                insertHorizontalRule(editor);
                setElementsOpen(false);
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HorizontalRuleIcon />
                Divider
              </span>
            </DropdownItem>
            {uploadAsset && (
              <DropdownItem
                onClick={() => {
                  fileInputRef.current?.click();
                  setElementsOpen(false);
                }}
                style={{ opacity: isUploading ? 0.5 : 1 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon />
                  Image
                </span>
              </DropdownItem>
            )}
          </div>
        )}
      </div>

      {/* QTI Interactions dropdown */}
      <div ref={interactionsDropdownRef} style={{ position: 'relative' }}>
        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            setInteractionsOpen(!interactionsOpen);
          }}
          title="Insert Interaction"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <CheckBoxIcon />
            <ExpandMoreIcon size={16} />
          </span>
        </ToolbarButton>

        {interactionsOpen && (
          <div
            style={{
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
            }}
          >
            <DropdownItem
              onClick={() => {
                insertTextEntryInteraction(editor);
                setInteractionsOpen(false);
              }}
            >
              Text Entry
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                insertExtendedTextInteraction(editor);
                setInteractionsOpen(false);
              }}
            >
              Extended Text
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                insertChoiceInteraction(editor);
                setInteractionsOpen(false);
              }}
            >
              Choice
            </DropdownItem>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Button group component for grouping related toolbar buttons
 */
function ButtonGroup({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ display: 'flex' }}>
      {children}
    </div>
  );
}

type ButtonPosition = 'first' | 'middle' | 'last' | 'single';

function getButtonRadius(position: ButtonPosition): string {
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

function getButtonBorder(position: ButtonPosition): string {
  switch (position) {
    case 'middle':
    case 'last':
      return '1px solid #ccc';
    default:
      return '1px solid #ccc';
  }
}

function getButtonMarginLeft(position: ButtonPosition): string {
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
function ToolbarButton({
  children,
  onMouseDown,
  title,
  active = false,
  disabled = false,
  position = 'single',
  style = {},
}: {
  children: React.ReactNode;
  onMouseDown: (event: React.MouseEvent) => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
  position?: ButtonPosition;
  style?: React.CSSProperties;
}): React.JSX.Element {
  return (
    <button
      onMouseDown={disabled ? undefined : onMouseDown}
      title={title}
      disabled={disabled}
      style={{
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
      }}
    >
      {children}
    </button>
  );
}

/**
 * Dropdown menu item component
 */
function DropdownItem({
  children,
  onClick,
  active = false,
  style = {},
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  style?: React.CSSProperties;
}): React.JSX.Element {
  const baseBackgroundColor = active ? '#e8f4fc' : '#fff';
  return (
    <button
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      style={{
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
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f5f5f5';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = style.backgroundColor || baseBackgroundColor;
      }}
    >
      {children}
    </button>
  );
}

/**
 * Toggle a text mark (bold, italic, underline, code, strikethrough)
 */
function toggleMark(editor: Editor, format: string): void {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

/**
 * Check if a mark is active
 */
function isMarkActive(editor: Editor, format: string): boolean {
  const marks = Editor.marks(editor);
  return marks ? marks[format as keyof typeof marks] === true : false;
}

/**
 * Toggle a block type
 */
function toggleBlock(editor: Editor, format: string, props: Record<string, unknown> = {}): void {
  const isActive = format === 'heading'
    ? isHeadingActive(editor, props.level as number)
    : isBlockActive(editor, format);

  // Remove any existing block type
  Transforms.setNodes(
    editor,
    { type: isActive ? 'paragraph' : format, ...props } as Partial<SlateElement>,
    { match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
  );
}

/**
 * Check if a block type is active
 */
function isBlockActive(editor: Editor, format: string): boolean {
  const [match] = Editor.nodes(editor, {
    match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === format,
  });

  return !!match;
}

/**
 * Check if a specific heading level is active
 */
function isHeadingActive(editor: Editor, level: number): boolean {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      SlateElement.isElement(n) &&
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
function toggleList(editor: Editor, ordered: boolean): void {
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
      Transforms.setNodes(
        editor,
        { type: 'paragraph' } as Partial<SlateElement>,
        {
          match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'list-item',
        }
      );
    } else {
      // Switch list type: just change the ordered property
      Transforms.setNodes(
        editor,
        { ordered } as Partial<SlateElement>,
        {
          match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'list',
        }
      );
    }
  } else {
    // Not in a list - create a new one
    // Convert the current block to a list-item
    Transforms.setNodes(
      editor,
      { type: 'list-item' } as Partial<SlateElement>,
      {
        match: (n) =>
          SlateElement.isElement(n) &&
          Editor.isBlock(editor, n) &&
          'type' in n &&
          n.type !== 'list' &&
          n.type !== 'list-item',
      }
    );
    // Wrap the list-item in a list
    Transforms.wrapNodes(
      editor,
      { type: 'list', ordered, children: [] } as SlateElement,
      {
        match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'list-item',
      }
    );
  }
}

/**
 * Check if a list type is active
 */
function isListActive(editor: Editor, ordered: boolean): boolean {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      SlateElement.isElement(n) &&
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
function isAlignable(element: SlateElement): boolean {
  return 'type' in element && ALIGNABLE_TYPES.includes(element.type as string);
}

/**
 * Find the closest alignable ancestor element at the current selection
 * Returns the element and path, or null if none found
 */
function findAlignableAncestor(editor: Editor): { element: SlateElement; path: number[] } | null {
  if (!editor.selection) return null;

  // Use Editor.above to walk up from the selection point
  const entry = Editor.above(editor, {
    match: (n) => SlateElement.isElement(n) && isAlignable(n as SlateElement),
  });

  if (entry) {
    const [element, path] = entry;
    return { element: element as SlateElement, path };
  }

  return null;
}

/**
 * Get the current alignment of the closest alignable ancestor
 * Returns 'left' if no alignment set (default), or null if no alignable ancestor
 */
function getCurrentAlignment(editor: Editor): TextAlign | null {
  const alignable = findAlignableAncestor(editor);
  if (!alignable) return null;

  const { element } = alignable;
  if ('align' in element && element.align) {
    return element.align as TextAlign;
  }
  return 'left'; // Default alignment
}

/**
 * Toggle text alignment on the closest alignable ancestor
 */
function toggleAlignment(editor: Editor, align: TextAlign): void {
  const alignable = findAlignableAncestor(editor);
  if (!alignable) return; // No alignable ancestor, do nothing

  const { path } = alignable;
  const currentAlign = getCurrentAlignment(editor);

  // If clicking the active alignment or clicking left, remove alignment (reset to default)
  const newAlign = (currentAlign === align || align === 'left') ? undefined : align;

  Transforms.setNodes(
    editor,
    { align: newAlign } as Partial<SlateElement>,
    { at: path }
  );
}

/**
 * Check if a specific alignment is active
 */
function isAlignmentActive(editor: Editor, align: TextAlign): boolean {
  const currentAlign = getCurrentAlignment(editor);
  return currentAlign === align;
}

/**
 * Check if alignment buttons should be enabled
 * Returns true if there's an alignable ancestor at the selection
 */
function isAlignmentAvailable(editor: Editor): boolean {
  return findAlignableAncestor(editor) !== null;
}

/**
 * Insert a horizontal rule
 */
function insertHorizontalRule(editor: Editor): void {
  Transforms.insertNodes(editor, {
    type: 'horizontal-rule',
    children: [{ text: '' }],
  } as SlateElement);
  // Insert paragraph after for cursor positioning
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  } as SlateElement);
}

/**
 * Get the current block type label for the dropdown
 */
function getCurrentBlockType(editor: Editor): string {
  if (isHeadingActive(editor, 1)) return 'Heading 1';
  if (isHeadingActive(editor, 2)) return 'Heading 2';
  if (isHeadingActive(editor, 3)) return 'Heading 3';
  if (isBlockActive(editor, 'blockquote')) return 'Blockquote';
  return 'Normal Text';
}
