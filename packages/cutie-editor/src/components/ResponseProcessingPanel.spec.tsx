import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ResponseProcessingPanel } from './ResponseProcessingPanel.js';
import type { ResponseProcessingConfig, ResponseProcessingSettings } from '../types.js';

// Tell React this environment supports act()
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('ResponseProcessingPanel sumScores settings', () => {
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

  /**
   * Render the panel, applying settings changes to the config as the editor does
   */
  const render = (initial: ResponseProcessingConfig, calculatedMaximumScore: number | null = 2) => {
    let config = initial;
    const onSettingsChange = vi.fn((settings: ResponseProcessingSettings) => {
      config = { ...config, ...settings };
      draw();
    });
    const draw = () => {
      act(() => {
        root.render(
          <ResponseProcessingPanel
            config={config}
            interactionCount={1}
            hasFeedbackElements={false}
            onModeChange={vi.fn()}
            onSettingsChange={onSettingsChange}
            calculatedMaximumScore={calculatedMaximumScore}
          />
        );
      });
    };
    draw();
    return { onSettingsChange, config: () => config };
  };

  const input = (label: string) => {
    const labelElement = Array.from(container.querySelectorAll('label')).find((el) => el.textContent === label)!;
    return document.getElementById(labelElement.htmlFor) as HTMLInputElement;
  };

  /** Type text into an input one keystroke at a time, replacing what's there */
  const type = (element: HTMLInputElement, text: string) => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    for (let length = 0; length <= text.length; length++) {
      act(() => {
        setValue.call(element, text.slice(0, length));
        element.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
  };
  const blur = (element: HTMLInputElement) => {
    act(() => {
      element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });
  };

  it('keeps a minus sign typed over an existing value', () => {
    const { config } = render({ mode: 'sumScores', scoreOffset: -1.5 });

    type(input('Score Offset'), '-2');
    expect(input('Score Offset').value).toBe('-2');
    blur(input('Score Offset'));

    expect(config().scoreOffset).toBe(-2);
  });

  it('saves a number once the field loses focus or Enter is pressed', () => {
    const { config, onSettingsChange } = render({ mode: 'sumScores' });

    type(input('Maximum Score'), '1e2');
    expect(onSettingsChange).not.toHaveBeenCalled();
    act(() => {
      input('Maximum Score').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(config().maximumScore).toBe(100);
    expect(input('Maximum Score').value).toBe('100');
  });

  it('flags text that is not a decimal number, and reverts it', () => {
    const { config } = render({ mode: 'sumScores', maximumScore: 3 });

    type(input('Maximum Score'), '0x10');
    expect(input('Maximum Score').getAttribute('aria-invalid')).toBe('true');
    blur(input('Maximum Score'));

    expect(config().maximumScore).toBe(3);
    expect(input('Maximum Score').value).toBe('3');
  });

  it('rejects a negative maximum score', () => {
    const { config } = render({ mode: 'sumScores', maximumScore: 3 });

    type(input('Maximum Score'), '-1');
    expect(input('Maximum Score').getAttribute('aria-invalid')).toBe('true');
    blur(input('Maximum Score'));

    expect(config().maximumScore).toBe(3);
  });

  it('clears the setting when the field is emptied', () => {
    const { config } = render({ mode: 'sumScores', maximumScore: 3 });

    type(input('Maximum Score'), '');
    blur(input('Maximum Score'));

    expect(config().maximumScore).toBeUndefined();
  });

  it('shows the calculated maximum score, and warns when there is none', () => {
    render({ mode: 'sumScores' }, null);
    expect(input('Maximum Score').placeholder).toBe('Unknown');
    expect(container.querySelector('.scoring-warning')?.textContent).toContain("can't be calculated");

    render({ mode: 'sumScores' }, 2);
    expect(input('Maximum Score').placeholder).toBe('2 (calculated)');
    expect(container.querySelector('.scoring-warning')).toBeNull();
  });
});
