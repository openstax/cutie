import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemStateImpl } from '../../../state/itemState';
import { registry } from '../../registry';
import type { TransformContext } from '../../types';

// Mock Quill with a minimal functional mock
interface MockQuillInstance {
  root: HTMLDivElement;
  clipboard: { dangerouslyPasteHTML: ReturnType<typeof vi.fn> };
  on: ReturnType<typeof vi.fn>;
  enable: ReturnType<typeof vi.fn>;
  textChangeCallbacks: (() => void)[];
}

let mockQuillInstance: MockQuillInstance;

function createMockQuillInstance(container: HTMLElement): MockQuillInstance {
  const root = document.createElement('div');
  root.className = 'ql-editor';
  root.setAttribute('contenteditable', 'true');
  root.innerHTML = '<p><br></p>';
  container.appendChild(root);

  const instance: MockQuillInstance = {
    root,
    clipboard: {
      dangerouslyPasteHTML: vi.fn(),
    },
    on: vi.fn(),
    enable: vi.fn(),
    textChangeCallbacks: [],
  };

  // Wire up implementations that reference the instance
  instance.clipboard.dangerouslyPasteHTML.mockImplementation((html: string) => {
    root.innerHTML = html;
  });
  instance.on.mockImplementation((event: string, callback: () => void) => {
    if (event === 'text-change') {
      instance.textChangeCallbacks.push(callback);
    }
  });

  return instance;
}

vi.mock('./quillLoader', () => ({
  loadQuill: () => Promise.resolve({
    default: class MockQuill {
      constructor(container: HTMLElement) {
        mockQuillInstance = createMockQuillInstance(container);
        return mockQuillInstance;
      }
    },
  }),
}));

// Side-effect import to register the handler
import './richText';

