import { useState, useCallback, useRef } from 'react';
import { beginAttempt } from '@openstax/cutie-core';
import type { AttemptState } from '@openstax/cutie-core';
import {
  SlateEditor,
  parseXmlToSlate,
  serializeSlateToXml,
} from '@openstax/cutie-editor';
import type { Descendant } from '@openstax/cutie-editor';

interface EditorTabProps {
  itemXml: string;
  setItemXml: (xml: string) => void;
  setSanitizedTemplate: (template: string) => void;
  setAttemptState: (state: AttemptState | null) => void;
}

/**
 * Extract item body content from full QTI XML and parse to Slate format
 */
function parseItemXml(itemXml: string): Descendant[] {
  if (!itemXml.trim()) {
    return [{ type: 'paragraph', children: [{ text: 'Load an example or paste QTI XML...' }] } as any];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(itemXml, 'application/xml');
    const itemBody = doc.querySelector('qti-item-body');

    if (!itemBody) {
      throw new Error('No qti-item-body found in XML');
    }

    // Serialize just the item body content
    const serializer = new XMLSerializer();
    let itemBodyXml = '';
    for (const child of Array.from(itemBody.childNodes)) {
      itemBodyXml += serializer.serializeToString(child);
    }

    // Parse to Slate format
    return parseXmlToSlate(itemBodyXml);
  } catch (err) {
    console.error('Failed to parse item XML:', err);
    throw err;
  }
}

export function EditorTab({ itemXml, setItemXml, setSanitizedTemplate, setAttemptState }: EditorTabProps) {
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Track which XML is currently loaded
  const loadedXmlRef = useRef(itemXml);
  const [editorValue, setEditorValue] = useState<Descendant[]>(() => {
    try {
      return parseItemXml(itemXml);
    } catch (err) {
      return [{ type: 'paragraph', children: [{ text: 'Error loading XML' }] } as any];
    }
  });

  // When itemXml changes, synchronously update editorValue
  if (itemXml !== loadedXmlRef.current) {
    loadedXmlRef.current = itemXml;
    try {
      setEditorValue(parseItemXml(itemXml));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse XML');
    }
  }

  const handleEditorPreview = async () => {
    setError('');
    setProcessing(true);

    try {
      if (!itemXml.trim()) {
        throw new Error('No item XML loaded');
      }

      // Serialize editor content to QTI XML (just the item body)
      const { xml, errors } = serializeSlateToXml(editorValue);

      if (errors && errors.length > 0) {
        setError(errors.map(e => e.message).join(', '));
        return;
      }

      // Parse the current item XML structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(itemXml, 'application/xml');
      const assessmentItem = doc.querySelector('qti-assessment-item');

      if (!assessmentItem) {
        throw new Error('Invalid item XML structure - no qti-assessment-item found');
      }

      // Parse the serialized editor content
      const editorDoc = parser.parseFromString(xml, 'application/xml');
      const newItemBody = editorDoc.querySelector('qti-item-body');

      if (!newItemBody) {
        throw new Error('Failed to serialize item body');
      }

      // Replace the old item body with the new one
      const oldItemBody = assessmentItem.querySelector('qti-item-body');
      if (oldItemBody) {
        assessmentItem.replaceChild(
          doc.importNode(newItemBody, true),
          oldItemBody
        );
      }

      // Serialize back to XML
      const serializer = new XMLSerializer();
      const fullItemXml = serializer.serializeToString(doc);

      // Update the item XML state
      setItemXml(fullItemXml);

      // Process with cutie-core
      const result = await beginAttempt(fullItemXml);
      setAttemptState(result.state);
      setSanitizedTemplate(result.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditorChange = useCallback((value: Descendant[]) => {
    setEditorValue(value);
  }, []);

  return (
    <div className="tab-content-full">
      <div className="panel editor-panel">
        <h2>Editor</h2>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '12px',
          overflow: 'hidden'
        }}>
          <SlateEditor
            value={editorValue}
            onChange={handleEditorChange}
            documentKey={itemXml}
            placeholder="Load an example or paste QTI XML..."
          />
        </div>
        <button
          className="process-button"
          onClick={handleEditorPreview}
          disabled={processing || !itemXml.trim()}
        >
          {processing ? 'Processing...' : 'Preview'}
        </button>
        {error && (
          <div className="error-message" style={{ marginTop: '12px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
