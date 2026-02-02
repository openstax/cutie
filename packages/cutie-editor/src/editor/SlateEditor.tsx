import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { createEditor, Descendant, Editor, Element as SlateElementType, Transforms } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import type { Path } from 'slate';
import type { SlateEditorProps, SlateElement, ElementAttributes, XmlNode, DocumentMetadata, ResponseProcessingMode } from '../types';
import { withQtiInteractions, withXhtml, withUnknownElements } from '../plugins';
import { Toolbar } from './Toolbar';
import { parseXmlToSlate } from '../serialization/xmlToSlate';
import { serializeSlateToQti } from '../serialization/slateToXml';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { choiceRenderers } from '../interactions/choice';
import { textEntryRenderers } from '../interactions/textEntry';
import { extendedTextRenderers } from '../interactions/extendedText';
import { promptRenderers } from '../elements/prompt';
import { simpleChoiceRenderers } from '../elements/simpleChoice';
import { imageRenderers } from '../elements/image';
import { useStyle } from '../hooks/useStyle';
import { hasMapping } from '../utils/responseProcessingClassifier';
import { AssetContext } from '../contexts/AssetContext';

/**
 * Main Slate editor component for QTI editing
 */
export function SlateEditor({
  qtiXml,
  onQtiChange,
  onError,
  className = '',
  readOnly = false,
  placeholder = 'Enter content...',
  assetHandlers,
}: SlateEditorProps): React.JSX.Element {
  // Create editor instance with plugins (stable across renders)
  const editor = useMemo(() => {
    const baseEditor = withReact(withHistory(createEditor()));
    return withUnknownElements(withQtiInteractions(withXhtml(baseEditor)));
  }, []);

  // Track the current QTI XML to detect external changes
  const qtiXmlRef = useRef(qtiXml);

  // Parse QTI XML to Slate format
  const initialValue = useMemo(() => {
    try {
      return parseXmlToSlate(qtiXml);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse QTI XML';
      onError?.(errorMessage);
      // Return a default paragraph if parsing fails
      return [{ type: 'paragraph', children: [{ text: '' }] }] as Descendant[];
    }
  }, [qtiXml, onError]);

  // Internal Slate value state
  const [value, setValue] = useState<Descendant[]>(initialValue);

  // Track selected interaction element for properties panel
  const [selectedElement, setSelectedElement] = useState<SlateElement | null>(null);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);

  // Normalize on initial mount to ensure trailing paragraph exists
  useEffect(() => {
    Editor.normalize(editor, { force: true });
  }, [editor]);

  // Handle Slate value changes
  const handleChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue);

    // Track selected element for properties panel
    const { selection } = editor;
    if (!selection) {
      setSelectedElement(null);
      setSelectedPath(null);
    } else {
      // Find element with properties panel at selection
      const [match] = Editor.nodes(editor, {
        at: selection,
        match: (n) =>
          SlateElementType.isElement(n) &&
          hasPropertiesPanel(n as SlateElement),
      });

      if (match) {
        const [node, path] = match;
        setSelectedElement(node as SlateElement);
        setSelectedPath(path);
      } else {
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
          onError?.(errorMessages);
        }

        // Update the ref and notify parent
        qtiXmlRef.current = result.xml;
        onQtiChange(result.xml, result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to serialize QTI XML';
        onError?.(errorMessage);
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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to parse QTI XML';
        onError?.(errorMessage);
      }
    }
  }, [qtiXml, onError, editor]);

  // Handle attribute updates from properties panel
  const handleUpdateAttributes = useCallback(
    (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => {
      // Always include responseDeclaration in updates so it can be removed (set to undefined)
      const updates: Record<string, unknown> = { attributes, responseDeclaration };
      Transforms.setNodes(editor, updates as any, { at: path });
    },
    [editor]
  );

  // Handle response processing mode change
  const handleResponseProcessingModeChange = useCallback(
    (mode: ResponseProcessingMode) => {
      // Find the metadata node at [0]
      const metadata = getDocumentMetadata(value);
      if (!metadata) return;

      // Don't allow switching away from custom mode
      if (metadata.responseProcessing.mode === 'custom') {
        return;
      }

      // Update the mode using Transforms.setNodes
      Transforms.setNodes(
        editor,
        {
          responseProcessing: { mode },
        } as Partial<DocumentMetadata>,
        { at: [0] }
      );
    },
    [editor, value]
  );

  // Extract response processing config and interaction info
  const metadata = getDocumentMetadata(value);
  const responseProcessingConfig = metadata?.responseProcessing;
  const { count: interactionCount, hasMappings } = analyzeInteractions(value);

  // Render element callback
  const renderElement = useCallback((props: RenderElementProps) => {
    return <Element {...props} />;
  }, []);

  // Render leaf callback
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />;
  }, []);

  // Add container styles
  useStyle('slate-editor-container', EDITOR_LAYOUT_STYLES);

  return (
    <AssetContext.Provider value={assetHandlers ?? {}}>
      <div className="slate-editor-container">
        <div className={`slate-editor ${className}`}>
          <Slate editor={editor} initialValue={value} onChange={handleChange}>
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
        <PropertiesPanel
          selectedElement={selectedElement}
          selectedPath={selectedPath}
          onUpdateAttributes={handleUpdateAttributes}
          responseProcessingConfig={responseProcessingConfig}
          interactionCount={interactionCount}
          hasMappings={hasMappings}
          onResponseProcessingModeChange={handleResponseProcessingModeChange}
        />
      </div>
    </AssetContext.Provider>
  );
}

