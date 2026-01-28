import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import type { QtiTextEntryInteraction } from '../../types';

/**
 * Renders a text entry interaction in the editor
 */
export function TextEntryElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiTextEntryInteraction;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <span {...attributes}>
      <span
        contentEditable={false}
        style={{
          display: 'inline-block',
          padding: selected && focused ? '2px 8px' : '3px 9px',
          margin: '0 4px',
          backgroundColor: selected && focused ? '#eff6ff' : '#f8fafc',
          border: selected && focused ? '2px solid #3b82f6' : '1px solid #94a3b8',
          borderRadius: '4px',
          fontSize: '0.9em',
          color: selected && focused ? '#1e40af' : '#64748b',
          userSelect: 'none',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>
          [Text Entry: {el.attributes['response-identifier']}]
        </span>
      </span>
      {children}
    </span>
  );
}
