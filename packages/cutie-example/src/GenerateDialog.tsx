import { useState, useRef, useEffect } from 'react';
import { shouldRenewToken, redirectToAuth } from './utils/auth';
import { generateQtiItem } from './utils/ai';
import './GenerateDialog.css';

interface GenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (xml: string) => void;
}

export function GenerateDialog({ isOpen, onClose, onGenerate }: GenerateDialogProps) {
  const [topic, setTopic] = useState('');
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
      const xml = await generateQtiItem(topic);
      onGenerate(xml);
      setTopic('');
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate item');
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
            <label htmlFor="topic-input">Enter a topic for the question:</label>
            <textarea
              id="topic-input"
              className="topic-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., photosynthesis, the French Revolution, quadratic equations..."
              disabled={isLoading}
              rows={3}
            />

            {error && <div className="dialog-error">{error}</div>}

            <div className="dialog-buttons">
              <button type="button" className="cancel-button" onClick={handleClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="process-button" disabled={!topic.trim() || isLoading}>
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
