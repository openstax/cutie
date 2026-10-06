import type { PreviewOptions } from '@openstax/cutie-core';
import { CutieItemView } from './CutieItemView';
import { EmptyState } from './EmptyState';
import { PreviewOptionsPanel } from './PreviewOptionsPanel';
import { SidebarLayout } from './SidebarLayout';
import { isEffectivelyEmptyTemplate } from './utils/qtiUtils';
import { usePreviewTemplate } from './utils/usePreviewTemplate';

interface PreviewTabProps {
  itemXml: string;
  previewOptions: PreviewOptions;
  onPreviewOptionsChange: (options: PreviewOptions) => void;
  onError: (message: string) => void;
  isLoading?: boolean;
  onOpenGenerateDialog?: () => void;
}

/**
 * Previews the item as an instructor or author sees it: disabled, with the
 * correct answers and, unless compact, all of its feedback.
 */
export function PreviewTab({ itemXml, previewOptions, onPreviewOptionsChange, onError, isLoading, onOpenGenerateDialog }: PreviewTabProps) {
  const template = usePreviewTemplate(itemXml, previewOptions.compact ?? false, onError);

  return (
    <SidebarLayout
      sidebar={
        <>
          <PreviewOptionsPanel options={previewOptions} onChange={onPreviewOptionsChange} />

          <details className="panel" open>
            <summary>
              <h2>Preview Template</h2>
            </summary>
            <pre className="output-display xml-output">
              {template || 'No template yet'}
            </pre>
          </details>
        </>
      }
    >
      {isLoading ? (
        <div className="empty-state">
          <div className="loading-spinner" />
          <p>Generating your question...</p>
        </div>
      ) : isEffectivelyEmptyTemplate(template) ? (
        <EmptyState onOpenGenerateDialog={onOpenGenerateDialog} />
      ) : (
        <div className="item-card">
          <CutieItemView template={template} attemptState={null} interactionState="readonly" />
        </div>
      )}
    </SidebarLayout>
  );
}
