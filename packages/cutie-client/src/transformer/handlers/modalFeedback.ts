import { registry } from '../registry';
import type { ElementHandler, TransformContext } from '../types';

/**
 * Handler for qti-modal-feedback elements.
 * Renders feedback content in a modal dialog using the native <dialog> element.
 *
 * Server-side (cutie-core) has already handled visibility logic.
 * By the time XML reaches the client, only visible modal feedback elements remain.
 */
class ModalFeedbackHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-modal-feedback';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();
    
    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('qti-feedback-block')) {
      context.styleManager.addStyle('qti-modal-feedback', MODAL_FEEDBACK_STYLES);
    }

    const dialog = document.createElement('dialog');
    dialog.className = 'qti-modal-feedback';
    dialog.open = true;

    // Preserve identifier
    const identifier = element.getAttribute('identifier');
    if (identifier) {
      dialog.dataset.identifier = identifier;
    }

    const feedbackType = element.getAttribute('data-feedback-type');
    if (feedbackType) {
      dialog.dataset.feedbackType = feedbackType;
    }

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'qti-modal-feedback__content';

    if (context.transformChildren) {
      contentDiv.appendChild(context.transformChildren(element));
    }

    const form = document.createElement('form');
    form.method = 'dialog';
    form.className = 'qti-modal-feedback__form';

    const closeButton = document.createElement('button');
    closeButton.className = 'qti-modal-feedback__close-button';
    closeButton.innerText = 'OK';
    
    form.appendChild(closeButton);

    // Assemble dialog
    dialog.appendChild(contentDiv);
    dialog.appendChild(form);

    fragment.appendChild(dialog);
    return fragment;
  }
}

const MODAL_FEEDBACK_STYLES = `
  .qti-modal-feedback {
    min-width: 15rem;
    max-width: calc(100vw - 4rem);
    max-height: calc(100vh - 4rem);
    position: fixed;
    margin: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .qti-modal-feedback[data-feedback-type="correct"] {
    border: 3px solid #22c55e;
  }

  .qti-modal-feedback[data-feedback-type="incorrect"] {
    border: 3px solid #ef4444;
  }

  .qti-modal-feedback[data-feedback-type="info"] {
    border: 3px solid #4a90e2;
  }

  .qti-modal-feedback__form {
    text-align: right;
    margin-top: 1rem;
  }
`;

registry.register('modal-feedback', new ModalFeedbackHandler(), 50);
