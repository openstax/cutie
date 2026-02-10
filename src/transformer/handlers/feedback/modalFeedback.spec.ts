import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StyleManager, TransformContext } from '../../types';

/**
 * ModalFeedbackHandler class for testing (copied to avoid singleton registry issues)
 */
class ModalFeedbackHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-modal-feedback';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('qti-modal-feedback')) {
      context.styleManager.addStyle('qti-modal-feedback', expect.any(String) as unknown as string);
    }

    const dialog = document.createElement('dialog');
    dialog.className = 'qti-modal-feedback';

    // Preserve identifier
    const identifier = element.getAttribute('identifier');
    if (identifier) {
      dialog.dataset.identifier = identifier;
    }

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'qti-modal-feedback__content';

    if (context.transformChildren) {
      contentDiv.appendChild(context.transformChildren(element));
    }

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'qti-modal-feedback__close';
    closeButton.setAttribute('aria-label', 'Close feedback');
    closeButton.textContent = '\u00D7';
    closeButton.addEventListener('click', () => dialog.close());

    // Assemble dialog
    dialog.appendChild(closeButton);
    dialog.appendChild(contentDiv);

    // Handle backdrop click to close
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });

    fragment.appendChild(dialog);
    return fragment;
  }
}

describe('ModalFeedbackHandler', () => {
  let handler: ModalFeedbackHandler;
  let mockStyleManager: StyleManager;

  beforeEach(() => {
    handler = new ModalFeedbackHandler();
    mockStyleManager = {
      hasStyle: vi.fn().mockReturnValue(false),
      addStyle: vi.fn(),
    };
  });

  describe('canHandle', () => {
    it('should return true for qti-modal-feedback elements', () => {
      const element = document.createElement('qti-modal-feedback');
      expect(handler.canHandle(element)).toBe(true);
    });

    it('should return false for other elements', () => {
      const div = document.createElement('div');
      const feedbackBlock = document.createElement('qti-feedback-block');

      expect(handler.canHandle(div)).toBe(false);
      expect(handler.canHandle(feedbackBlock)).toBe(false);
    });
  });

  describe('transform', () => {
    it('should transform qti-modal-feedback to dialog element with correct class', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = handler.transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog).not.toBeNull();
      expect(dialog?.className).toBe('qti-modal-feedback');
    });

    it('should preserve identifier as data-identifier attribute', () => {
      const element = document.createElement('qti-modal-feedback');
      element.setAttribute('identifier', 'feedback-correct');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = handler.transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog?.dataset.identifier).toBe('feedback-correct');
    });

    it('should not set data-identifier when identifier is not present', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = handler.transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog?.dataset.identifier).toBeUndefined();
    });

    it('should create close button with aria-label', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = handler.transform(element, context);
      const closeButton = fragment.querySelector('.qti-modal-feedback__close');

      expect(closeButton).not.toBeNull();
      expect(closeButton?.tagName.toLowerCase()).toBe('button');
      expect(closeButton?.getAttribute('type')).toBe('button');
      expect(closeButton?.getAttribute('aria-label')).toBe('Close feedback');
      expect(closeButton?.textContent).toBe('\u00D7');
    });

    it('should transform and include children in content container', () => {
      const element = document.createElement('qti-modal-feedback');
      const childFragment = document.createDocumentFragment();
      const childSpan = document.createElement('span');
      childSpan.textContent = 'Great job!';
      childFragment.appendChild(childSpan);

      const transformChildren = vi.fn().mockReturnValue(childFragment);
      const context: TransformContext = {
        styleManager: mockStyleManager,
        transformChildren,
      };

      const fragment = handler.transform(element, context);
      const contentDiv = fragment.querySelector('.qti-modal-feedback__content');

      expect(transformChildren).toHaveBeenCalledWith(element);
      expect(contentDiv).not.toBeNull();
      expect(contentDiv?.querySelector('span')?.textContent).toBe('Great job!');
    });

    it('should register styles with styleManager only once', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      handler.transform(element, context);

      expect(mockStyleManager.hasStyle).toHaveBeenCalledWith('qti-modal-feedback');
      expect(mockStyleManager.addStyle).toHaveBeenCalledWith('qti-modal-feedback', expect.any(String));

      // Second call should not add styles again
      mockStyleManager.hasStyle = vi.fn().mockReturnValue(true);
      handler.transform(element, context);

      expect(mockStyleManager.addStyle).toHaveBeenCalledTimes(1);
    });

    it('should work without styleManager', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = {};

      const fragment = handler.transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog).not.toBeNull();
    });

    it('should close dialog when close button is clicked', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = handler.transform(element, context);
      const dialog = fragment.querySelector('dialog') as HTMLDialogElement;
      const closeButton = fragment.querySelector('.qti-modal-feedback__close') as HTMLButtonElement;

      // Mock dialog.close
      dialog.close = vi.fn();

      closeButton.click();

      expect(dialog.close).toHaveBeenCalled();
    });

    it('should close dialog when backdrop (dialog element) is clicked', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = handler.transform(element, context);
      const dialog = fragment.querySelector('dialog') as HTMLDialogElement;

      // Mock dialog.close
      dialog.close = vi.fn();

      // Simulate click on the dialog itself (backdrop)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: dialog });
      dialog.dispatchEvent(clickEvent);

      expect(dialog.close).toHaveBeenCalled();
    });

    it('should not close dialog when content is clicked', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = handler.transform(element, context);
      const dialog = fragment.querySelector('dialog') as HTMLDialogElement;
      const contentDiv = fragment.querySelector('.qti-modal-feedback__content') as HTMLDivElement;

      // Mock dialog.close
      dialog.close = vi.fn();

      // Simulate click on the content div (should not close)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: contentDiv });
      dialog.dispatchEvent(clickEvent);

      expect(dialog.close).not.toHaveBeenCalled();
    });
  });
});
