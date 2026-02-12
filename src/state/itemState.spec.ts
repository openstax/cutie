import { describe, expect, it } from 'vitest';
import { ItemStateImpl } from './itemState';

describe('ItemStateImpl.collectAll', () => {
  it('returns response data when all accessors are valid', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: 'A', valid: true }));
    state.registerResponse('R2', () => ({ value: ['B', 'C'], valid: true }));

    const result = state.collectAll();
    expect(result).toEqual({ R1: 'A', R2: ['B', 'C'] });
  });

  it('returns undefined when any accessor is invalid', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: 'A', valid: true }));
    state.registerResponse('R2', () => ({ value: null, valid: false }));

    const result = state.collectAll();
    expect(result).toBeUndefined();
  });

  it('adds role="alert" only to first invalid errorElement', () => {
    const errorEl1 = document.createElement('div');
    const errorEl2 = document.createElement('div');

    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({
      value: null,
      valid: false,
      errorElement: errorEl1,
    }));
    state.registerResponse('R2', () => ({
      value: null,
      valid: false,
      errorElement: errorEl2,
    }));

    state.collectAll();

    expect(errorEl1.getAttribute('role')).toBe('alert');
    expect(errorEl2.hasAttribute('role')).toBe(false);
  });

  it('cleans up previous alert role on subsequent successful collect', () => {
    const errorEl = document.createElement('div');
    let isValid = false;

    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({
      value: isValid ? 'A' : null,
      valid: isValid,
      errorElement: errorEl,
    }));

    // First call: invalid
    state.collectAll();
    expect(errorEl.getAttribute('role')).toBe('alert');

    // Second call: valid
    isValid = true;
    const result = state.collectAll();
    expect(result).toEqual({ R1: 'A' });
    expect(errorEl.hasAttribute('role')).toBe(false);
  });

  it('cleans up previous alert role on subsequent invalid collect', () => {
    const errorEl1 = document.createElement('div');
    const errorEl2 = document.createElement('div');
    let firstInvalid = true;

    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({
      value: null,
      valid: !firstInvalid,
      errorElement: errorEl1,
    }));
    state.registerResponse('R2', () => ({
      value: null,
      valid: false,
      errorElement: errorEl2,
    }));

    // First call: R1 is first invalid
    state.collectAll();
    expect(errorEl1.getAttribute('role')).toBe('alert');

    // Second call: R1 is now valid, R2 is first invalid
    firstInvalid = false;
    state.collectAll();
    expect(errorEl1.hasAttribute('role')).toBe(false);
    expect(errorEl2.getAttribute('role')).toBe('alert');
  });

  it('getResponse returns value from accessor result', () => {
    const state = new ItemStateImpl();
    state.registerResponse('R1', () => ({ value: 'hello', valid: true }));

    expect(state.getResponse('R1')).toBe('hello');
  });
});
