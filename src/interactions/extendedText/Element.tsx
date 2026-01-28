import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import type { QtiExtendedTextInteraction } from '../../types';

/**
 * Renders an extended text interaction in the editor
 */
export function ExtendedTextElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiExtendedTextInteraction;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <div {...attributes}>
      <div
        contentEditable={false}
        style={{
          padding: selected && focused ? '8px' : '9px',
          margin: '8px 0',
          backgroundColor: selected && focused ? '#eff6ff' : '#f8fafc',
          border: selected && focused ? '2px solid #3b82f6' : '1px solid #94a3b8',
          borderRadius: '4px',
          color: selected && focused ? '#1e40af' : '#64748b',
          userSelect: 'none',
        }}
      >
        <div style={{ fontWeight: 'bold' }}>
          [Extended Text: {el.attributes['response-identifier']}]
        </div>
      </div>
      {children}
    </div>
  );
}
