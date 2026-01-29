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
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (interactionsOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setInteractionsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [interactionsOpen]);

  return (
    <div
      style={{
        padding: '8px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* Formatting buttons */}
      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, 'bold');
        }}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, 'italic');
        }}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, 'underline');
        }}
        title="Underline"
      >
        <u>U</u>
      </ToolbarButton>

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 4px' }} />

      {/* Block type buttons */}
      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock(editor, 'paragraph');
        }}
        title="Paragraph"
      >
        P
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock(editor, 'heading', { level: 1 });
        }}
        title="Heading 1"
      >
        H1
      </ToolbarButton>

      <ToolbarButton
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock(editor, 'heading', { level: 2 });
        }}
        title="Heading 2"
      >
        H2
      </ToolbarButton>

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 4px' }} />

      {/* QTI Interactions dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
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
 * Toolbar button component
 */
function ToolbarButton({
  children,
  onMouseDown,
  title,
  style = {},
}: {
  children: React.ReactNode;
  onMouseDown: (event: React.MouseEvent) => void;
  title: string;
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
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: 'inherit',
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
  style = {},
}: {
  children: React.ReactNode;
  onClick: () => void;
  style?: React.CSSProperties;
}): React.JSX.Element {
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
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: 'inherit',
        textAlign: 'left',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f5f5f5';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = style.backgroundColor || '#fff';
      }}
    >
      {children}
    </button>
  );
}

/**
 * Toggle a text mark (bold, italic, underline, code)
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
function toggleBlock(editor: Editor, format: string, props: any = {}): void {
  const isActive = isBlockActive(editor, format);

  // Remove any existing block type
  Transforms.setNodes(
    editor,
    { type: isActive ? 'paragraph' : format, ...props } as any,
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
