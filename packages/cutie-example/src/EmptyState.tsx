interface EmptyStateProps {
  onOpenGenerateDialog?: () => void;
}

/**
 * Shown in place of the item before one is loaded.
 */
export function EmptyState({ onOpenGenerateDialog }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>No question loaded yet.</p>
      <p className="empty-state-hint">
        Load an example, paste XML in the XML tab, or try AI-powered quiz mode.
      </p>
      {onOpenGenerateDialog && (
        <button className="process-button" onClick={onOpenGenerateDialog}>
          ✨ Generate with AI
        </button>
      )}
    </div>
  );
}
