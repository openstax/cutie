import type { RenderElementProps } from 'slate-react';

/**
 * Renders the choice content wrapper
 * Note: This is a block element in Slate's schema but styled to display inline
 * It wraps the actual choice text to ensure qti-simple-choice only has element children
 */
export function ChoiceContent({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return (
    <div
      {...attributes}
      style={{
        display: 'inline',
      }}
    >
      {children}
    </div>
  );
}
