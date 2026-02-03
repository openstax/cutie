import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import type { QtiExtendedTextInteraction } from '../../types';
import { getCorrectValue } from '../../utils/responseDeclaration';
import { getMapping } from '../../utils/mappingDeclaration';

/**
 * Get the display value for an extended text interaction.
 * Priority: highest mapped value → correct value → null
 */
function getDisplayValue(element: QtiExtendedTextInteraction): string | null {
  const responseDecl = element.responseDeclaration;

  // Check for mapping first - find the entry with highest mapped value
  const mappingData = getMapping(responseDecl);
  if (mappingData && mappingData.entries.length > 0) {
    const highestEntry = mappingData.entries.reduce((best, entry) =>
      entry.mappedValue > best.mappedValue ? entry : best
    );
    if (highestEntry.mapKey) {
      return highestEntry.mapKey;
    }
  }

  // Fall back to correct value
  const correctValue = getCorrectValue(responseDecl);
  if (correctValue) {
    return correctValue;
  }

  return null;
}

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
  const displayValue = getDisplayValue(el);

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
      {displayValue && (
        <div
          contentEditable={false}
          style={{
            marginTop: '8px',
            fontSize: '0.85em',
            color: '#64748b',
            userSelect: 'none',
            whiteSpace: 'pre-wrap',
          }}
        >
          Correct answer:
          <br />
          {displayValue}
        </div>
      )}
    </fieldset>
  );
}
