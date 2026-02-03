import { useSelected, useFocused } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import type { QtiSimpleChoice } from '../../types';
import { useChoiceScoring } from '../../interactions/choice/ChoiceScoringContext';
import { CheckIcon, CloseIcon } from '../../components/icons';

/**
 * Render a simple choice element
 */
export function SimpleChoiceElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiSimpleChoice;
  const identifier = el.attributes.identifier;
  const scoringInfo = useChoiceScoring();
  const selected = useSelected();
  const focused = useFocused();

  // Determine correctness indicator
  let correctnessIcon: React.JSX.Element | null = null;
  if (scoringInfo?.hasCorrectness) {
    const isCorrect = scoringInfo.correctValues.includes(identifier);
    correctnessIcon = isCorrect ? (
      <span
        contentEditable={false}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          color: '#16a34a',
          marginRight: '4px',
          userSelect: 'none',
        }}
        title="Correct"
      >
        <CheckIcon size={16} />
      </span>
    ) : (
      <span
        contentEditable={false}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          color: '#dc2626',
          marginRight: '4px',
          userSelect: 'none',
        }}
        title="Incorrect"
      >
        <CloseIcon size={16} />
      </span>
    );
  }

  // Determine points badge
  let pointsBadge: React.JSX.Element | null = null;
  if (scoringInfo?.hasMapping) {
    const entry = scoringInfo.mappingByKey.get(identifier);
    const points = entry?.mappedValue ?? scoringInfo.defaultMappedValue;
    pointsBadge = (
      <span
        contentEditable={false}
        style={{
          display: 'inline-block',
          marginLeft: '8px',
          padding: '1px 6px',
          backgroundColor: points > 0 ? '#dcfce7' : '#f3f4f6',
          color: points > 0 ? '#166534' : '#6b7280',
          borderRadius: '4px',
          fontSize: '0.75em',
          fontWeight: 500,
          userSelect: 'none',
        }}
      >
        {points}pts
      </span>
    );
  }

  return (
    <div
      {...attributes}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: selected && focused ? '7px' : '8px',
        margin: '4px 0',
        backgroundColor: '#f8fafc',
        border: selected && focused ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        borderRadius: '4px',
      }}
    >
      {correctnessIcon}
      <div style={{ flex: 1 }}>
        {children}
      </div>
      {pointsBadge}
    </div>
  );
}
