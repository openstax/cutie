import { useFocused, useSelected } from 'slate-react';
import type { RenderElementProps } from 'slate-react';
import { useFeedbackIdentifiers } from '../../../contexts/FeedbackIdentifiersContext';
import { useStyle } from '../../../hooks/useStyle';
import type { QtiModalFeedback } from '../../../types';

/**
 * Render a modal feedback element
 */
export function ModalFeedbackElement({
  attributes,
  children,
  element,
}: RenderElementProps): React.JSX.Element {
  const el = element as QtiModalFeedback;
  const selected = useSelected();
  const focused = useFocused();
  const { availableIdentifiers, identifierLabels, isCustomMode } = useFeedbackIdentifiers();

  useStyle('modal-feedback', MODAL_FEEDBACK_STYLES);

  const identifier = el.attributes.identifier || '';
  const showHide = el.attributes['show-hide'] || 'show';
  // In custom mode, any non-empty identifier is valid (custom response processing can use arbitrary identifiers)
  const isValid = isCustomMode
    ? Boolean(identifier)
    : identifier && availableIdentifiers.has(identifier);
  const isActive = selected && focused;
  const displayLabel = identifier ? identifierLabels.get(identifier) || identifier : '(none)';

  const containerClass = [
    'modal-feedback',
    isActive ? 'modal-feedback--active' : '',
    !isValid ? 'modal-feedback--invalid' : '',
  ].filter(Boolean).join(' ');

  return (
    <fieldset {...attributes} className={containerClass}>
      <legend contentEditable={false} className="modal-feedback__legend">
        {!isValid && <span title="Invalid feedback identifier">&#9888; </span>}
        Modal Feedback: {showHide === 'hide' ? 'Hide' : 'Show'} when {displayLabel}
      </legend>
      <div>{children}</div>
    </fieldset>
  );
}

const MODAL_FEEDBACK_STYLES = `
  .modal-feedback {
    margin: 16px 0;
    padding: 13px;
    border: 1px solid #94a3b8;
    border-radius: 8px;
  }

  .modal-feedback--active {
    padding: 12px;
    border: 2px solid #3b82f6;
  }

  .modal-feedback--invalid {
    border-color: #f59e0b;
    background-color: #fffbeb;
  }

  .modal-feedback--invalid.modal-feedback--active {
    border-color: #3b82f6;
    background-color: #fefce8;
  }

  .modal-feedback__legend {
    padding: 0 8px;
    font-weight: bold;
    color: #64748b;
    user-select: none;
  }

  .modal-feedback--active .modal-feedback__legend {
    color: #1e40af;
  }

  .modal-feedback--invalid .modal-feedback__legend {
    color: #92400e;
  }

  .modal-feedback--invalid.modal-feedback--active .modal-feedback__legend {
    color: #1e40af;
  }
`;
