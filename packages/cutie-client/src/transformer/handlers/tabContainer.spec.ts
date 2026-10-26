/* spell-checker: ignore tablist tabpanel unstub viewports */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseQtiXml } from '../../parser/xmlParser.js';
import { createTransformContext, transformChildren } from '../elementTransformer.js';

function render(
  bodyXml: string,
  state = new Map<string, unknown>(),
  onCleanup?: (callback: () => void) => void
): HTMLElement {
  const xml = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    identifier="item" title="Item" adaptive="false" time-dependent="false">
    <qti-item-body>${bodyXml}</qti-item-body>
  </qti-assessment-item>`;
  const { itemBody } = parseQtiXml(xml);
  const container = document.createElement('div');
  container.appendChild(transformChildren(itemBody, createTransformContext({ state, onCleanup })));
  document.body.replaceChildren(container);
  return container;
}

/** Stub the viewport media query; `setNarrow` fires its change listeners. */
function stubViewport(narrow: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches: narrow,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => media);
  return {
    listeners,
    setNarrow(value: boolean) {
      media.matches = value;
      for (const listener of listeners) listener();
    },
  };
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

function buttons(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.cutie-tab'));
}

function sectionPanels(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.cutie-tabpanel'));
}

function press(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

/** Count the elements inserted or removed anywhere in `container` during `action`. */
function countMoves(container: HTMLElement, action: () => void): number {
  const observer = new MutationObserver(() => undefined);
  observer.observe(container, { childList: true, subtree: true });
  action();
  const records = observer.takeRecords();
  observer.disconnect();
  return records.reduce((count, r) => count + r.addedNodes.length + r.removedNodes.length, 0);
}

describe('tabContainer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it('names the tablist with an authored label', () => {
    const container = render(`
      <div class="cutie-tab-container" aria-label="Client record">
        <h3>Notes</h3>
        <p>Text</p>
      </div>`);
    const root = container.querySelector('.cutie-tab-container')!;

    expect(root.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('Client record');
    expect(root.hasAttribute('aria-label')).toBe(false);
  });

  it('makes a panel a tab stop only when it has no focusable content', () => {
    const container = render(`
      <div class="cutie-tab-container">
        <h3>Notes</h3>
        <p>Text</p>
        <h3>Sources</h3>
        <p><a href="https://example.com">Reference</a></p>
      </div>`);
    const [text, links] = panels(container);

    expect(text!.getAttribute('tabindex')).toBe('0');
    expect(links!.hasAttribute('tabindex')).toBe(false);
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

  it('leaves panels in place when the selection changes', () => {
    const container = render(RECORD);

    expect(countMoves(container, () => tabs(container)[1]!.click())).toBe(0);
    expect(countMoves(container, () => press(tabs(container)[1]!, 'ArrowRight'))).toBe(0);
  });

  it('restores the selected tab on re-render', () => {
    const state = new Map<string, unknown>();
    tabs(render(RECORD, state))[2]!.click();

    const rerendered = render(RECORD, state);
    expect(tabs(rerendered)[2]!.getAttribute('aria-selected')).toBe('true');
    expect(panels(rerendered)[2]!.hidden).toBe(false);
  });

  it('wraps each tab in a presentational heading and places panels after the tablist', () => {
    const container = render(RECORD);
    const tablist = container.querySelector('[role="tablist"]')!;

    expect(Array.from(tablist.children).every((h) => h.localName === 'h3' && h.getAttribute('role') === 'presentation'))
      .toBe(true);
    expect(tablist.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(tablist.querySelector('[role="tabpanel"]')).toBeNull();
    expect(tablist.nextElementSibling).toBe(panels(container)[0]);
  });

  describe('on narrow viewports', () => {
    it('renders an accordion of headings, buttons, and regions', () => {
      stubViewport(true);
      const container = render(`
        <div class="cutie-tab-container" aria-label="Client record">
          <h3>Notes</h3>
          <p>Text</p>
          <h3>Sources</h3>
          <p>More text</p>
        </div>`);
      const [notes, sources] = buttons(container);
      const [notesPanel, sourcesPanel] = sectionPanels(container);

      expect(container.querySelector('[role="tablist"], [role="tab"], [role="tabpanel"], [role="presentation"]'))
        .toBeNull();
      expect(container.querySelector('[aria-label]')).toBeNull();
      expect(notes!.parentElement!.localName).toBe('h3');
      expect(notes!.parentElement!.nextElementSibling).toBe(notesPanel);
      expect(sources!.parentElement!.nextElementSibling).toBe(sourcesPanel);
      expect(notesPanel!.getAttribute('role')).toBe('region');
      expect(notesPanel!.getAttribute('aria-labelledby')).toBe(notes!.id);
      expect(notesPanel!.hasAttribute('tabindex')).toBe(false);
      expect(notes!.getAttribute('aria-expanded')).toBe('true');
      expect(sources!.getAttribute('aria-expanded')).toBe('false');
      expect(notesPanel!.hidden).toBe(false);
      expect(sourcesPanel!.hidden).toBe(true);
    });

    it('opens several sections and closes an open one on click', () => {
      stubViewport(true);
      const container = render(RECORD);
      const [first, second, third] = buttons(container);

      third!.click();
      second!.click();
      expect(sectionPanels(container).map((p) => p.hidden)).toEqual([false, false, false]);

      first!.click();
      expect(first!.getAttribute('aria-expanded')).toBe('false');
      expect(sectionPanels(container).map((p) => p.hidden)).toEqual([true, false, false]);
    });

    it('leaves panels in place when a section opens or closes', () => {
      stubViewport(true);
      const container = render(RECORD);

      expect(countMoves(container, () => buttons(container)[1]!.click())).toBe(0);
      expect(countMoves(container, () => buttons(container)[0]!.click())).toBe(0);
    });

    it('ignores tab keys', () => {
      stubViewport(true);
      const container = render(RECORD);
      const [first] = buttons(container);
      first!.focus();

      press(first!, 'ArrowRight');
      expect(document.activeElement).toBe(first);
    });

    it('restores the open sections on re-render', () => {
      stubViewport(true);
      const state = new Map<string, unknown>();
      buttons(render(RECORD, state))[2]!.click();

      const rerendered = render(RECORD, state);
      expect(sectionPanels(rerendered).map((p) => p.hidden)).toEqual([false, true, false]);
    });
  });

  describe('crossing the breakpoint', () => {
    it('selects the most recently opened section when widening', () => {
      const viewport = stubViewport(true);
      const container = render(RECORD);
      buttons(container)[2]!.click();
      buttons(container)[1]!.click();
      document.body.focus();

      viewport.setNarrow(false);
      expect(tabs(container)[1]!.getAttribute('aria-selected')).toBe('true');
      expect(panels(container).map((p) => p.hidden)).toEqual([true, false, true]);
    });

    it('selects the section holding focus and keeps focus when widening', () => {
      const viewport = stubViewport(true);
      const container = render(`
        <div class="cutie-tab-container">
          <h3>Notes</h3>
          <p>Text</p>
          <h3>Sources</h3>
          <p><a href="https://example.com">Reference</a></p>
          <h3>Labs</h3>
        </div>`);
      buttons(container)[1]!.click();
      buttons(container)[2]!.click();
      const link = container.querySelector('a')!;
      link.focus();

      viewport.setNarrow(false);
      expect(tabs(container)[1]!.getAttribute('aria-selected')).toBe('true');
      expect(document.activeElement).toBe(link);
    });

    it('opens the focused tab panel and moves focus to its button when narrowing', () => {
      const viewport = stubViewport(false);
      const container = render(RECORD);
      tabs(container)[1]!.click();
      const panel = panels(container)[1]!;
      panel.focus();

      viewport.setNarrow(true);
      const button = buttons(container)[1]!;
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(panel.hidden).toBe(false);
      expect(document.activeElement).toBe(button);
    });

    it('keeps focus on a tab that becomes an accordion button', () => {
      const viewport = stubViewport(false);
      const container = render(RECORD);
      const tab = tabs(container)[2]!;
      tab.click();
      tab.focus();

      viewport.setNarrow(true);
      expect(document.activeElement).toBe(tab);
      expect(tab.getAttribute('aria-expanded')).toBe('true');
      expect(tab.hasAttribute('tabindex')).toBe(false);
    });

    it('stops listening when the render is cleaned up', () => {
      const viewport = stubViewport(false);
      const cleanups: Array<() => void> = [];
      render(RECORD, new Map(), (callback) => cleanups.push(callback));

      expect(viewport.listeners.size).toBe(1);
      for (const cleanup of cleanups) cleanup();
      expect(viewport.listeners.size).toBe(0);
    });
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
