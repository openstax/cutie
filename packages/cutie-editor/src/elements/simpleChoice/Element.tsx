import type { RenderElementProps } from 'slate-react';

/**
 * Render a simple choice element
 */
export function SimpleChoiceElement({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return (
    <div
      {...attributes}
      style={{
        padding: '8px',
        margin: '4px 0',
        backgroundColor: '#f1f8e9',
        border: '1px solid #c5e1a5',
        borderRadius: '4px',
      }}
    >
      {children}
    </div>
  );
}
