import React from 'react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { useSlate } from 'slate-react';
import { insertChoiceInteraction } from '../interactions/choice';
import { insertTextEntryInteraction } from '../interactions/textEntry';
import { insertExtendedTextInteraction } from '../interactions/extendedText';

/**
 * Toolbar component for the Slate editor
 */
export function Toolbar(): React.JSX.Element {
  const editor = useSlate();
  const [interactionsOpen, setInteractionsOpen] = React.useState(false);
  const [blockTypeOpen, setBlockTypeOpen] = React.useState(false);
  const interactionsDropdownRef = React.useRef<HTMLDivElement>(null);
  const blockTypeDropdownRef = React.useRef<HTMLDivElement>(null);

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
        blockTypeOpen &&
        blockTypeDropdownRef.current &&
        !blockTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setBlockTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [interactionsOpen, blockTypeOpen]);

  // Get current block type for dropdown label
  const currentBlockType = getCurrentBlockType(editor);

  return (
    <div
      style={{
        padding: '8px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '8px',
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
          {currentBlockType} ▾
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

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* Mark formatting buttons */}
      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, 'bold');
        }}
        title="Bold"
        active={isMarkActive(editor, 'bold')}
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, 'italic');
        }}
        title="Italic"
        active={isMarkActive(editor, 'italic')}
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, 'underline');
        }}
        title="Underline"
        active={isMarkActive(editor, 'underline')}
      >
        <u>U</u>
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, 'strikethrough');
        }}
        title="Strikethrough"
        active={isMarkActive(editor, 'strikethrough')}
      >
        <s>S</s>
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, 'code');
        }}
        title="Code"
        active={isMarkActive(editor, 'code')}
      >
        <code style={{ fontFamily: 'monospace', fontSize: '12px' }}>&lt;/&gt;</code>
      </ToolbarButton>

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* List buttons */}
      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleList(editor, false);
        }}
        title="Bulleted List"
        active={isListActive(editor, false)}
      >
        •≡
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleList(editor, true);
        }}
        title="Numbered List"
        active={isListActive(editor, true)}
      >
        1.
      </ToolbarButton>

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* Horizontal rule button */}
      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          insertHorizontalRule(editor);
        }}
        title="Horizontal Rule"
      >
        ―
      </ToolbarButton>

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* QTI Interactions dropdown */}
      <div ref={interactionsDropdownRef} style={{ position: 'relative' }}>
        <ToolbarButton
          onMouseDown={(event) => {
            event.preventDefault();
            setInteractionsOpen(!interactionsOpen);
          }}
          title="Insert Interaction"
        >
          Interactions ▾
        </ToolbarButton>

        {interactionsOpen && (
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
 * Toolbar button component with active state support
 */
function ToolbarButton({
  children,
  onMouseDown,
  title,
  active = false,
  style = {},
}: {
  children: React.ReactNode;
  onMouseDown: (event: React.MouseEvent) => void;
  title: string;
  active?: boolean;
  style?: React.CSSProperties;
}): React.JSX.Element {
  return (
    <button
      onMouseDown={onMouseDown}
      title={title}
      style={{
        padding: '6px 12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: active ? '#e0e0e0' : '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: 'inherit',
        fontWeight: active ? 'bold' : 'normal',
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
