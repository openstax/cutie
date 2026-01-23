import { useState, useEffect, useRef } from 'react';
import { beginAttempt } from '@openstax/cutie-core';
import type { AttemptState } from '@openstax/cutie-core';
import { mountItem } from '@openstax/cutie-client';
import { examples } from './example-items';
import './App.css';

export function App() {
  const [itemXml, setItemXml] = useState('');
  const [attemptState, setAttemptState] = useState<AttemptState | null>(null);
  const [sanitizedTemplate, setSanitizedTemplate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleExampleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = event.target.value;
    if (!selectedName) {
      setItemXml('');
      return;
    }

    const example = examples.find(ex => ex.name === selectedName);
    if (example) {
      setItemXml(example.item);
    }
  };

  const handleProcess = async () => {
    setError('');
    setProcessing(true);

    try {
      const result = await beginAttempt(itemXml);
      setAttemptState(result.state);
      setSanitizedTemplate(result.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  // Mount/unmount item when sanitizedTemplate changes
  useEffect(() => {
    if (previewRef.current && sanitizedTemplate) {
      const cleanup = mountItem(previewRef.current, sanitizedTemplate);
      return cleanup;
    }
  }, [sanitizedTemplate]);

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1>Cutie QTI Processor</h1>

        <div className="panel">
          <h2>Item Definition</h2>
          <select
            className="example-select"
            onChange={handleExampleSelect}
            defaultValue=""
          >
            <option value="">Load example item...</option>
            {examples.map((ex) => (
              <option key={ex.name} value={ex.name}>
                {ex.name}
              </option>
            ))}
          </select>
          <textarea
            className="xml-input"
            value={itemXml}
            onChange={(e) => setItemXml(e.target.value)}
            placeholder="Paste QTI v3 XML here..."
          />
          <button
            className="process-button"
            onClick={handleProcess}
            disabled={!itemXml.trim() || processing}
          >
            {processing ? 'Processing...' : 'Process Item'}
          </button>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Attempt State</h2>
          <pre className="output-display">
            {attemptState ? JSON.stringify(attemptState, null, 2) : 'No state yet'}
          </pre>
        </div>

        <div className="panel">
          <h2>Sanitized Template</h2>
          <pre className="output-display xml-output">
            {sanitizedTemplate || 'No template yet'}
          </pre>
        </div>
      </div>

      <div className="preview-area">
        <div ref={previewRef} />
      </div>
    </div>
  );
}

export default App;
