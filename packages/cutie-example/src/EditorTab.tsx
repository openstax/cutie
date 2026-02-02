import { useState } from 'react';
import { beginAttempt } from '@openstax/cutie-core';
import type { AttemptState } from '@openstax/cutie-core';
import { SlateEditor } from '@openstax/cutie-editor';
import type { EditorAssetHandlers } from '@openstax/cutie-editor';

interface EditorTabProps {
  itemXml: string;
  setItemXml: (xml: string) => void;
  setSanitizedTemplate: (template: string) => void;
  setAttemptState: (state: AttemptState | null) => void;
}

const assetHandlers: EditorAssetHandlers = {
  resolveAsset: async (url) => {
    // Return resolved URL for display
    // Handle relative URLs by prepending /
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:')) {
      return url;
    }
    return `/${url}`;
  },
  uploadAsset: async (file) => {
    // Read file as data URL (in a real app, would upload to server and return URL)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },
};

export function EditorTab({ itemXml, setItemXml, setSanitizedTemplate, setAttemptState }: EditorTabProps) {
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const handleEditorPreview = async () => {
    setError('');
    setProcessing(true);

    try {
      if (!itemXml.trim()) {
        throw new Error('No item XML loaded');
      }

      // Process with cutie-core
      const result = await beginAttempt(itemXml);
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
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '12px',
          overflow: 'hidden'
        }}>
          <SlateEditor
            qtiXml={itemXml}
            onQtiChange={setItemXml}
            onError={setError}
            placeholder="Load an example or paste QTI XML..."
            assetHandlers={assetHandlers}
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
