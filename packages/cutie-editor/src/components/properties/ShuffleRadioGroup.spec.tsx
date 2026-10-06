import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ShuffleRadioGroup, getShuffleValue, setShuffleValue } from './ShuffleRadioGroup.js';
import type { ElementAttributes } from '../../types.js';

// Tell React this environment supports act()
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('getShuffleValue', () => {
  it('reads "true" and "false" verbatim', () => {
    expect(getShuffleValue({ shuffle: 'true' })).toBe('true');
    expect(getShuffleValue({ shuffle: 'false' })).toBe('false');
  });

  it('treats a missing attribute as unspecified', () => {
    expect(getShuffleValue({})).toBe('unspecified');
  });

  it('treats unrecognized values as unspecified', () => {
    expect(getShuffleValue({ shuffle: 'yes' })).toBe('unspecified');
    expect(getShuffleValue({ shuffle: '' })).toBe('unspecified');
  });
});

describe('setShuffleValue', () => {
  it('writes "true" and "false" to the attribute', () => {
    expect(setShuffleValue({ id: 'a' }, 'true')).toEqual({ id: 'a', shuffle: 'true' });
    expect(setShuffleValue({ id: 'a', shuffle: 'true' }, 'false')).toEqual({ id: 'a', shuffle: 'false' });
  });

  it('removes the attribute when unspecified', () => {
    const result = setShuffleValue({ id: 'a', shuffle: 'false' }, 'unspecified');
    expect(result).toEqual({ id: 'a' });
    expect('shuffle' in result).toBe(false);
  });

  it('does not mutate the input', () => {
    const attrs = { shuffle: 'true' };
    setShuffleValue(attrs, 'unspecified');
    expect(attrs).toEqual({ shuffle: 'true' });
  });
});

describe('ShuffleRadioGroup', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (attributes: ElementAttributes, onChange = vi.fn()) => {
    act(() => {
      root.render(<ShuffleRadioGroup attributes={attributes} onChange={onChange} />);
    });
    return onChange;
  };

  const radios = () => Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  const radioByLabel = (label: string) => {
    const option = Array.from(container.querySelectorAll('label.radio-option'))
      .find(el => el.textContent === label);
    return option?.querySelector<HTMLInputElement>('input[type="radio"]') ?? null;
  };

  it('renders a labelled fieldset with Yes / No / Unspecified options sharing one name', () => {
    render({});
    expect(container.querySelector('fieldset legend')?.textContent).toBe('Shuffle choices');
    const inputs = radios();
    expect(inputs.map(i => i.closest('label')?.textContent)).toEqual(['Yes', 'No', 'Unspecified']);
    expect(new Set(inputs.map(i => i.name)).size).toBe(1);
    expect(inputs[0].name).not.toBe('');
  });

  it.each([
    [{ shuffle: 'true' }, 'Yes'],
    [{ shuffle: 'false' }, 'No'],
    [{}, 'Unspecified'],
    [{ shuffle: 'bogus' }, 'Unspecified'],
  ])('checks the option matching %j', (attributes, expected) => {
    render(attributes);
    expect(radios().filter(i => i.checked).map(i => i.closest('label')?.textContent)).toEqual([expected]);
  });

  it('writes shuffle="true" when Yes is selected', () => {
    const onChange = render({ 'response-identifier': 'R' });
    act(() => radioByLabel('Yes')?.click());
    expect(onChange).toHaveBeenCalledWith({ 'response-identifier': 'R', shuffle: 'true' });
  });

  it('writes shuffle="false" when No is selected', () => {
    const onChange = render({ 'response-identifier': 'R', shuffle: 'true' });
    act(() => radioByLabel('No')?.click());
    expect(onChange).toHaveBeenCalledWith({ 'response-identifier': 'R', shuffle: 'false' });
  });

  it('removes the attribute when Unspecified is selected', () => {
    const onChange = render({ 'response-identifier': 'R', shuffle: 'false' });
    act(() => radioByLabel('Unspecified')?.click());
    expect(onChange).toHaveBeenCalledWith({ 'response-identifier': 'R' });
  });

  it('gives separate instances distinct radio group names', () => {
    act(() => {
      root.render(
        <>
          <ShuffleRadioGroup attributes={{}} onChange={vi.fn()} />
          <ShuffleRadioGroup attributes={{}} onChange={vi.fn()} />
        </>
      );
    });
    expect(new Set(radios().map(i => i.name)).size).toBe(2);
  });
});
