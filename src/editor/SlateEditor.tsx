import { useCallback, useMemo } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import type { SlateEditorProps, SlateElement } from '../types';
import { withQtiInteractions, withXhtml, withUnknownElements } from '../plugins';
import { Toolbar } from './Toolbar';

/**
 * Main Slate editor component for QTI editing
 */
export function SlateEditor({
  value,
  onChange,
  documentKey,
  className = '',
  readOnly = false,
  placeholder = 'Enter content...',
}: SlateEditorProps): React.JSX.Element {
  // Create editor instance with plugins (stable across renders)
  const editor = useMemo(() => {
    const baseEditor = withReact(withHistory(createEditor()));
    return withUnknownElements(withQtiInteractions(withXhtml(baseEditor)));
  }, []);

  // Render element callback
  const renderElement = useCallback((props: RenderElementProps) => {
    return <Element {...props} />;
  }, []);

  // Render leaf callback
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />;
  }, []);

  // Use documentKey to force remount when loading new documents
  // If not provided, we'll rely on the parent managing the key via React's key prop
  const internalKey = documentKey ?? 'editor';

  return (
    <div className={`slate-editor ${className}`}>
      <Slate key={internalKey} editor={editor} initialValue={value} onChange={onChange}>
        <Toolbar />
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck
          autoFocus
          style={{
            padding: '16px',
            minHeight: '300px',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        />
      </Slate>
    </div>
  );
}

/**
 * Element renderer component
 */
function Element({ attributes, children, element }: RenderElementProps): React.JSX.Element {
  const el = element as SlateElement;

  switch (el.type) {
    case 'qti-text-entry-interaction':
      return (
        <span
          {...attributes}
          contentEditable={false}
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            margin: '0 4px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            fontSize: '0.9em',
            color: '#1976d2',
            userSelect: 'none',
          }}
        >
          {children}
          <span style={{ fontWeight: 'bold' }}>
            [Text Entry: {el.attributes['response-identifier']}]
          </span>
        </span>
      );

    case 'qti-extended-text-interaction':
      return (
        <div
          {...attributes}
          contentEditable={false}
          style={{
            padding: '8px',
            margin: '8px 0',
            backgroundColor: '#f3e5f5',
            border: '1px solid #9c27b0',
            borderRadius: '4px',
            color: '#7b1fa2',
            userSelect: 'none',
          }}
        >
          {children}
          <div style={{ fontWeight: 'bold' }}>
            [Extended Text: {el.attributes['response-identifier']}]
          </div>
        </div>
      );

    case 'qti-choice-interaction':
      return (
        <fieldset
          {...attributes}
          style={{
            margin: '16px 0',
            padding: '12px',
            border: '2px solid #4caf50',
            borderRadius: '8px',
          }}
        >
          <legend style={{ padding: '0 8px', fontWeight: 'bold', color: '#388e3c' }}>
            Choice Interaction: {el.attributes['response-identifier']}
          </legend>
          {children}
        </fieldset>
      );

    case 'qti-prompt':
      return (
        <div {...attributes} style={{ marginBottom: '8px', fontWeight: 500 }}>
          {children}
        </div>
      );

    case 'qti-simple-choice':
      return (
        <div
          {...attributes}
          style={{
            padding: '8px',
            margin: '4px 0',
            backgroundColor: '#f1f8e9',
            border: '1px solid #c5e1a5',
            borderRadius: '4px',
          }}
        >
          <span contentEditable={false} style={{ marginRight: '8px', color: '#689f38' }}>
            [{el.attributes.identifier}]
          </span>
          {children}
        </div>
      );

    case 'qti-unknown':
      return (
        <div
          {...attributes}
          style={{
            padding: '12px',
            margin: '8px 0',
            backgroundColor: '#fff3e0',
            border: '2px dashed #ff9800',
            borderRadius: '4px',
          }}
        >
          <div
            contentEditable={false}
            style={{
              marginBottom: '8px',
              padding: '4px 8px',
              backgroundColor: '#ffe0b2',
              borderRadius: '4px',
              fontSize: '0.9em',
              color: '#e65100',
            }}
          >
            ⚠️ Unsupported element: <code>{el.originalTagName}</code>
            <div style={{ fontSize: '0.85em', marginTop: '4px' }}>
              This QTI element is not yet supported by the editor. Content will be preserved when
              you save.
            </div>
          </div>
          {children}
        </div>
      );

    case 'paragraph':
      return <p {...attributes}>{children}</p>;

    case 'div':
      return <div {...attributes}>{children}</div>;

    case 'span':
      return <span {...attributes}>{children}</span>;

    case 'heading':
      switch (el.level) {
        case 1:
          return <h1 {...attributes}>{children}</h1>;
        case 2:
          return <h2 {...attributes}>{children}</h2>;
        case 3:
          return <h3 {...attributes}>{children}</h3>;
        case 4:
          return <h4 {...attributes}>{children}</h4>;
        case 5:
          return <h5 {...attributes}>{children}</h5>;
        case 6:
          return <h6 {...attributes}>{children}</h6>;
        default:
          return <h2 {...attributes}>{children}</h2>;
      }

    case 'image':
      return (
        <img
          {...attributes}
          src={el.attributes.src}
          alt={el.attributes.alt}
          style={{ maxWidth: '100%', display: 'block' }}
        />
      );

    case 'line-break':
      return <br {...attributes} />;

    case 'list':
      const ListTag = el.ordered ? 'ol' : 'ul';
      return <ListTag {...attributes}>{children}</ListTag>;

    case 'list-item':
      return <li {...attributes}>{children}</li>;

    case 'strong':
      return <strong {...attributes}>{children}</strong>;

    case 'em':
      return <em {...attributes}>{children}</em>;

    default:
      return <div {...attributes}>{children}</div>;
  }
}

/**
 * Leaf renderer component
 */
function Leaf({ attributes, children, leaf }: RenderLeafProps): React.JSX.Element {
  let content = children;

  if (leaf.bold) {
    content = <strong>{content}</strong>;
  }

  if (leaf.italic) {
    content = <em>{content}</em>;
  }

  if (leaf.underline) {
    content = <u>{content}</u>;
  }

  if (leaf.code) {
    content = <code>{content}</code>;
  }

  return <span {...attributes}>{content}</span>;
}
