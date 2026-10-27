export { ModalFeedbackElement } from './Element.js';
export { ModalFeedbackPropertiesPanel } from './PropertiesPanel.js';
export { modalFeedbackConfig } from './config.js';
export { modalFeedbackParsers, modalFeedbackSerializers } from './serialization.js';
export { insertModalFeedback, isInModalFeedback } from './insertion.js';

import { ModalFeedbackElement } from './Element.js';
import { ModalFeedbackPropertiesPanel } from './PropertiesPanel.js';

export const modalFeedbackRenderers = {
  'qti-modal-feedback': ModalFeedbackElement,
};

export const modalFeedbackPropertiesPanels = {
  'qti-modal-feedback': ModalFeedbackPropertiesPanel,
};
