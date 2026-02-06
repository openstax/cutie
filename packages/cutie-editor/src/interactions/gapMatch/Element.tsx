import { useMemo } from 'react';
import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import type {
  QtiGapMatchInteraction,
  QtiGapText,
  QtiGapImg,
  QtiGap,
} from '../../types';
import { getCorrectValues, hasCorrectResponse } from '../../utils/responseDeclaration';
import { getMapping, hasMapping } from '../../utils/mappingDeclaration';
import { GapMatchScoringProvider, type GapMatchScoringInfo } from './GapMatchScoringContext';

/**
 * Renders a gap-match interaction in the editor
 */
export function GapMatchInteractionElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiGapMatchInteraction;
  const selected = useSelected();
  const focused = useFocused();

  // Build scoring info for children
  const scoringInfo = useMemo((): GapMatchScoringInfo => {
    const responseDecl = el.responseDeclaration;
    const correctValues = getCorrectValues(responseDecl);
    const mappingData = getMapping(responseDecl);

    // Parse directedPair values into gap -> choice map
    const correctPairings = new Map<string, string>();
    for (const value of correctValues) {
      // directedPair format: "CHOICE GAP" (e.g., "W G1")
      const parts = value.split(' ');
      if (parts.length === 2) {
        const [choice, gap] = parts;
        correctPairings.set(gap, choice);
      }
    }

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
        Gap Match Interaction
      </legend>
      <GapMatchScoringProvider value={scoringInfo}>
        {children}
      </GapMatchScoringProvider>
    </fieldset>
  );
}

/**
 * Renders the choices container (editor-only wrapper)
 */
export function GapMatchChoicesElement({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return (
    <div
      {...attributes}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px',
        marginBottom: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '6px',
        border: '1px dashed #cbd5e1',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Renders the content container (editor-only wrapper - invisible)
 */
export function GapMatchContentElement({
  attributes,
  children,
}: RenderElementProps): React.JSX.Element {
  return <div {...attributes}>{children}</div>;
}

/**
 * Renders a gap-text choice element
 */
export function GapTextElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiGapText;
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

/**
 * Renders a gap-img choice element
 */
export function GapImgElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiGapImg;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <span
      {...attributes}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px',
        backgroundColor: selected && focused ? '#dbeafe' : '#e0f2fe',
        border: selected && focused ? '2px solid #3b82f6' : '1px solid #0ea5e9',
        borderRadius: '4px',
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

/**
 * Renders a gap (inline void placeholder)
 * Styled to match inline choice and text entry elements
 */
export function GapElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiGap;
  const selected = useSelected();
  const focused = useFocused();
  const { correctPairings, hasCorrectness } = useGapMatchScoring();

  // Get the correct choice for this gap (if defined)
  const correctChoice = hasCorrectness ? correctPairings.get(el.attributes.identifier) : undefined;

  // Format: "Gap {gapId}" or "Gap {gapId}: {choiceId}" if answer configured
  const label = correctChoice
    ? `Gap ${el.attributes.identifier}: ${correctChoice}`
    : `Gap ${el.attributes.identifier}`;

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
          fontWeight: 'bold',
          userSelect: 'none',
        }}
      >
        {label}
      </span>
      {children}
    </span>
  );
}

// Import the hook for use in GapElement
import { useGapMatchScoring } from './GapMatchScoringContext';
