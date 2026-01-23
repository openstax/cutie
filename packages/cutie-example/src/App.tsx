import { useState, useEffect, useRef } from 'react';
import { beginAttempt } from '@openstax/cutie-core';
import type { AttemptState } from '@openstax/cutie-core';
import { mountItem } from '@openstax/cutie-client';
import type { MountedItem, ResponseData } from '@openstax/cutie-client';
import { examples } from './example-items';
import './App.css';

export function App() {
  const [itemXml, setItemXml] = useState('');
  const [attemptState, setAttemptState] = useState<AttemptState | null>(null);
  const [sanitizedTemplate, setSanitizedTemplate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [responses, setResponses] = useState<ResponseData | null>(null);
  const [interactionsEnabled, setInteractionsEnabled] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const mountedItemRef = useRef<MountedItem | null>(null);

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
      const mountedItem = mountItem(previewRef.current, sanitizedTemplate);
      mountedItemRef.current = mountedItem;

      return () => {
        mountedItem.unmount();
        mountedItemRef.current = null;
      };
    }
  }, [sanitizedTemplate]);

  useEffect(() => {
    if (mountedItemRef.current) {
      mountedItemRef.current.setInteractionsEnabled(interactionsEnabled);
    }
  }, [interactionsEnabled]);

  const handleSubmit = () => {
    if (mountedItemRef.current) {
      // Disable interactions during submission
      setInteractionsEnabled(false);

      // Collect responses
      const collectedResponses = mountedItemRef.current.collectResponses();
      setResponses(collectedResponses);

      // Log for debugging
      console.log('Collected responses:', collectedResponses);
      console.log('Response identifiers:', mountedItemRef.current.getResponseIdentifiers());

      // Re-enable interactions after a brief delay (simulating submission)
      setTimeout(() => {
        setInteractionsEnabled(true);
      }, 1000);
    }
  };

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

        <div className="panel">
          <h2>Response Collection</h2>
          <pre className="output-display">
            {responses ? JSON.stringify(responses, null, 2) : 'No responses collected yet'}
          </pre>
        </div>
      </div>

      <div className="preview-area">
        <div className="preview-card">
          <div className="preview-item" ref={previewRef} />
          <button
            className="process-button"
            onClick={handleSubmit}
            disabled={!sanitizedTemplate || !interactionsEnabled}
          >
            {interactionsEnabled ? 'Submit' : 'Submitting...'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
