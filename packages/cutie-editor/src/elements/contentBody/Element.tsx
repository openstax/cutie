import type { RenderElementProps } from 'slate-react';

/**
 * Render a qti-content-body element
 * This is a transparent container - it just renders its children
 */
export function ContentBodyElement({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return (
    <div {...attributes}>
      {children}
    </div>
  );
}
