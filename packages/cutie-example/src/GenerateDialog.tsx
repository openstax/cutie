import { useState, useRef, useEffect } from 'react';
import { shouldRenewToken, redirectToAuth } from './utils/auth';
import { generateQtiItem } from './utils/ai';
import './GenerateDialog.css';

type Mode = 'single' | 'quiz';

interface GenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (xml: string) => void;
  onStartQuiz: (topic: string) => Promise<void>;
}

export function GenerateDialog({ isOpen, onClose, onGenerate, onStartQuiz }: GenerateDialogProps) {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<Mode>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

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
        const xml = await generateQtiItem(topic);
        onGenerate(xml);
        setTopic('');
      } else {
        await onStartQuiz(topic);
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
