import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registry } from '../../registry';
import type { StyleManager, TransformContext } from '../../types';

// Import the module to trigger handler registration
import './modalFeedback';

describe('ModalFeedbackHandler', () => {
  let mockStyleManager: StyleManager;

  const findHandler = () => {
    const element = document.createElement('qti-modal-feedback');
    return registry.findHandler(element);
  };

  beforeEach(() => {
    mockStyleManager = {
      hasStyle: vi.fn().mockReturnValue(false),
      addStyle: vi.fn(),
    };
  });

  it('should be registered in the handler registry', () => {
    const handler = findHandler();
    expect(handler).not.toBeNull();
  });

  describe('canHandle', () => {
    it('should handle qti-modal-feedback elements via registry', () => {
      const element = document.createElement('qti-modal-feedback');
      const handler = registry.findHandler(element);
      expect(handler).not.toBeNull();
    });

    it('should not handle other elements', () => {
      const div = document.createElement('div');

      expect(registry.findHandler(div)).toBeUndefined();
    });
  });

  describe('transform', () => {
    const transform = (element: Element, context: TransformContext) => {
      const handler = findHandler()!;
      return handler.transform(element, context);
    };

    it('should transform qti-modal-feedback to dialog element with correct class', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog).not.toBeNull();
      expect(dialog?.className).toBe('qti-modal-feedback');
    });

    it('should preserve identifier as data-identifier attribute', () => {
      const element = document.createElement('qti-modal-feedback');
      element.setAttribute('identifier', 'feedback-correct');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog?.dataset.identifier).toBe('feedback-correct');
    });

    it('should not set data-identifier when identifier is not present', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog?.dataset.identifier).toBeUndefined();
    });

    it('should preserve data-feedback-type attribute', () => {
      const element = document.createElement('qti-modal-feedback');
      element.setAttribute('data-feedback-type', 'correct');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog?.dataset.feedbackType).toBe('correct');
    });

    it('should create icon header for valid feedback types', () => {
      const element = document.createElement('qti-modal-feedback');
      element.setAttribute('data-feedback-type', 'correct');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = transform(element, context);
      const header = fragment.querySelector('.qti-modal-feedback__header');

      expect(header).not.toBeNull();
    });

    it('should create close button in a form with method=dialog', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = transform(element, context);
      const form = fragment.querySelector('.qti-modal-feedback__form') as HTMLFormElement;
      const closeButton = fragment.querySelector('.qti-modal-feedback__close-button');

      expect(form).not.toBeNull();
      expect(form?.method).toBe('dialog');
      expect(closeButton).not.toBeNull();
      expect(closeButton?.tagName.toLowerCase()).toBe('button');
      expect(closeButton?.textContent).toBe('OK');
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

      const fragment = transform(element, context);
      const contentDiv = fragment.querySelector('.qti-modal-feedback__content');

      expect(transformChildren).toHaveBeenCalledWith(element);
      expect(contentDiv).not.toBeNull();
      expect(contentDiv?.querySelector('span')?.textContent).toBe('Great job!');
    });

    it('should register styles with styleManager only once', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      transform(element, context);

      expect(mockStyleManager.hasStyle).toHaveBeenCalledWith('qti-modal-feedback');
      expect(mockStyleManager.addStyle).toHaveBeenCalledWith('qti-modal-feedback', expect.any(String));

      // Second call should not add styles again
      mockStyleManager.hasStyle = vi.fn().mockReturnValue(true);
      transform(element, context);

      expect(mockStyleManager.addStyle).toHaveBeenCalledTimes(2); // Once for feedback, once for icons on first call
    });

    it('should work without styleManager', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = {};

      const fragment = transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog).not.toBeNull();
    });

    it('should register onMount callback that calls showModal()', () => {
      const element = document.createElement('qti-modal-feedback');
      const onMount = vi.fn();
      const context: TransformContext = { styleManager: mockStyleManager, onMount };

      const fragment = transform(element, context);
      const dialog = fragment.querySelector('dialog') as HTMLDialogElement;

      expect(onMount).toHaveBeenCalledTimes(1);

      // Get the registered callback and invoke it
      const mountCallback = onMount.mock.calls[0][0] as () => void;

      // Mock showModal since jsdom doesn't fully support it
      dialog.showModal = vi.fn();

      // Simulate mounting: append to DOM then call the callback
      document.body.appendChild(dialog);
      mountCallback();

      expect(dialog.showModal).toHaveBeenCalled();

      // Cleanup
      dialog.remove();
    });

    it('should not open dialog directly (no dialog.open = true)', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      const fragment = transform(element, context);
      const dialog = fragment.querySelector('dialog') as HTMLDialogElement;

      expect(dialog.open).toBe(false);
    });

    it('should work gracefully when onMount is not provided', () => {
      const element = document.createElement('qti-modal-feedback');
      const context: TransformContext = { styleManager: mockStyleManager };

      // Should not throw
      const fragment = transform(element, context);
      const dialog = fragment.querySelector('dialog');

      expect(dialog).not.toBeNull();
      expect(dialog?.open).toBe(false);
    });
  });
});
