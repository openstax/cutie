import type { RenderElementProps } from 'slate-react';

/**
 * Renders an editable choice identifier label
 * Note: This is a block element in Slate's schema (to avoid spacer text nodes)
 * but styled to display inline with the choice text
 * The brackets are non-editable, but the ID text inside is editable
 */
export function ChoiceIdLabel({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return (
    <div
      {...attributes}
      style={{
        display: 'inline-block',
        marginRight: '8px',
        color: '#689f38',
        fontWeight: 500,
        userSelect: 'text',
        verticalAlign: 'baseline',
      }}
    >
      <span contentEditable={false} style={{ userSelect: 'none' }}>
        [
      </span>
      {children}
      <span contentEditable={false} style={{ userSelect: 'none' }}>
        ]
      </span>
    </div>
  );
}
