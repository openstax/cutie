import { useState, useRef, useEffect } from 'react';
import { shouldRenewToken, redirectToAuth } from './utils/auth';
import { generateQtiItem } from './utils/ai';
import { MODEL_ENTRIES, DEFAULT_MODEL_ID, DEFAULT_FAST_MODEL_ID } from './utils/config';
import './GenerateDialog.css';

type Mode = 'single' | 'quiz';

interface GenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (xml: string) => void;
  onStartQuiz: (topic: string, modelId: number, fastModelId: number) => Promise<void>;
}

export function GenerateDialog({ isOpen, onClose, onGenerate, onStartQuiz }: GenerateDialogProps) {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<Mode>('quiz');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [modelId, setModelId] = useState(() =>
    parseInt(localStorage.getItem('ai-model-id') || String(DEFAULT_MODEL_ID))
  );
  const [fastModelId, setFastModelId] = useState(() =>
    parseInt(localStorage.getItem('ai-fast-model-id') || String(DEFAULT_FAST_MODEL_ID))
  );

  // Persist model selections to localStorage
  useEffect(() => {
    localStorage.setItem('ai-model-id', String(modelId));
  }, [modelId]);

  useEffect(() => {
    localStorage.setItem('ai-fast-model-id', String(fastModelId));
  }, [fastModelId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    setTopic('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError('');
    setIsLoading(true);

    try {
      if (mode === 'single') {
        const xml = await generateQtiItem(topic, undefined, modelId);
        onGenerate(xml);
        setTopic('');
      } else {
        await onStartQuiz(topic, modelId, fastModelId);
        setTopic('');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err instanceof Error ? err.message : mode === 'single' ? 'Failed to generate item' : 'Failed to start quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const needsAuth = shouldRenewToken();

  return (
    <dialog ref={dialogRef} className="generate-dialog" onClose={handleClose}>
      <div className="generate-dialog-content">
        <h2>Generate QTI Item with AI</h2>

        {needsAuth ? (
          <div className="auth-prompt">
            <p>Please log in to use AI generation.</p>
            <button className="process-button" onClick={() => redirectToAuth()}>
              Log In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mode-toggle">
              <label className={`mode-option ${mode === 'single' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="single"
                  checked={mode === 'single'}
                  onChange={() => setMode('single')}
                  disabled={isLoading}
                />
                Single Item
              </label>
              <label className={`mode-option ${mode === 'quiz' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="quiz"
                  checked={mode === 'quiz'}
                  onChange={() => setMode('quiz')}
                  disabled={isLoading}
                />
                Quiz Mode
              </label>
            </div>

            <label htmlFor="topic-input">
              {mode === 'single' ? 'Enter a topic for the question:' : 'Enter a topic for the quiz:'}
            </label>
            <textarea
              id="topic-input"
              className="topic-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={mode === 'single'
                ? "e.g., photosynthesis, the French Revolution, quadratic equations..."
                : "e.g., world history, organic chemistry, calculus fundamentals..."}
              disabled={isLoading}
              rows={3}
            />

            <div className="model-selectors">
              <div className="model-select">
                <label htmlFor="model-select">Model</label>
                <select
                  id="model-select"
                  value={modelId}
                  onChange={(e) => setModelId(parseInt(e.target.value))}
                  disabled={isLoading}
                >
                  {MODEL_ENTRIES.map(([name, id]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="model-select">
                <label htmlFor="fast-model-select">Fast Model</label>
                <select
                  id="fast-model-select"
                  value={fastModelId}
                  onChange={(e) => setFastModelId(parseInt(e.target.value))}
                  disabled={isLoading}
                >
                  {MODEL_ENTRIES.map(([name, id]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className="dialog-error">{error}</div>}

            <div className="dialog-buttons">
              <button type="button" className="cancel-button" onClick={handleClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="process-button" disabled={!topic.trim() || isLoading}>
                {isLoading
                  ? (mode === 'single' ? 'Generating...' : 'Starting quiz...')
                  : (mode === 'single' ? 'Generate' : 'Start Quiz')}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
