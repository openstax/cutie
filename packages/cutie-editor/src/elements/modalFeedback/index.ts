export { ModalFeedbackElement } from './Element';
export { ModalFeedbackPropertiesPanel } from './PropertiesPanel';
export { modalFeedbackConfig } from './config';
export { modalFeedbackParsers, modalFeedbackSerializers } from './serialization';
export { insertModalFeedback, isInModalFeedback } from './insertion';

import { ModalFeedbackElement } from './Element';
import { ModalFeedbackPropertiesPanel } from './PropertiesPanel';

export const modalFeedbackRenderers = {
  'qti-modal-feedback': ModalFeedbackElement,
};

export const modalFeedbackPropertiesPanels = {
  'qti-modal-feedback': ModalFeedbackPropertiesPanel,
};
