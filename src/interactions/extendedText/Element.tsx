import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';

/**
 * Renders an extended text interaction in the editor
 */
export function ExtendedTextElement({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  const selected = useSelected();
  const focused = useFocused();

  return (
    <fieldset
      {...attributes}
      style={{
        margin: '16px 0',
        padding: selected && focused ? '12px' : '13px',
        border: selected && focused ? '2px solid #3b82f6' : '1px solid #94a3b8',
        borderRadius: '8px',
      }}
    >
      <legend
        contentEditable={false}
        style={{
          padding: '0 8px',
          fontWeight: 'bold',
          color: selected && focused ? '#1e40af' : '#64748b',
          userSelect: 'none',
        }}
      >
        Extended Text Interaction
      </legend>
      {children}
    </fieldset>
  );
}
