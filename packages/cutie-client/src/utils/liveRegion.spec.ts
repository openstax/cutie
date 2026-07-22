import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransformContext } from '../transformer/types';
import { announce, createForcedTextSetter } from './liveRegion';

describe('createForcedTextSetter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies new text synchronously', () => {
    const node = document.createElement('div');
    const setText = createForcedTextSetter(node);

    setText('Hello');
    expect(node.textContent).toBe('Hello');
  });

  it('forces a clear/restore cycle when the same text is set twice in a row', () => {
    const node = document.createElement('div');
    const setText = createForcedTextSetter(node);

    setText('Hello');
    setText('Hello');
    expect(node.textContent).toBe('Hello');

    vi.advanceTimersToNextTimer();
    expect(node.textContent).toBe('');

    vi.advanceTimersToNextTimer();
    expect(node.textContent).toBe('Hello');
  });

  it('does not schedule a clear/restore cycle when the text changes', () => {
    const node = document.createElement('div');
    const setText = createForcedTextSetter(node);

    setText('Hello');
    setText('World');
    expect(node.textContent).toBe('World');

    vi.advanceTimersByTime(1000);
    expect(node.textContent).toBe('World');
  });

  it('picks up the node\'s existing text as the initial baseline', () => {
    const node = document.createElement('div');
    node.textContent = 'Hello';
    const setText = createForcedTextSetter(node);

    setText('Hello');
    vi.advanceTimersToNextTimer();
    expect(node.textContent).toBe('');
    vi.advanceTimersToNextTimer();
    expect(node.textContent).toBe('Hello');
  });
});

describe('announce', () => {
  let cleanupFns: Array<() => void>;
  let ctx: TransformContext;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'setTimeout', 'clearTimeout'] });
    cleanupFns = [];
    ctx = {
      transformChildren: () => document.createDocumentFragment(),
      onCleanup: (callback: () => void) => cleanupFns.push(callback),
    };
  });

  afterEach(() => {
    cleanupFns.forEach((fn) => fn());
    vi.useRealTimers();
  });

  function region(urgency: 'polite' | 'assertive'): HTMLElement {
    return document.body.querySelector(`div[aria-live="${urgency}"]`)!;
  }

  it('flushes an announced message into the shared live region', async () => {
    announce(ctx, 'Hello');
    await Promise.resolve();

    expect(region('polite').textContent).toBe('Hello');
  });

  it('batches messages announced within the same microtask', async () => {
    announce(ctx, 'A');
    announce(ctx, 'B');
    await Promise.resolve();

    expect(region('polite').textContent).toBe('A B');
  });

  it('re-announces an identical message via a clear/restore cycle', async () => {
    announce(ctx, '2 problems with submission.');
    await Promise.resolve();
    expect(region('polite').textContent).toBe('2 problems with submission.');

    announce(ctx, '2 problems with submission.');
    await Promise.resolve();
    expect(region('polite').textContent).toBe('2 problems with submission.');

    vi.advanceTimersToNextTimer();
    expect(region('polite').textContent).toBe('');

    vi.advanceTimersToNextTimer();
    expect(region('polite').textContent).toBe('2 problems with submission.');
  });

  it('does not schedule a clear/restore cycle when the message changes', async () => {
    announce(ctx, '2 problems with submission.');
    await Promise.resolve();
    announce(ctx, '1 problem with submission.');
    await Promise.resolve();

    expect(region('polite').textContent).toBe('1 problem with submission.');
    vi.advanceTimersByTime(1000);
    expect(region('polite').textContent).toBe('1 problem with submission.');
  });

  it('keeps polite and assertive messages in separate regions', async () => {
    announce(ctx, 'polite message', 'polite');
    announce(ctx, 'assertive message', 'assertive');
    await Promise.resolve();

    expect(region('polite').textContent).toBe('polite message');
    expect(region('assertive').textContent).toBe('assertive message');
  });
});
