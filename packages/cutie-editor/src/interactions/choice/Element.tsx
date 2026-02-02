import { useMemo } from 'react';
import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import type { QtiChoiceInteraction } from '../../types';
import { getCorrectValues, hasCorrectResponse } from '../../utils/responseDeclaration';
import { getMapping, hasMapping } from '../../utils/mappingDeclaration';
import { ChoiceScoringProvider, type ChoiceScoringInfo } from './ChoiceScoringContext';

/**
 * Renders a choice interaction in the editor
 */
export function ChoiceElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiChoiceInteraction;
  const selected = useSelected();
  const focused = useFocused();

  // Build scoring info for children
  const scoringInfo = useMemo((): ChoiceScoringInfo => {
    const responseDecl = el.responseDeclaration;
    const correctValues = getCorrectValues(responseDecl);
    const mappingData = getMapping(responseDecl);

    const mappingByKey = new Map<string, { mapKey: string; mappedValue: number }>();
    if (mappingData) {
      for (const entry of mappingData.entries) {
        mappingByKey.set(entry.mapKey, entry);
      }
    }

    return {
      correctValues,
      hasCorrectness: hasCorrectResponse(responseDecl),
      mappingByKey,
      hasMapping: hasMapping(responseDecl),
      defaultMappedValue: mappingData?.metadata.defaultValue ?? 0,
    };
  }, [el.responseDeclaration]);

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
        Choice Interaction
      </legend>
      <ChoiceScoringProvider value={scoringInfo}>
        {children}
      </ChoiceScoringProvider>
    </fieldset>
  );
}
