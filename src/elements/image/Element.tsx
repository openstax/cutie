import { useState, useEffect } from 'react';
import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import type { ImageElement as ImageElementType } from '../../types';
import { useAssetHandlers } from '../../contexts/AssetContext';

/**
 * Render an image element with asset resolution.
 * Edit UI is provided by the ImagePropertiesPanel.
 */
export function ImageElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as ImageElementType;
  const { resolveAsset } = useAssetHandlers();
  const selected = useSelected();
  const focused = useFocused();

  const [resolvedSrc, setResolvedSrc] = useState(el.attributes.src);

  // Resolve URL asynchronously when src changes
  useEffect(() => {
    let cancelled = false;

    if (resolveAsset) {
      resolveAsset(el.attributes.src).then((resolved) => {
        if (!cancelled) {
          setResolvedSrc(resolved);
        }
      });
    } else {
      setResolvedSrc(el.attributes.src);
    }

    return () => {
      cancelled = true;
    };
  }, [el.attributes.src, resolveAsset]);

  return (
    <span {...attributes} style={{ display: 'inline-block' }}>
      <span contentEditable={false} style={{ display: 'inline-block' }}>
        <img
          src={resolvedSrc}
          alt={el.attributes.alt}
          style={{
            maxWidth: '100%',
            display: 'block',
            boxShadow: selected && focused ? '0 0 0 2px #1976d2' : undefined,
          }}
        />
      </span>
      {children}
    </span>
  );
}
