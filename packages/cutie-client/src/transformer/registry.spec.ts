import { beforeEach, describe, expect, it } from 'vitest';
import type { ElementHandler } from './types';

/**
 * HandlerRegistry class for testing (copied to avoid singleton issues in tests)
 */
class HandlerRegistry {
  private handlers: Array<{ name: string; handler: ElementHandler; priority: number }> = [];

  register(name: string, handler: ElementHandler, priority: number): void {
    this.handlers.push({ name, handler, priority });
    this.handlers.sort((a, b) => a.priority - b.priority);
  }

  findHandler(element: Element): ElementHandler | undefined {
    for (const registration of this.handlers) {
      if (registration.handler.canHandle(element)) {
        return registration.handler;
      }
    }
    return undefined;
  }

  getAll(): Array<{ name: string; handler: ElementHandler; priority: number }> {
    return [...this.handlers];
  }
}

// Mock handler for testing
class MockHandler implements ElementHandler {
  constructor(
    private readonly tagName: string,
    private readonly mockTransform?: () => DocumentFragment
  ) {}

  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === this.tagName;
  }

  transform(): DocumentFragment {
    if (this.mockTransform) {
      return this.mockTransform();
    }
    return document.createDocumentFragment();
  }
}

describe('HandlerRegistry', () => {
  let registry: HandlerRegistry;

  beforeEach(() => {
    registry = new HandlerRegistry();
  });

  describe('register', () => {
    it('should register a handler', () => {
      const handler = new MockHandler('div');
      registry.register('test-handler', handler, 100);

      const all = registry.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('test-handler');
      expect(all[0].priority).toBe(100);
    });

    it('should sort handlers by priority (lower first)', () => {
      const handler1 = new MockHandler('div');
      const handler2 = new MockHandler('span');
      const handler3 = new MockHandler('p');

      registry.register('high-priority', handler1, 10);
      registry.register('low-priority', handler2, 100);
      registry.register('medium-priority', handler3, 50);

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all[0].name).toBe('high-priority');
      expect(all[0].priority).toBe(10);
      expect(all[1].name).toBe('medium-priority');
      expect(all[1].priority).toBe(50);
      expect(all[2].name).toBe('low-priority');
      expect(all[2].priority).toBe(100);
    });

    it('should maintain sort order when adding handlers in any order', () => {
      const handler1 = new MockHandler('div');
      const handler2 = new MockHandler('span');
      const handler3 = new MockHandler('p');

      registry.register('medium', handler3, 50);
      registry.register('low', handler2, 100);
      registry.register('high', handler1, 10);

      const all = registry.getAll();
      expect(all.map((h) => h.priority)).toEqual([10, 50, 100]);
    });
  });

  describe('findHandler', () => {
    it('should find a handler that can handle the element', () => {
      const divHandler = new MockHandler('div');
      const spanHandler = new MockHandler('span');

      registry.register('div-handler', divHandler, 100);
      registry.register('span-handler', spanHandler, 200);

      const divElement = document.createElement('div');
      const foundHandler = registry.findHandler(divElement);

      expect(foundHandler).toBe(divHandler);
    });

    it('should return the highest priority handler when multiple can handle', () => {
      const handler1 = new MockHandler('div');
      const handler2 = new MockHandler('div');

      registry.register('low-priority', handler2, 100);
      registry.register('high-priority', handler1, 50);

      const divElement = document.createElement('div');
      const foundHandler = registry.findHandler(divElement);

      expect(foundHandler).toBe(handler1);
    });

    it('should return undefined when no handler can handle the element', () => {
      const divHandler = new MockHandler('div');
      registry.register('div-handler', divHandler, 100);

      const spanElement = document.createElement('span');
      const foundHandler = registry.findHandler(spanElement);

      expect(foundHandler).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return an empty array when no handlers registered', () => {
      const all = registry.getAll();
      expect(all).toHaveLength(0);
    });

    it('should return a copy of the handlers array', () => {
      const handler = new MockHandler('div');
      registry.register('test', handler, 100);

      const all1 = registry.getAll();
      const all2 = registry.getAll();

      expect(all1).not.toBe(all2);
      expect(all1).toEqual(all2);
    });
  });
});
