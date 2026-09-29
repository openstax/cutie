import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type MountedItem, mountItem } from './mountItem';
import { announce } from './utils/liveRegion';

vi.mock('./utils/liveRegion', async (importOriginal) => {
  const original = await importOriginal<typeof import('./utils/liveRegion')>();
  return { ...original, announce: vi.fn(original.announce) };
});

function itemXml(declarations: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item">
  ${declarations}
  <qti-item-body>${body}</qti-item-body>
</qti-assessment-item>`;
}

function declaration(identifier: string, cardinality: string, baseType: string, values: string[], extra = ''): string {
  const defaults = values.map((value) => `<qti-value>${value}</qti-value>`).join('');
  return `<qti-response-declaration identifier="${identifier}" cardinality="${cardinality}" base-type="${baseType}">
    <qti-default-value>${defaults}</qti-default-value>${extra}
  </qti-response-declaration>`;
}

function q<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`No element matches ${selector}`);
  return el;
}

function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function check(input: HTMLInputElement): void {
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('verdicts on a fresh try', () => {
  let container: HTMLElement;
  let mounted: MountedItem | null;

  const mount = (xml: string): MountedItem => {
    mounted = mountItem(container, xml);
    return mounted;
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mounted = null;
    vi.mocked(announce).mockClear();
  });

  afterEach(() => {
    mounted?.unmount();
    container.remove();
  });

  describe('clear once the learner edits the response', () => {
    it('choice interaction: drops the verdict text when there is no hint', () => {
      mount(itemXml(
        declaration('R1', 'single', 'identifier', ['B']),
        `<qti-choice-interaction response-identifier="R1" max-choices="1" data-evaluation="incorrect">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
        </qti-choice-interaction>`,
      ));
      const interaction = q(container, '.cutie-choice-interaction');
      const fieldset = q(container, 'fieldset');
      expect(interaction.classList.contains('cutie-evaluated--incorrect')).toBe(true);
      expect(q(container, '#constraint-R1').textContent).toBe('Incorrect response');

      check(container.querySelectorAll<HTMLInputElement>('input')[0]!);

      expect(interaction.classList.contains('cutie-evaluated')).toBe(false);
      expect(container.querySelector('#constraint-R1')).toBeNull();
      expect(fieldset.getAttribute('aria-describedby') ?? '').not.toContain('constraint-R1');
    });

    it('choice interaction: puts the constraint hint back', () => {
      mount(itemXml(
        declaration('R1', 'multiple', 'identifier', ['A']),
        `<qti-choice-interaction response-identifier="R1" min-choices="2" max-choices="3" data-evaluation="partial">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>`,
      ));
      const constraint = q(container, '#constraint-R1');
      expect(constraint.textContent).toBe('Partially correct response');

      check(container.querySelectorAll<HTMLInputElement>('input')[1]!);

      expect(constraint.textContent).not.toBe('Partially correct response');
      expect(constraint.textContent).toMatch(/2/);
      expect(container.querySelector('.cutie-evaluated')).toBeNull();
    });

    it('text entry interaction: drops the verdict overline', () => {
      mount(itemXml(
        declaration('R1', 'single', 'string', ['Lyon']),
        '<p>Capital: <qti-text-entry-interaction response-identifier="R1" data-evaluation="incorrect"/></p>',
      ));
      const input = q<HTMLInputElement>(container, 'input');
      expect(container.querySelector('#evaluation-R1')).not.toBeNull();

      typeInto(input, 'Paris');

      expect(container.querySelector('#evaluation-R1')).toBeNull();
      expect(input.classList.contains('cutie-evaluated')).toBe(false);
      expect(input.getAttribute('aria-describedby') ?? '').not.toContain('evaluation-R1');
    });

    it('text entry interaction: keeps a correct answer, dropping only the verdict', () => {
      mount(itemXml(
        declaration('R1', 'single', 'string', ['Lyon'], '<qti-correct-response><qti-value>Paris</qti-value></qti-correct-response>'),
        '<p>Capital: <qti-text-entry-interaction response-identifier="R1" data-evaluation="incorrect"/></p>',
      ));

      typeInto(q<HTMLInputElement>(container, 'input'), 'Nice');

      const overline = q(container, '#evaluation-R1');
      expect(overline.querySelector('.cutie-feedback-icon')).toBeNull();
      expect(overline.textContent).toContain('Paris');
    });

    it('inline choice interaction: drops the verdict overline', () => {
      mount(itemXml(
        declaration('R1', 'single', 'identifier', ['X']),
        `<p>Pick <qti-inline-choice-interaction response-identifier="R1" data-evaluation="incorrect">
          <qti-inline-choice identifier="X">X</qti-inline-choice>
          <qti-inline-choice identifier="Y">Y</qti-inline-choice>
        </qti-inline-choice-interaction></p>`,
      ));
      const select = q<HTMLSelectElement>(container, 'select');

      select.value = 'Y';
      select.dispatchEvent(new Event('change', { bubbles: true }));

      expect(container.querySelector('#evaluation-R1')).toBeNull();
      expect(select.classList.contains('cutie-evaluated')).toBe(false);
    });

    it('extended text interaction: puts the constraint hint back', () => {
      mount(itemXml(
        declaration('R1', 'single', 'string', ['short']),
        '<qti-extended-text-interaction response-identifier="R1" data-min-characters="10" data-evaluation="incorrect"/>',
      ));
      const constraint = q(container, '#constraint-R1');
      expect(constraint.textContent).toBe('Incorrect response');

      typeInto(q<HTMLTextAreaElement>(container, 'textarea'), 'longer text');

      expect(constraint.textContent).toMatch(/10/);
      expect(container.querySelector('.cutie-evaluated')).toBeNull();
    });

    it('match interaction: drops the verdict on an association change', () => {
      mount(itemXml(
        declaration('R1', 'multiple', 'directedPair', ['S1 T2']),
        `<qti-match-interaction response-identifier="R1" max-associations="2" data-evaluation="incorrect">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="S2" match-max="1">Source 2</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="T2" match-max="1">Target 2</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>`,
      ));
      expect(container.querySelector('.cutie-evaluated--incorrect')).not.toBeNull();

      // Selecting alone changes nothing
      q(container, '.cutie-match-choice[data-identifier="S2"]').click();
      expect(container.querySelector('.cutie-evaluated--incorrect')).not.toBeNull();

      q(container, '.cutie-match-choice[data-identifier="T1"]').click();
      expect(container.querySelector('.cutie-evaluated')).toBeNull();
      expect(container.querySelector('#constraint-R1')).toBeNull();
    });

    it('gap match interaction: drops the verdict when a choice is placed', () => {
      mount(itemXml(
        declaration('R1', 'multiple', 'directedPair', ['C1 G1']),
        `<qti-gap-match-interaction response-identifier="R1" data-evaluation="partial">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <qti-gap-text identifier="C2" match-max="1">Choice 2</qti-gap-text>
          <p>Fill <qti-gap identifier="G1"/> and <qti-gap identifier="G2"/></p>
        </qti-gap-match-interaction>`,
      ));
      expect(container.querySelector('.cutie-evaluated--partial')).not.toBeNull();

      q(container, '.cutie-gap-text[data-identifier="C2"]').click();
      q(container, '.cutie-gap[data-identifier="G2"]').click();

      expect(container.querySelector('.cutie-evaluated')).toBeNull();
    });

    it('leaves the verdicts of other interactions alone', () => {
      mount(itemXml(
        declaration('R1', 'single', 'string', ['a']) + declaration('R2', 'single', 'string', ['b']),
        `<p><qti-text-entry-interaction response-identifier="R1" data-evaluation="incorrect"/>
          <qti-text-entry-interaction response-identifier="R2" data-evaluation="incorrect"/></p>`,
      ));

      typeInto(container.querySelectorAll<HTMLInputElement>('input')[0]!, 'c');

      expect(container.querySelector('#evaluation-R1')).toBeNull();
      expect(container.querySelector('#evaluation-R2')).not.toBeNull();
    });
  });

  describe('the verdict of the response as a whole', () => {
    const verdictXml = (verdict: string) => itemXml(
      declaration('R1', 'single', 'string', ['Lyon']),
      `<p>Capital: <qti-text-entry-interaction response-identifier="R1" data-evaluation="${verdict}"/></p>`,
    ).replace('<qti-item-body>', `<qti-item-body data-evaluation="${verdict}">`);

    it.each([
      ['correct', 'Response is correct'],
      ['incorrect', 'Response is incorrect'],
      ['partial', 'Response is partially correct'],
    ])('is announced once when %s, on renders after the first', (verdict, text) => {
      const item = mount(verdictXml(verdict));
      expect(announce).not.toHaveBeenCalled();

      item.update(verdictXml(verdict));
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith(expect.anything(), text);
    });

    it('is not announced without an item verdict', () => {
      const xml = verdictXml('incorrect').replace('<qti-item-body data-evaluation="incorrect">', '<qti-item-body>');
      const item = mount(xml);
      item.update(xml);
      expect(announce).not.toHaveBeenCalled();
    });
  });

  describe('the retry message of an adaptive item', () => {
    const RETRY_XML = itemXml(
      '<qti-response-declaration identifier="R1" cardinality="single" base-type="identifier"/>',
      `<div data-cutie-retry="incorrect">That wasn't quite right. Tries remaining: 2</div>
      <qti-choice-interaction response-identifier="R1" max-choices="1">
        <qti-simple-choice identifier="A">A</qti-simple-choice>
      </qti-choice-interaction>`,
    );

    it('is drawn as a feedback block with the verdict icon', () => {
      mount(RETRY_XML);
      const message = q(container, '.cutie-retry-message');

      expect(message.dataset.feedbackType).toBe('incorrect');
      expect(message.querySelector('.cutie-feedback-icon--incorrect')).not.toBeNull();
      expect(message.textContent).toContain('That wasn\'t quite right. Tries remaining: 2');
      expect(container.querySelector('[data-cutie-retry]')).toBeNull();
    });

    it('uses the partial icon for a partially correct try', () => {
      mount(RETRY_XML.replace('data-cutie-retry="incorrect"', 'data-cutie-retry="partial"'));
      const message = q(container, '.cutie-retry-message');

      expect(message.dataset.feedbackType).toBe('info');
      expect(message.querySelector('.cutie-feedback-icon--partial')).not.toBeNull();
    });

    it('is announced when it arrives, not when the attempt is resumed', () => {
      const item = mount(RETRY_XML);
      expect(announce).not.toHaveBeenCalled();

      item.update(RETRY_XML);
      expect(announce).toHaveBeenCalledWith(expect.anything(), 'That wasn\'t quite right. Tries remaining: 2');
    });
  });
});
