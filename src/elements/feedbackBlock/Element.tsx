import { useFocused, useSelected } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import { useFeedbackIdentifiers } from '../../contexts/FeedbackIdentifiersContext';
import { useStyle } from '../../hooks/useStyle';
import type { QtiFeedbackBlock } from '../../types';

/**
 * Render a feedback block element
 * Design aligned with choice interaction - fieldset with legend
 */
export function FeedbackBlockElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiFeedbackBlock;
  const selected = useSelected();
  const focused = useFocused();
  const { availableIdentifiers } = useFeedbackIdentifiers();

  useStyle('feedback-block', FEEDBACK_BLOCK_STYLES);

  const identifier = el.attributes.identifier || '';
  const showHide = el.attributes['show-hide'] || 'show';
  const isValid = !identifier || availableIdentifiers.has(identifier);
  const isActive = selected && focused;

  const containerClass = [
    'feedback-block',
    isActive ? 'feedback-block--active' : '',
    !isValid ? 'feedback-block--invalid' : '',
  ].filter(Boolean).join(' ');

  return (
    <fieldset {...attributes} className={containerClass}>
      <legend contentEditable={false} className="feedback-block__legend">
        {!isValid && <span title="Invalid feedback identifier">&#9888; </span>}
        {showHide === 'hide' ? 'Hide' : 'Show'} when: {identifier || '(none)'}
      </legend>
      <div>{children}</div>
    </fieldset>
  );
}

const FEEDBACK_BLOCK_STYLES = `
  .feedback-block {
    margin: 16px 0;
    padding: 13px;
    border: 1px solid #94a3b8;
    border-radius: 8px;
  }

  .feedback-block--active {
    padding: 12px;
    border: 2px solid #3b82f6;
  }

  .feedback-block--invalid {
    border-color: #f59e0b;
    background-color: #fffbeb;
  }

  .feedback-block--invalid.feedback-block--active {
    border-color: #3b82f6;
    background-color: #fefce8;
  }

  .feedback-block__legend {
    padding: 0 8px;
    font-weight: bold;
    color: #64748b;
    user-select: none;
  }

  .feedback-block--active .feedback-block__legend {
    color: #1e40af;
  }

  .feedback-block--invalid .feedback-block__legend {
    color: #92400e;
  }

  .feedback-block--invalid.feedback-block--active .feedback-block__legend {
    color: #1e40af;
  }
`;
