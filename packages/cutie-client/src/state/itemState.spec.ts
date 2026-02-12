import { describe, expect, it } from 'vitest';
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
