import type { RenderElementProps } from 'slate-react';

/**
 * Render a prompt element
 */
export function PromptElement({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return (
    <div {...attributes} style={{ marginBottom: '8px', fontWeight: 500 }}>
      {children}
    </div>
  );
}
