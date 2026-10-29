/* spell-checker: ignore tablist tabpanel unstub viewports Signos vitales Presión */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseQtiXml } from '../../parser/xmlParser.js';
import { ItemStateImpl } from '../../state/itemState.js';
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
    <section>
      <h3>Nurses' <em>Notes</em></h3>
      <h4>0800</h4>
      <p>Client admitted.</p>
      <h4>0900</h4>
      <p>Client lethargic.</p>
    </section>
    <section>
      <h3>Vital Signs</h3>
      <table><tr><th>BP</th><td>100/68</td></tr></table>
    </section>
    <section>
      <h3>Laboratory Results</h3>
    </section>
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

  it('makes a tab of each section, labeled by its first heading', () => {
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

  it('keeps later headings in a section in its panel', () => {
    const container = render(`
      <div class="cutie-tab-container">
        <section>
          <h3>Notes</h3>
          <p>Text</p>
          <h3>Addendum</h3>
          <p>More text</p>
        </section>
      </div>`);

    expect(tabs(container).map((t) => t.textContent)).toEqual(['Notes']);
    expect(panels(container)[0]!.querySelector('h3')?.textContent).toBe('Addendum');
  });

  it('keeps the authored attributes on the container', () => {
    const container = render(RECORD);
    const root = container.querySelector('#record')!;

    expect(root.classList.contains('cutie-tab-container')).toBe(true);
    expect(root.querySelector('[role="tablist"]')).not.toBeNull();
  });

  it('keeps the authored attributes on each section and heading', () => {
    const container = render(`
      <div class="cutie-tab-container">
        <section id="vitals" class="record" lang="es" dir="ltr" aria-labelledby="elsewhere">
          <h3 id="vitals-heading" class="highlight">Signos vitales</h3>
          <p>Presión arterial: 100/68</p>
        </section>
        <section>
          <h3 lang="fr">Notes</h3>
        </section>
      </div>`);
    const [vitals, notes] = tabs(container);
    const [vitalsPanel] = panels(container);

    expect(vitalsPanel!.id).toBe('vitals');
    expect(vitalsPanel!.className).toBe('cutie-tabpanel record');
    expect(vitalsPanel!.getAttribute('lang')).toBe('es');
    expect(vitalsPanel!.getAttribute('dir')).toBe('ltr');
    expect(vitalsPanel!.getAttribute('aria-labelledby')).toBe(vitals!.id);
    expect(vitals!.getAttribute('aria-controls')).toBe('vitals');

    const heading = vitals!.parentElement!;
    expect(heading.id).toBe('vitals-heading');
    expect(heading.className).toBe('cutie-tab-heading highlight');
    expect(heading.getAttribute('lang')).toBe('es');
    expect(heading.getAttribute('dir')).toBe('ltr');
    expect(notes!.parentElement!.getAttribute('lang')).toBe('fr');
  });

  it('moves authored ARIA attributes from the heading to its tab', () => {
    const container = render(`
      <div class="cutie-tab-container">
        <section id="vitals">
          <h3 id="vitals-heading" aria-describedby="vitals-hint" aria-controls="elsewhere">Vital Signs</h3>
          <p id="vitals-hint">Taken at 0800</p>
        </section>
      </div>`);
    const [vitals] = tabs(container);
    const heading = vitals!.parentElement!;

    expect(heading.id).toBe('vitals-heading');
    expect(heading.getAttribute('role')).toBe('presentation');
    expect(Array.from(heading.attributes).some((attr) => attr.name.startsWith('aria-'))).toBe(false);
    expect(vitals!.getAttribute('aria-describedby')).toBe('vitals-hint');
    expect(vitals!.getAttribute('aria-controls')).toBe('vitals');
  });

  it('names the tablist with an authored label', () => {
    const container = render(`
      <div class="cutie-tab-container" aria-label="Client record">
        <section>
          <h3>Notes</h3>
          <p>Text</p>
        </section>
      </div>`);
    const root = container.querySelector('.cutie-tab-container')!;

    expect(root.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('Client record');
    expect(root.hasAttribute('aria-label')).toBe(false);
  });

  it('makes each panel a tab stop, even one with links', () => {
    const container = render(`
      <div class="cutie-tab-container">
        <section>
          <h3>Notes</h3>
          <p>Text</p>
        </section>
        <section>
          <h3>Sources</h3>
          <p><a href="https://example.com">Reference</a></p>
        </section>
      </div>`);
    const [text, links] = panels(container);

    expect(text!.getAttribute('tabindex')).toBe('0');
    expect(links!.getAttribute('tabindex')).toBe('0');
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

  it.each([
    ['no longer exists', 5],
    ['is negative', -1],
    ['is not a whole number', 1.5],
    ['is not a number', 'notes'],
  ])('selects the first tab when the saved tab %s', (_, saved) => {
    const state = new Map<string, unknown>([['tab-container:0', [saved]]]);
    const container = render(RECORD, state);

    expect(tabs(container)[0]!.getAttribute('aria-selected')).toBe('true');
    expect(panels(container)[0]!.hidden).toBe(false);
  });

  it('remembers the selected tab of each container nested in a panel on its own', () => {
    const nested = (name: string) => `
      <div class="cutie-tab-container">
        <section><h4>${name} 1</h4></section>
        <section><h4>${name} 2</h4></section>
      </div>`;
    const xml = `
      <div class="cutie-tab-container">
        <section><h3>A</h3>${nested('A')}</section>
        <section><h3>B</h3>${nested('B')}</section>
      </div>`;
    const tabNamed = (container: HTMLElement, name: string) =>
      tabs(container).find((tab) => tab.textContent === name)!;
    const state = new Map<string, unknown>();
    tabNamed(render(xml, state), 'A 2').click();

    const rerendered = render(xml, state);
    expect(tabNamed(rerendered, 'A 2').getAttribute('aria-selected')).toBe('true');
    expect(tabNamed(rerendered, 'B 1').getAttribute('aria-selected')).toBe('true');
  });

  it('keeps panel content inside the item body for its handlers', () => {
    const xml = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
      identifier="item" title="Item" adaptive="false" time-dependent="false">
      <qti-item-body data-cutie-preview="true">
        <div class="cutie-tab-container">
          <section>
            <h3>Response</h3>
            <qti-extended-text-interaction response-identifier="R1"></qti-extended-text-interaction>
          </section>
        </div>
      </qti-item-body>
    </qti-assessment-item>`;
    const itemState = new ItemStateImpl();
    itemState.setInteractionState('readonly');
    const { itemBody } = parseQtiXml(xml);
    const container = document.createElement('div');
    container.appendChild(transformChildren(itemBody, createTransformContext({ itemState })));

    expect(container.querySelector('.cutie-read-only-response')!.textContent)
      .toBe('Students will write their response here.');
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
          <section>
            <h3>Notes</h3>
            <p>Text</p>
          </section>
          <section>
            <h3>Sources</h3>
            <p>More text</p>
          </section>
        </div>`);
      const [notes, sources] = buttons(container);
      const [notesPanel, sourcesPanel] = sectionPanels(container);

      expect(container.querySelector('[role="tablist"], [role="tab"], [role="tabpanel"], [role="presentation"]'))
        .toBeNull();
      const group = container.querySelector('.cutie-tablist')!;
      expect(group.getAttribute('role')).toBe('group');
      expect(group.getAttribute('aria-label')).toBe('Client record');
      expect(container.querySelectorAll('[aria-label]')).toHaveLength(1);
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

    it('leaves an unlabeled accordion without a group role', () => {
      stubViewport(true);
      const container = render(RECORD);

      expect(container.querySelector('.cutie-tablist')!.hasAttribute('role')).toBe(false);
    });

    it('moves the label between the group and the tablist across the breakpoint', () => {
      const viewport = stubViewport(true);
      const container = render(`
        <div class="cutie-tab-container" aria-label="Client record">
          <section><h3>Notes</h3><p>Text</p></section>
        </div>`);
      const list = container.querySelector('.cutie-tablist')!;

      viewport.setNarrow(false);
      expect(list.getAttribute('role')).toBe('tablist');
      expect(list.getAttribute('aria-label')).toBe('Client record');

      viewport.setNarrow(true);
      expect(list.getAttribute('role')).toBe('group');
      expect(list.getAttribute('aria-label')).toBe('Client record');
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
          <section>
            <h3>Notes</h3>
            <p>Text</p>
          </section>
          <section>
            <h3>Sources</h3>
            <p><a href="https://example.com">Reference</a></p>
          </section>
          <section>
            <h3>Labs</h3>
          </section>
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

  it.each([
    ['content outside a section', '<section><h3>Notes</h3><p>Text</p></section> Intro text'],
    ['an element outside a section', '<p>Intro</p><section><h3>Notes</h3><p>Text</p></section>'],
    ['a section that does not start with a heading', '<section><p>Intro</p><h3>Notes</h3></section>'],
    ['no sections', '<h3>Notes</h3><p>Text</p>'],
  ])('falls back to plain HTML for %s', (_, content) => {
    const container = render(`<div class="cutie-tab-container">${content}</div>`);

    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelector('h3')?.textContent).toBe('Notes');
  });

  it('ignores sections without the container class', () => {
    const container = render('<div><section><h3>Notes</h3><p>Text</p></section></div>');
    expect(container.querySelector('[role="tablist"]')).toBeNull();
  });
});
