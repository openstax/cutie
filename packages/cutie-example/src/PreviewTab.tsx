import { useEffect, useState } from 'react';
import { renderPreview } from '@openstax/cutie-core';
import type { PreviewOptions } from '@openstax/cutie-core';
import { CutieItemView } from './CutieItemView';
import { EmptyState } from './EmptyState';
import { PreviewOptionsPanel } from './PreviewOptionsPanel';
import { SidebarLayout } from './SidebarLayout';
import { isEffectivelyEmptyTemplate } from './utils/qtiUtils';
import { resolveAssets } from './utils/resolveAssets';

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
  const [preview, setPreview] = useState<{ itemXml: string; template: string } | null>(null);

  useEffect(() => {
    if (!itemXml.trim()) return;

    let current = true;
    renderPreview(itemXml, { resolveAssets }, previewOptions)
      .then((template) => {
        if (current) setPreview({ itemXml, template });
      })
      .catch((err) => {
        console.error(err);
        if (current) onError(err instanceof Error ? err.message : 'Error rendering preview');
      });
    return () => { current = false; };
  }, [itemXml, previewOptions, onError]);

  // A preview of an earlier item isn't shown for this one
  const template = preview && preview.itemXml === itemXml ? preview.template : '';

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
          <CutieItemView template={template} attemptState={null} interactionsEnabled={false} />
        </div>
      )}
    </SidebarLayout>
  );
}
