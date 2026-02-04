import type { Path } from 'slate';
import { useSlate } from 'slate-react';
import type { QtiModalFeedback, ElementAttributes, ResponseProcessingConfig } from '../../../types';
import { getAllFeedbackIdentifierOptions } from '../../../utils/feedbackIdentifiers';
import { useStyle } from '../../../hooks/useStyle';
import {
  FEEDBACK_PROPERTIES_STYLES,
  CustomModeWarning,
  IdentifierSelector,
  ShowHideRadioGroup,
  ReadonlyAttributeInfo,
  IdentifierTip,
} from '..';

interface ModalFeedbackPropertiesPanelProps {
  element: QtiModalFeedback;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
  responseProcessingConfig?: ResponseProcessingConfig;
}

/**
 * Properties panel for editing modal feedback attributes
 */
export function ModalFeedbackPropertiesPanel({
  element,
  path,
  onUpdate,
  responseProcessingConfig,
}: ModalFeedbackPropertiesPanelProps): React.JSX.Element {
  const editor = useSlate();
  useStyle('feedback-properties', FEEDBACK_PROPERTIES_STYLES);

  const isCustomMode = responseProcessingConfig?.mode === 'custom';
  const attrs = element.attributes;
  const currentIdentifier = attrs.identifier || '';
  const currentShowHide = attrs['show-hide'] || 'show';

  const feedbackOptions = getAllFeedbackIdentifierOptions(editor.children);

  const handleIdentifierChange = (newIdentifier: string) => {
    const newAttrs = {
      ...attrs,
      identifier: newIdentifier,
    };
    onUpdate(path, newAttrs);
  };

  const handleShowHideChange = (value: 'show' | 'hide') => {
    const newAttrs = {
      ...attrs,
      'show-hide': value,
    };
    onUpdate(path, newAttrs);
  };

  return (
    <div className="property-editor">
      <h3>Modal Feedback</h3>

      {isCustomMode && <CustomModeWarning />}

      <IdentifierSelector
        value={currentIdentifier}
        options={feedbackOptions}
        onChange={handleIdentifierChange}
        disabled={isCustomMode}
      />

      <ShowHideRadioGroup
        value={currentShowHide}
        onChange={handleShowHideChange}
        name="show-hide-modal"
        disabled={isCustomMode}
      />

      {currentIdentifier && !isCustomMode && (
        <IdentifierTip identifier={currentIdentifier} options={feedbackOptions} />
      )}

      {isCustomMode && (
        <ReadonlyAttributeInfo
          outcomeIdentifier={attrs['outcome-identifier'] || 'FEEDBACK'}
          identifier={currentIdentifier}
          showHide={currentShowHide}
        />
      )}
    </div>
  );
}
