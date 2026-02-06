import { useMemo } from 'react';
import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import type {
  QtiMatchInteraction,
  QtiSimpleAssociableChoice,
} from '../../types';
import { getCorrectValues, hasCorrectResponse } from '../../utils/responseDeclaration';
import { getMapping, hasMapping } from '../../utils/mappingDeclaration';
import { MatchScoringProvider, type MatchScoringInfo } from './MatchScoringContext';

/**
 * Renders a match interaction in the editor
 */
export function MatchInteractionElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiMatchInteraction;
  const selected = useSelected();
  const focused = useFocused();

  // Build scoring info for children
  const scoringInfo = useMemo((): MatchScoringInfo => {
    const responseDecl = el.responseDeclaration;
    const correctValues = getCorrectValues(responseDecl);
    const mappingData = getMapping(responseDecl);

    // Parse directedPair values into a set
    const correctPairings = new Set<string>(correctValues);

    const mappingByKey = new Map<string, { mapKey: string; mappedValue: number }>();
    if (mappingData) {
      for (const entry of mappingData.entries) {
        mappingByKey.set(entry.mapKey, entry);
      }
    }

    return {
      correctPairings,
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
        Match Interaction
      </legend>
      <MatchScoringProvider value={scoringInfo}>
        {children}
      </MatchScoringProvider>
    </fieldset>
  );
}

/**
 * Renders the source items container (editor-only wrapper)
 */
export function MatchSourceSetElement({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return (
    <div
      {...attributes}
      style={{
        marginBottom: '12px',
      }}
    >
      <div
        contentEditable={false}
        style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
          userSelect: 'none',
        }}
      >
        Source Items
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Renders the target items container (editor-only wrapper)
 */
export function MatchTargetSetElement({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return (
    <div
      {...attributes}
      style={{
        marginBottom: '8px',
      }}
    >
      <div
        contentEditable={false}
        style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
          userSelect: 'none',
        }}
      >
        Target Items
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Renders a simple associable choice element
 */
export function SimpleAssociableChoiceElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiSimpleAssociableChoice;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <span
      {...attributes}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        backgroundColor: selected && focused ? '#dbeafe' : '#e0f2fe',
        border: selected && focused ? '2px solid #3b82f6' : '1px solid #0ea5e9',
        borderRadius: '4px',
        cursor: 'text',
      }}
    >
      <span
        contentEditable={false}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '20px',
          height: '20px',
          padding: '0 4px',
          marginRight: '6px',
          backgroundColor: '#0284c7',
          color: 'white',
          borderRadius: '3px',
          fontSize: '11px',
          fontWeight: 'bold',
          userSelect: 'none',
        }}
      >
        {el.attributes.identifier}
      </span>
      {children}
    </span>
  );
}
