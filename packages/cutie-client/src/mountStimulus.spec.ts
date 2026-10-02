import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type MountedStimulus, mountStimulus } from './mountStimulus';

function stimulusXml(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-stimulus xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="Stimulus1" title="Night">
  <qti-stimulus-body>${body}</qti-stimulus-body>
</qti-assessment-stimulus>`;
}

describe('mountStimulus', () => {
  let container: HTMLElement;
  let mounted: MountedStimulus | null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mounted = null;
  });

  afterEach(() => {
    mounted?.unmount();
    container.remove();
  });

  it('renders the stimulus body', () => {
    mounted = mountStimulus(
      container,
      stimulusXml('<div class="qti-shared-stimulus-wrapper"><p>It was a night.</p><img src="door.png" alt="A door"/></div>')
    );

    expect(container.classList.contains('cutie-item-container')).toBe(true);
    expect(container.querySelector('p')?.textContent).toBe('It was a night.');
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('A door');
    expect(container.querySelector('qti-stimulus-body')).toBeNull();
  });

  it('applies theme options as CSS custom properties', () => {
    mounted = mountStimulus(container, stimulusXml('<p>Text</p>'), { textColor: '#111' });
    expect(container.style.getPropertyValue('--cutie-text')).toBe('#111');
  });

  it('re-renders on update()', () => {
    mounted = mountStimulus(container, stimulusXml('<p>First</p>'));
    mounted.update(stimulusXml('<p>Second</p>'));
    expect(container.textContent).toContain('Second');
    expect(container.textContent).not.toContain('First');
  });

  it('clears the container and theme on unmount()', () => {
    mounted = mountStimulus(container, stimulusXml('<p>Text</p>'), { textColor: '#111' });
    mounted.unmount();
    mounted = null;

    expect(container.innerHTML).toBe('');
    expect(container.classList.contains('cutie-item-container')).toBe(false);
    expect(container.style.getPropertyValue('--cutie-text')).toBe('');
  });

  it('throws on XML without a stimulus body, leaving the container untouched', () => {
    expect(() =>
      mountStimulus(container, '<qti-assessment-stimulus identifier="S"/>', { textColor: '#111' })
    ).toThrow('qti-stimulus-body');
    expect(container.innerHTML).toBe('');
    expect(container.style.getPropertyValue('--cutie-text')).toBe('');
  });
});
