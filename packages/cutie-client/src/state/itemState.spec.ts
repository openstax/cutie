import { describe, expect, it, vi } from 'vitest';
import { ItemStateImpl } from './itemState';

describe('ItemStateImpl.collectAll', () => {
  it('returns valid result with response data when all accessors are valid', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: 'A', valid: true }));
    state.registerResponse('R2', () => ({ value: ['B', 'C'], valid: true }));

    const result = state.collectAll();
    expect(result).toEqual({
      responses: { R1: 'A', R2: ['B', 'C'] },
      valid: true,
      invalidCount: 0,
    });
  });

  it('returns invalid result with invalidCount when any accessor is invalid', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: 'A', valid: true }));
    state.registerResponse('R2', () => ({ value: null, valid: false }));

    const result = state.collectAll();
    expect(result.valid).toBe(false);
    expect(result.invalidCount).toBe(1);
    expect(result.responses).toEqual({ R1: 'A', R2: null });
  });

  it('counts all invalid accessors in invalidCount', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: null, valid: false }));
    state.registerResponse('R2', () => ({ value: null, valid: false }));
    state.registerResponse('R3', () => ({ value: 'ok', valid: true }));

    const result = state.collectAll();
    expect(result.valid).toBe(false);
    expect(result.invalidCount).toBe(2);
  });

  it('always includes all responses regardless of validity', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: 'A', valid: true }));
    state.registerResponse('R2', () => ({ value: null, valid: false }));

    const result = state.collectAll();
    expect(result.responses).toEqual({ R1: 'A', R2: null });
  });

  it('getResponse returns value from accessor result', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: 'hello', valid: true }));

    expect(state.getResponse('R1')).toBe('hello');
  });
});

describe('ItemStateImpl response change reporting', () => {
  it('peekAll reads every value with silent accessors, ignoring validity', () => {
    const state = new ItemStateImpl();
    const accessor = vi.fn(() => ({ value: 'partial', valid: false }));
    state.registerResponse('R1', accessor);

    expect(state.peekAll()).toEqual({ R1: 'partial' });
    expect(accessor).toHaveBeenCalledWith({ silent: true });
  });

  it('collectAll calls accessors in reporting (non-silent) mode', () => {
    const state = new ItemStateImpl();
    const accessor = vi.fn(() => ({ value: 'A', valid: true }));
    state.registerResponse('R1', accessor);

    state.collectAll();
    expect(accessor).toHaveBeenCalledWith();
  });

  it('notifyResponseChange invokes the listener with current raw values', () => {
    const onResponseChange = vi.fn();
    const state = new ItemStateImpl(undefined, { onResponseChange });
    state.registerResponse('R1', () => ({ value: null, valid: false }));
    state.registerResponse('R2', () => ({ value: ['B'], valid: true }));

    state.notifyResponseChange('R2');
    expect(onResponseChange).toHaveBeenCalledWith({ R1: null, R2: ['B'] });
  });

  it('notifyResponseChange invokes the edit listeners of that response only', () => {
    const state = new ItemStateImpl();
    const r1 = vi.fn();
    const r2 = vi.fn();
    state.onResponseEdit('R1', r1);
    state.onResponseEdit('R2', r2);

    state.notifyResponseChange('R1');
    expect(r1).toHaveBeenCalledTimes(1);
    expect(r2).not.toHaveBeenCalled();
  });

  it('notifyResponseChange is a no-op without a listener', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: 'A', valid: true }));
    expect(() => state.notifyResponseChange('R1')).not.toThrow();
  });

  it('setInteractionsEnabled does not report a response change', () => {
    const onResponseChange = vi.fn();
    const state = new ItemStateImpl(undefined, { onResponseChange });
    state.setInteractionsEnabled(false);
    expect(onResponseChange).not.toHaveBeenCalled();
  });
});
