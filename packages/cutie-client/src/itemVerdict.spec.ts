/* spell-checker: ignore hottext */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type MountedItem, mountItem } from './mountItem.js';
import { announce } from './utils/liveRegion.js';

vi.mock('./utils/liveRegion.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('./utils/liveRegion.js')>();
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

describe('verdicts on the item as a whole', () => {
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

  describe('the verdict of a finished attempt', () => {
    const verdictXml = (verdict: string) => itemXml(
      declaration('R1', 'single', 'string', ['Lyon']),
      '<p>Capital: <qti-text-entry-interaction response-identifier="R1"/></p>',
    ).replace('<qti-item-body>', `<qti-item-body data-cutie-evaluation="${verdict}">`);

    it.each([
      ['correct', 'correct', 'Correct'],
      ['incorrect', 'incorrect', 'Incorrect'],
      ['partial', 'info', 'Partially correct'],
    ])('leads the item as a feedback block when %s', (verdict, feedbackType, text) => {
      mount(verdictXml(verdict));
      const block = q(container, '.cutie-verdict-block');

      expect(container.firstElementChild).toBe(block);
      expect(block.dataset.feedbackType).toBe(feedbackType);
      expect(block.querySelector(`.cutie-feedback-icon--${verdict}`)).not.toBeNull();
      expect(block.textContent).toBe(text);
    });

    it('is announced when it arrives, not when the attempt is resumed', () => {
      const item = mount(verdictXml('partial'));
      expect(announce).not.toHaveBeenCalled();

      item.update(verdictXml('partial'));
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith(expect.anything(), 'Partially correct');
    });

    it('is not drawn or announced without an item verdict', () => {
      const xml = verdictXml('incorrect').replace('<qti-item-body data-cutie-evaluation="incorrect">', '<qti-item-body>');
      const item = mount(xml);
      item.update(xml);
      expect(container.querySelector('.cutie-verdict-block')).toBeNull();
      expect(announce).not.toHaveBeenCalled();
    });
  });

  describe('the retry message of a fresh try', () => {
    const RETRY_XML = itemXml(
      '<qti-response-declaration identifier="R1" cardinality="single" base-type="identifier"/>',
      `<div data-cutie-retry="incorrect">That wasn't quite right. Tries remaining: 2</div>
      <qti-choice-interaction response-identifier="R1" max-choices="1">
        <qti-simple-choice identifier="A">A</qti-simple-choice>
      </qti-choice-interaction>`,
    );

    it('is drawn as a verdict block', () => {
      mount(RETRY_XML);
      const message = q(container, '.cutie-retry-message');

      expect(message.classList.contains('cutie-verdict-block')).toBe(true);
      expect(message.dataset.feedbackType).toBe('incorrect');
      expect(message.querySelector('.cutie-feedback-icon--incorrect')).not.toBeNull();
      expect(message.textContent).toBe('That wasn\'t quite right. Tries remaining: 2');
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