/**
 * Helper function to check if an element is a QTI interaction
 */
function isInteractionElement(element: SlateElement): boolean {
  return (
    element.type === 'qti-text-entry-interaction' ||
    element.type === 'qti-extended-text-interaction' ||
    element.type === 'qti-choice-interaction'
  );
}

/**
 * Helper function to check if an element has a properties panel
 */
function hasPropertiesPanel(element: SlateElement): boolean {
  return isInteractionElement(element) || element.type === 'image';
}

/**
 * Extract document metadata from Slate value
 */
function getDocumentMetadata(nodes: Descendant[]): DocumentMetadata | null {
  if (nodes.length > 0 && 'type' in nodes[0] && nodes[0].type === 'document-metadata') {
    return nodes[0] as DocumentMetadata;
  }
  return null;
}

/**
 * Count interactions and check for mappings in the document
 */
function analyzeInteractions(nodes: Descendant[]): { count: number; hasMappings: boolean } {
  let count = 0;
  let hasMappings = false;

  function traverse(node: Descendant): void {
    if ('type' in node) {
      const element = node as SlateElement;
      if (isInteractionElement(element)) {
        count++;
        // Check for mapping in response declaration
        if ('responseDeclaration' in element && element.responseDeclaration) {
          if (hasMapping(element.responseDeclaration)) {
            hasMappings = true;
          }
        }
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

  return { count, hasMappings };
}

// Single contact point per interaction: spread all renderer objects
const interactionRenderers: Record<string, React.ComponentType<RenderElementProps>> = {
  ...choiceRenderers,
  ...textEntryRenderers,
  ...extendedTextRenderers,
  ...promptRenderers,
  ...simpleChoiceRenderers,
  ...imageRenderers,
};

/**
 * Element renderer component
 */
function Element({ attributes, children, element }: RenderElementProps): React.JSX.Element {
  const el = element as SlateElement;

  // Check interaction renderers first
  const Renderer = interactionRenderers[el.type];
  if (Renderer) {
    return <Renderer attributes={attributes} children={children} element={element} />;
  }

  // Fall through to generic elements
  switch (el.type) {
    // Document metadata is a void element that stores response processing config
    // It should not be visible in the editor
    case 'document-metadata':
      return (
        <span {...attributes} style={{ display: 'none' }}>
          {children}
        </span>
      );

    case 'qti-unknown':
      return (
        <span
          {...attributes}
          style={{
            display: 'inline-block',
            padding: '12px',
            margin: '8px 0',
            backgroundColor: '#fff3e0',
            border: '2px dashed #ff9800',
            borderRadius: '4px',
          }}
        >
          <span
            contentEditable={false}
            style={{
              display: 'block',
              marginBottom: '8px',
              padding: '4px 8px',
              backgroundColor: '#ffe0b2',
              borderRadius: '4px',
              fontSize: '0.9em',
              color: '#e65100',
              userSelect: 'none',
            }}
          >
            ⚠️ Unsupported element: <code>{el.originalTagName}</code>
            <span style={{ display: 'block', fontSize: '0.85em', marginTop: '4px' }}>
              This QTI element is not yet supported by the editor. Content will be preserved when
              you save.
            </span>
          </span>
          {children}
        </span>
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
`;
