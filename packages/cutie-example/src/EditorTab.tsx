import { useEffect, useRef, useState } from 'react';
import { beginAttempt } from '@openstax/cutie-core';
import type { AttemptState } from '@openstax/cutie-core';
import { mountEditor } from '@openstax/cutie-editor';
import type { EditorInstance } from '@openstax/cutie-editor';
import { examples } from './example-items';

interface EditorTabProps {
  selectedExample: string;
  setSanitizedTemplate: (template: string) => void;
  setAttemptState: (state: AttemptState | null) => void;
}

export function EditorTab({ selectedExample, setSanitizedTemplate, setAttemptState }: EditorTabProps) {
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<EditorInstance | null>(null);

  // Initialize editor
  useEffect(() => {
    if (editorRef.current && !editorInstanceRef.current) {
      editorInstanceRef.current = mountEditor(editorRef.current, {
        onChange: (result) => {
          console.log('Editor content changed:', result);
        },
      });
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Load example into editor when selectedExample changes
  useEffect(() => {
    if (selectedExample && editorInstanceRef.current) {
      const example = examples.find(ex => ex.name === selectedExample);
      if (example) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(example.item, 'application/xml');
          const itemBody = doc.querySelector('qti-item-body');

          if (itemBody) {
            const serializer = new XMLSerializer();
            const itemBodyXml = serializer.serializeToString(itemBody);
            editorInstanceRef.current.loadXml(itemBodyXml);
          }
        } catch (err) {
          console.error('Failed to load example into editor:', err);
        }
      }
    }
  }, [selectedExample]);

  const handleEditorPreview = async () => {
    setError('');
    setProcessing(true);

    try {
      if (!editorInstanceRef.current) {
        throw new Error('Editor not initialized');
      }

      // Serialize editor content
      const { xml, errors } = editorInstanceRef.current.serialize();

      if (errors && errors.length > 0) {
        setError(errors.map(e => e.message).join(', '));
        return;
      }

      // Get the selected example to use its full structure
      const example = examples.find(ex => ex.name === selectedExample);
      if (!example) {
        throw new Error('Please select an example item first');
      }

      // Parse the example to get the full structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(example.item, 'application/xml');
      const assessmentItem = doc.querySelector('qti-assessment-item');

      if (!assessmentItem) {
        throw new Error('Invalid example item structure');
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

  return (
    <div className="tab-content-full">
      <div className="panel editor-panel">
        <h2>Editor</h2>
        <div ref={editorRef} style={{ marginBottom: '12px' }} />
        <button
          className="process-button"
          onClick={handleEditorPreview}
          disabled={processing || !selectedExample}
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
