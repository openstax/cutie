/* spell-checker: ignore tablist tabpanel */
import { describe, expect, it } from 'vitest';
import { parseQtiXml } from '../../parser/xmlParser.js';
import { createTransformContext, transformChildren } from '../elementTransformer.js';

function render(bodyXml: string, state = new Map<string, unknown>()): HTMLElement {
  const xml = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    identifier="item" title="Item" adaptive="false" time-dependent="false">
    <qti-item-body>${bodyXml}</qti-item-body>
  </qti-assessment-item>`;
  const { itemBody } = parseQtiXml(xml);
  const container = document.createElement('div');
  container.appendChild(transformChildren(itemBody, createTransformContext({ state })));
  document.body.replaceChildren(container);
  return container;
}

const RECORD = `
  <div class="cutie-tab-container" id="record">
    <h3>Nurses' <em>Notes</em></h3>
    <h4>0800</h4>
    <p>Client admitted.</p>
    <h4>0900</h4>
    <p>Client lethargic.</p>
    <h3>Vital Signs</h3>
    <table><tr><th>BP</th><td>100/68</td></tr></table>
    <h3>Laboratory Results</h3>
  </div>`;

function tabs(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
}

function panels(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
}

function press(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('tabContainer', () => {
  it('splits content at headings of the first heading level', () => {
    const container = render(RECORD);

    expect(tabs(container).map((t) => t.textContent)).toEqual([
      'Nurses\' Notes', 'Vital Signs', 'Laboratory Results',
    ]);
    expect(tabs(container)[0]!.querySelector('em')).not.toBeNull();

    const [notes, vitals, labs] = panels(container);
    expect(Array.from(notes!.querySelectorAll('h4')).map((h) => h.textContent)).toEqual(['0800', '0900']);
    expect(notes!.querySelectorAll('p')).toHaveLength(2);
    expect(vitals!.querySelector('table')).not.toBeNull();
    expect(labs!.textContent?.trim()).toBe('');
  });

  it('keeps the authored attributes on the container', () => {
    const container = render(RECORD);
    const root = container.querySelector('#record')!;

    expect(root.classList.contains('cutie-tab-container')).toBe(true);
    expect(root.querySelector('[role="tablist"]')).not.toBeNull();
  });

  it('wires tabs and panels together and shows only the first panel', () => {
    const container = render(RECORD);
    const [first, second] = tabs(container);
    const [firstPanel, secondPanel] = panels(container);

    expect(first!.getAttribute('aria-controls')).toBe(firstPanel!.id);
    expect(firstPanel!.getAttribute('aria-labelledby')).toBe(first!.id);
    expect(first!.getAttribute('aria-selected')).toBe('true');
    expect(first!.getAttribute('tabindex')).toBe('0');
    expect(second!.getAttribute('aria-selected')).toBe('false');
    expect(second!.getAttribute('tabindex')).toBe('-1');
    expect(firstPanel!.hidden).toBe(false);
    expect(secondPanel!.hidden).toBe(true);
  });

  it('selects a tab on click', () => {
    const container = render(RECORD);
    tabs(container)[1]!.click();

    expect(tabs(container)[1]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs(container)[0]!.getAttribute('aria-selected')).toBe('false');
    expect(panels(container)[0]!.hidden).toBe(true);
    expect(panels(container)[1]!.hidden).toBe(false);
  });

  it('moves selection and focus with arrow, Home, and End keys', () => {
    const container = render(RECORD);
    const all = tabs(container);

    press(all[0]!, 'ArrowRight');
    expect(document.activeElement).toBe(all[1]);
    expect(all[1]!.getAttribute('aria-selected')).toBe('true');

    press(all[1]!, 'End');
    expect(document.activeElement).toBe(all[2]);

    press(all[2]!, 'ArrowRight');
    expect(document.activeElement).toBe(all[0]);

    press(all[0]!, 'ArrowLeft');
    expect(document.activeElement).toBe(all[2]);

    press(all[2]!, 'Home');
    expect(document.activeElement).toBe(all[0]);
    expect(panels(container)[0]!.hidden).toBe(false);
  });

  it('restores the selected tab on re-render', () => {
    const state = new Map<string, unknown>();
    tabs(render(RECORD, state))[2]!.click();

    const rerendered = render(RECORD, state);
    expect(tabs(rerendered)[2]!.getAttribute('aria-selected')).toBe('true');
    expect(panels(rerendered)[2]!.hidden).toBe(false);
  });

  it('falls back to plain HTML when content does not start with a heading', () => {
    const container = render(`
      <div class="cutie-tab-container">
        Intro text
        <h3>Nurses' Notes</h3>
        <p>Client admitted.</p>
      </div>`);

    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelector('h3')?.textContent).toBe('Nurses\' Notes');
  });

  it('ignores headings without the container class', () => {
    const container = render('<div><h3>Notes</h3><p>Text</p></div>');
    expect(container.querySelector('[role="tablist"]')).toBeNull();
  });
});
