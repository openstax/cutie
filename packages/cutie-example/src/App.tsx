import { useState } from 'react';
import { beginAttempt } from '@openstax/cutie-core';
import type { AttemptState } from '@openstax/cutie-core';
import type { ResponseData } from '@openstax/cutie-client';
import { examples } from './example-items';
import { EditorTab } from './EditorTab';
import { PreviewTab } from './PreviewTab';
import './App.css';

type Tab = 'xml' | 'editor' | 'preview';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('xml');
  const [itemXml, setItemXml] = useState('');
  const [attemptState, setAttemptState] = useState<AttemptState | null>(null);
  const [sanitizedTemplate, setSanitizedTemplate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [responses, setResponses] = useState<ResponseData | null>(null);
  const [selectedExample, setSelectedExample] = useState('');

  const handleExampleSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = event.target.value;

    if (!selectedName) {
      return;
    }

    // Confirm if there's existing content
    if (itemXml.trim() && !confirm('Loading an example will overwrite the current item. Continue?')) {
      // Reset select to placeholder
      setSelectedExample('');
      return;
    }

    const example = examples.find(ex => ex.name === selectedName);
    if (example) {
      setItemXml(example.item);

      // Auto-process the item
      setError('');
      setProcessing(true);
      try {
        const result = await beginAttempt(example.item);
        setAttemptState(result.state);
        setSanitizedTemplate(result.template);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setProcessing(false);
      }
    }

    // Reset select back to placeholder
    setSelectedExample('');
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


  const renderTabContent = () => {
    switch (activeTab) {
      case 'xml':
        return (
          <div className="tab-content-full">
            <div className="panel xml-panel">
              <textarea
                className="xml-input xml-input-large"
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
          </div>
        );

      case 'editor':
        return (
          <EditorTab
            itemXml={itemXml}
            setItemXml={setItemXml}
            setSanitizedTemplate={setSanitizedTemplate}
            setAttemptState={setAttemptState}
          />
        );

      case 'preview':
        return (
          <PreviewTab
            attemptState={attemptState}
            sanitizedTemplate={sanitizedTemplate}
            responses={responses}
            setResponses={setResponses}
            itemXml={itemXml}
            onStateUpdate={setAttemptState}
          />
        );
    }
  };

  return (
    <>
      <div className="tabs">
        <div className="tabs-left">
          <button
            className={`tab ${activeTab === 'xml' ? 'active' : ''}`}
            onClick={() => setActiveTab('xml')}
          >
            XML
          </button>
          <button
            className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
        <div className="tabs-right">
          <select
            className="example-select-nav"
            onChange={handleExampleSelect}
            value={selectedExample}
            disabled={processing}
          >
            <option value="">Load example item...</option>
            {examples.map((ex) => (
              <option key={ex.name} value={ex.name}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {renderTabContent()}
    </>
  );
}

export default App;
