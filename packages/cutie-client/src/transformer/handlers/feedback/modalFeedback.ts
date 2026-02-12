import { registry } from '../../registry';
import type { ElementHandler, TransformContext } from '../../types';
import { createFeedbackIcon, FEEDBACK_ICON_STYLES, isFeedbackType } from './feedbackIcons';

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
    if (context.styleManager && !context.styleManager.hasStyle('cutie-modal-feedback')) {
      context.styleManager.addStyle('cutie-modal-feedback', MODAL_FEEDBACK_STYLES);
    }
    if (context.styleManager && !context.styleManager.hasStyle('cutie-feedback-icon')) {
      context.styleManager.addStyle('cutie-feedback-icon', FEEDBACK_ICON_STYLES);
    }

    const dialog = document.createElement('dialog');
    dialog.className = 'cutie-modal-feedback';
    context.onMount?.(() => {
      dialog.showModal();
      dialog.addEventListener('close', () => {
        const container = context.containerElement;
        if (!container) return;
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1');
          container.style.outline = 'none';
        }
        container.focus();
      });
    });

    // Preserve identifier
    const identifier = element.getAttribute('identifier');
    if (identifier) {
      dialog.dataset.identifier = identifier;
    }

    const outcomeIdentifier = element.getAttribute('outcome-identifier');
    if (outcomeIdentifier) {
      dialog.dataset.outcomeIdentifier = outcomeIdentifier;
    }

    const feedbackType = element.getAttribute('data-feedback-type');
    if (feedbackType) {
      dialog.dataset.feedbackType = feedbackType;
    }

    const feedbackLabels: Record<string, string> = {
      correct: 'Correct feedback',
      incorrect: 'Incorrect feedback',
      info: 'Feedback information',
    };
    dialog.setAttribute('aria-label', feedbackLabels[feedbackType ?? ''] ?? 'Feedback');

    // Add icon header if feedback type is valid
    if (feedbackType && isFeedbackType(feedbackType)) {
      const header = document.createElement('div');
      header.className = 'cutie-modal-feedback__header';
      header.appendChild(createFeedbackIcon(feedbackType));
      dialog.appendChild(header);
    }

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'cutie-modal-feedback__content';

    if (context.transformChildren) {
      contentDiv.appendChild(context.transformChildren(element));
    }

    const form = document.createElement('form');
    form.method = 'dialog';
    form.className = 'cutie-modal-feedback__form';

    const closeButton = document.createElement('button');
    closeButton.className = 'cutie-modal-feedback__close-button';
    closeButton.textContent = 'OK';

    form.appendChild(closeButton);

    // Assemble dialog
    dialog.appendChild(contentDiv);
    dialog.appendChild(form);

    fragment.appendChild(dialog);
    return fragment;
  }
}

const MODAL_FEEDBACK_STYLES = `
  .cutie-modal-feedback {
    min-width: 15rem;
    max-width: calc(100vw - 4rem);
    max-height: calc(100vh - 4rem);
  }

  .cutie-modal-feedback::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .cutie-modal-feedback[data-feedback-type="correct"] {
    border: 3px solid var(--cutie-feedback-correct);
  }

  .cutie-modal-feedback[data-feedback-type="incorrect"] {
    border: 3px solid var(--cutie-feedback-incorrect);
  }

  .cutie-modal-feedback[data-feedback-type="info"] {
    border: 3px solid var(--cutie-feedback-info);
  }

  .cutie-modal-feedback__header {
    margin-bottom: 0.5rem;
  }

  .cutie-modal-feedback__header .cutie-feedback-icon__svg {
    width: 1.5em;
    height: 1.5em;
  }

  .cutie-modal-feedback__form {
    text-align: right;
    margin-top: 1rem;
  }
`;

registry.register('modal-feedback', new ModalFeedbackHandler(), 50);
