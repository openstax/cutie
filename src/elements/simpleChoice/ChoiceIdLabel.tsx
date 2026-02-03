import type { RenderElementProps } from 'slate-react';
import type { ChoiceIdLabel as ChoiceIdLabelType } from '../../types';

/**
 * Renders a decorative (non-editable) choice identifier label
 * This is a void element - the identifier is stored in attributes and edited via properties panel
 */
export function ChoiceIdLabel({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as ChoiceIdLabelType;
  const identifier = el.attributes?.identifier || '';

  return (
    <div
      {...attributes}
      contentEditable={false}
      style={{
        display: 'inline-block',
        marginRight: '8px',
        color: '#475569',
        fontWeight: 'bold',
        fontSize: '1.1em',
        userSelect: 'none',
        verticalAlign: 'baseline',
        cursor: 'default',
      }}
    >
      {identifier}
      {/* Hidden children for Slate's void element requirement */}
      <span style={{ display: 'none' }}>{children}</span>
    </div>
  );
}