function createQtiDocument(interactionHtml: string): Document {
  const html = `
    <html>
      <body>
        <qti-item-body>${interactionHtml}</qti-item-body>
      </body>
    </html>
  `;
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

function transformInteraction(
  doc: Document,
  itemState: ItemStateImpl,
): DocumentFragment {
  const interaction = doc.querySelector('qti-extended-text-interaction')!;

  const context: TransformContext = {
    itemState,
    transformChildren: (el: Element) => {
      const frag = document.createDocumentFragment();
      for (const child of Array.from(el.childNodes)) {
        frag.appendChild(child.cloneNode(true));
      }
      return frag;
    },
  };

  const handler = registry.getAll().find((r) => r.handler.canHandle(interaction));
  return handler!.handler.transform(interaction, context);
}

/** Simulate a text-change event from Quill */
function simulateTextChange(): void {
  for (const cb of mockQuillInstance.textChangeCallbacks) {
    cb();
  }
}

/** Wait for async Quill loading to settle */
async function waitForQuill(): Promise<void> {
  await vi.waitFor(() => {}, { timeout: 50 });
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('richTextInteraction', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
    // Clean up any injected link tags
    document.getElementById('cutie-quill-snow-css')?.remove();
  });

  describe('canHandle', () => {
    it('handles when format="xhtml"', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const interaction = doc.querySelector('qti-extended-text-interaction')!;
      const handler = registry.getAll().find((r) => r.name === 'rich-text-interaction');
      expect(handler!.handler.canHandle(interaction)).toBe(true);
    });

    it('does not handle when format is absent', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const interaction = doc.querySelector('qti-extended-text-interaction')!;
      const handler = registry.getAll().find((r) => r.name === 'rich-text-interaction');
      expect(handler!.handler.canHandle(interaction)).toBe(false);
    });

    it('does not handle when format="plain"', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="plain">
        </qti-extended-text-interaction>
      `);

      const interaction = doc.querySelector('qti-extended-text-interaction')!;
      const handler = registry.getAll().find((r) => r.name === 'rich-text-interaction');
      expect(handler!.handler.canHandle(interaction)).toBe(false);
    });
  });

  describe('missing response-identifier', () => {
    it('renders error element when response-identifier is absent', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction format="xhtml">
        </qti-extended-text-interaction>
      `);

      const interaction = doc.querySelector('qti-extended-text-interaction')!;
      const handler = registry.getAll().find((r) => r.name === 'rich-text-interaction');
      const context: TransformContext = {
        itemState,
        transformChildren: (el: Element) => {
          const frag = document.createDocumentFragment();
          for (const child of Array.from(el.childNodes)) {
            frag.appendChild(child.cloneNode(true));
          }
          return frag;
        },
      };

      const fragment = handler!.handler.transform(interaction, context);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
    });
  });

  describe('prompt rendering', () => {
    it('renders prompt div with correct id', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
          <qti-prompt>Write a rich text answer</qti-prompt>
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const promptDiv = container.querySelector('.cutie-prompt')!;
      expect(promptDiv).not.toBeNull();
      expect(promptDiv.id).toBe('prompt-R1');
      expect(promptDiv.textContent).toContain('Write a rich text answer');
    });

    it('sets aria-labelledby on Quill editor root', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
          <qti-prompt>Write a rich text answer</qti-prompt>
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      expect(mockQuillInstance.root.getAttribute('aria-labelledby')).toBe('prompt-R1');
    });

    it('sets aria-label fallback when no prompt is present', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      expect(mockQuillInstance.root.getAttribute('aria-label')).toBe('Rich text response input');
    });
  });

  describe('constraint text', () => {
    it('does not render constraint text when min-strings is absent', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      expect(container.querySelector('.cutie-constraint-text')).toBeNull();
    });

    it('renders constraint text when min-strings="1"', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Enter a response.');
    });

    it('sets aria-describedby on Quill root linking to constraint', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(mockQuillInstance.root.getAttribute('aria-describedby')).toContain(constraintEl.id);
    });
  });

  describe('empty detection', () => {
    it('treats empty initial state as empty', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // currentHtml starts as empty string, so response should be null
      const result = itemState.collectAll();
      expect(result.responses).toEqual({ R1: null });
    });

    it('returns HTML string for non-empty content', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      // Simulate text-change event
      mockQuillInstance.root.innerHTML = '<p>Hello world</p>';
      simulateTextChange();

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ R1: '<p>Hello world</p>' });
    });
  });

  describe('default value', () => {
    it('loads default value via dangerouslyPasteHTML', async () => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="R1" cardinality="single" base-type="string">
          <qti-default-value>
            <qti-value>&lt;p&gt;Pre-filled content&lt;/p&gt;</qti-value>
          </qti-default-value>
        </qti-response-declaration>
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      expect(mockQuillInstance.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(
        '<p>Pre-filled content</p>'
      );
    });
  });

  describe('disabled state', () => {
    it('disables Quill when interactionsEnabled is false', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      itemState.setInteractionsEnabled(false);
      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      expect(mockQuillInstance.enable).toHaveBeenCalledWith(false);
      expect(container.querySelector('.cutie-rich-text-disabled')).not.toBeNull();
    });

    it('toggles disabled state via observer', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      // Initially enabled
      expect(mockQuillInstance.enable).toHaveBeenCalledWith(true);

      // Disable
      itemState.setInteractionsEnabled(false);
      expect(mockQuillInstance.enable).toHaveBeenCalledWith(false);
      expect(container.querySelector('.cutie-rich-text-disabled')).not.toBeNull();

      // Re-enable
      itemState.setInteractionsEnabled(true);
      expect(mockQuillInstance.enable).toHaveBeenCalledWith(true);
      expect(container.querySelector('.cutie-rich-text-disabled')).toBeNull();
    });
  });

  describe('height-lines class forwarding', () => {
    it('forwards qti-height-lines-3 class to container', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml" class="qti-height-lines-3">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interactionDiv = container.querySelector('.cutie-rich-text-interaction')!;
      expect(interactionDiv.classList.contains('qti-height-lines-3')).toBe(true);
    });
  });

  describe('accessor validation', () => {
    it('returns valid:true when min-strings is absent', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ R1: null });
    });

    it('returns valid:false when min-strings constraint is not met', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);
    });

    it('sets error class on constraint text when invalid', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      itemState.collectAll();

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
    });

    it('clears error state when response becomes valid', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      // First: invalid (empty)
      itemState.collectAll();
      expect(mockQuillInstance.root.getAttribute('aria-invalid')).toBe('true');

      // Simulate typing
      mockQuillInstance.root.innerHTML = '<p>Some response</p>';
      simulateTextChange();

      // Second: valid (has content)
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(mockQuillInstance.root.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('character counter', () => {
    it('does not render counter when expected-length is absent', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      expect(container.querySelector('.cutie-character-counter')).toBeNull();
    });

    it('does not render counter when no counter class', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml" expected-length="200">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      expect(container.querySelector('.cutie-character-counter')).toBeNull();
    });

    it('counter-up renders initial state', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml"
          expected-length="200" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter).not.toBeNull();
      expect(counter.textContent).toBe('0 / 200 suggested characters');
    });

    it('counter updates on Quill text-change', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml"
          expected-length="200" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      mockQuillInstance.root.innerHTML = '<p>Hello</p>';
      simulateTextChange();

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.textContent).toBe('5 / 200 suggested characters');
    });

    it('counter-down shows over-limit state', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml"
          expected-length="5" class="qti-counter-down">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      mockQuillInstance.root.innerHTML = '<p>Hello world</p>';
      simulateTextChange();

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.textContent).toBe('6 characters over suggested size');
      expect(counter.classList.contains('cutie-counter-over')).toBe(true);
    });
  });

  describe('Quill CSS injection', () => {
    it('injects Quill snow CSS link tag', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" format="xhtml">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForQuill();

      const link = document.getElementById('cutie-quill-snow-css') as HTMLLinkElement;
      expect(link).not.toBeNull();
      expect(link.rel).toBe('stylesheet');
    });
  });
});
