import { useEffect, useState } from 'react';
import { renderPreview } from '@openstax/cutie-core';
import { resolveAssets } from './resolveAssets';

/**
 * Renders the instructor/author preview template of an item, or '' until the
 * preview of this item, in this mode, is ready.
 */
export function usePreviewTemplate(itemXml: string, compact: boolean, onError: (message: string) => void): string {
  const [preview, setPreview] = useState<{ itemXml: string; compact: boolean; template: string } | null>(null);

  useEffect(() => {
    if (!itemXml.trim()) return;

    let current = true;
    renderPreview(itemXml, { resolveAssets }, { compact })
      .then((template) => {
        if (current) setPreview({ itemXml, compact, template });
      })
      .catch((err) => {
        console.error(err);
        if (current) onError(err instanceof Error ? err.message : 'Error rendering preview');
      });
    return () => { current = false; };
  }, [itemXml, compact, onError]);

  // A preview of an earlier item, or in the other mode, isn't shown for this one
  return preview && preview.itemXml === itemXml && preview.compact === compact ? preview.template : '';
}
