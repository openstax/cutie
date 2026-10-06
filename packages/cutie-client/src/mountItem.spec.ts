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

const CHOICE_XML = itemXml(
  '<qti-response-declaration identifier="R1" cardinality="multiple" base-type="identifier"/>',
  `<qti-choice-interaction response-identifier="R1" min-choices="2" max-choices="3">
    <qti-simple-choice identifier="A">A</qti-simple-choice>
    <qti-simple-choice identifier="B">B</qti-simple-choice>
    <qti-simple-choice identifier="C">C</qti-simple-choice>
  </qti-choice-interaction>`,
);

const INLINE_CHOICE_XML = itemXml(
  '<qti-response-declaration identifier="R1" cardinality="single" base-type="identifier"/>',
  `<p>Pick <qti-inline-choice-interaction response-identifier="R1" required="true">
    <qti-inline-choice identifier="X">X</qti-inline-choice>
    <qti-inline-choice identifier="Y">Y</qti-inline-choice>
  </qti-inline-choice-interaction></p>`,
);

const TEXT_ENTRY_XML = itemXml(
  '<qti-response-declaration identifier="R1" cardinality="single" base-type="string"/>',
  '<p>Answer: <qti-text-entry-interaction response-identifier="R1" pattern-mask="^[0-9]+$"/></p>',
);

const EXTENDED_TEXT_XML = itemXml(
  '<qti-response-declaration identifier="R1" cardinality="single" base-type="string"/>',
  '<qti-extended-text-interaction response-identifier="R1" min-strings="1" data-min-characters="10"/>',
);

const MATCH_XML = itemXml(
  '<qti-response-declaration identifier="R1" cardinality="multiple" base-type="directedPair"/>',
  `<qti-match-interaction response-identifier="R1" min-associations="2" max-associations="4">
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="S2" match-max="1">Source 2</qti-simple-associable-choice>
    </qti-simple-match-set>
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="T2" match-max="1">Target 2</qti-simple-associable-choice>
    </qti-simple-match-set>
  </qti-match-interaction>`,
);

const GAP_MATCH_XML = itemXml(
  '<qti-response-declaration identifier="R1" cardinality="multiple" base-type="directedPair"/>',
  `<qti-gap-match-interaction response-identifier="R1" min-associations="2">
    <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
    <qti-gap-text identifier="C2" match-max="1">Choice 2</qti-gap-text>
    <p>Fill <qti-gap identifier="G1"/> and <qti-gap identifier="G2"/></p>
  </qti-gap-match-interaction>`,
);

/** Every interaction type in one item, each with a default value */
const DEFAULTS_XML = itemXml(
  `<qti-response-declaration identifier="CH" cardinality="single" base-type="identifier">
    <qti-default-value><qti-value>A</qti-value></qti-default-value>
  </qti-response-declaration>
  <qti-response-declaration identifier="TE" cardinality="single" base-type="string">
    <qti-default-value><qti-value>hello</qti-value></qti-default-value>
  </qti-response-declaration>
  <qti-response-declaration identifier="MA" cardinality="multiple" base-type="directedPair">
    <qti-default-value><qti-value>S1 T1</qti-value></qti-default-value>
  </qti-response-declaration>
  <qti-response-declaration identifier="GM" cardinality="multiple" base-type="directedPair">
    <qti-default-value><qti-value>C1 G1</qti-value></qti-default-value>
  </qti-response-declaration>`,
  `<qti-choice-interaction response-identifier="CH" max-choices="1">
    <qti-simple-choice identifier="A">A</qti-simple-choice>
    <qti-simple-choice identifier="B">B</qti-simple-choice>
  </qti-choice-interaction>
  <p><qti-text-entry-interaction response-identifier="TE"/></p>
  <qti-match-interaction response-identifier="MA" max-associations="2">
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
    </qti-simple-match-set>
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
    </qti-simple-match-set>
  </qti-match-interaction>
  <qti-gap-match-interaction response-identifier="GM">
    <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
    <p>Fill <qti-gap identifier="G1"/></p>
  </qti-gap-match-interaction>`,
);

function q<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`No element matches ${selector}`);
  return el;
}

function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function toggle(input: HTMLInputElement): void {
  input.checked = !input.checked;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('mountItem onResponseChange', () => {
  let container: HTMLElement;
  let mounted: MountedItem | null;
  const onResponseChange = vi.fn();

  const mount = (xml: string): MountedItem => {
    mounted = mountItem(container, xml, { onResponseChange });
    return mounted;
  };

  /** No validation UI anywhere in the item */
  const expectNoValidationUi = () => {
    expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
    expect(container.querySelector('.cutie-constraint-error')).toBeNull();
    expect(announce).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), 'assertive');
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mounted = null;
    onResponseChange.mockClear();
    vi.mocked(announce).mockClear();
  });

  afterEach(() => {
    mounted?.unmount();
    container.remove();
  });

  describe('fires on learner edits with raw values', () => {
    it('choice interaction: reports each change, including an invalid partial selection', () => {
      mount(CHOICE_XML);
      const inputs = container.querySelectorAll<HTMLInputElement>('input');

      toggle(inputs[0]!);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: ['A'] });

      toggle(inputs[1]!);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: ['A', 'B'] });

      toggle(inputs[0]!);
      toggle(inputs[1]!);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: null });
      expect(onResponseChange).toHaveBeenCalledTimes(4);
      expectNoValidationUi();
    });

    it('inline choice interaction: reports selection and clearing a required select', () => {
      mount(INLINE_CHOICE_XML);
      const select = q<HTMLSelectElement>(container, 'select');

      select.value = 'Y';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: 'Y' });

      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: null });
      expect(onResponseChange).toHaveBeenCalledTimes(2);
      expectNoValidationUi();
    });

    it('text entry interaction: reports every keystroke, even when the pattern-mask fails', () => {
      mount(TEXT_ENTRY_XML);
      const input = q<HTMLInputElement>(container, 'input');

      typeInto(input, 'a');
      typeInto(input, 'ab');
      typeInto(input, 'abc');

      expect(onResponseChange).toHaveBeenCalledTimes(3);
      expect(onResponseChange.mock.calls.map((c) => c[0])).toEqual([
        { R1: 'a' }, { R1: 'ab' }, { R1: 'abc' },
      ]);
      expectNoValidationUi();
    });

    it('extended text (plain) interaction: reports every keystroke, even when too short', () => {
      mount(EXTENDED_TEXT_XML);
      const textarea = q<HTMLTextAreaElement>(container, 'textarea');

      typeInto(textarea, 'h');
      typeInto(textarea, 'hi');
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: 'hi' });

      typeInto(textarea, '');
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: null });
      expect(onResponseChange).toHaveBeenCalledTimes(3);
      expectNoValidationUi();
    });

    it('match interaction: reports each association change, not selection-only clicks', () => {
      mount(MATCH_XML);
      const s1 = q(container, '.cutie-match-choice[data-identifier="S1"]');
      const t1 = q(container, '.cutie-match-choice[data-identifier="T1"]');

      s1.click(); // selection only
      expect(onResponseChange).not.toHaveBeenCalled();

      t1.click(); // creates S1 T1
      expect(onResponseChange).toHaveBeenCalledTimes(1);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: ['S1 T1'] });

      // Remove via the chip's keyboard shortcut
      const chip = q(container, '.cutie-match-chip');
      chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
      expect(onResponseChange).toHaveBeenCalledTimes(2);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: null });
      expectNoValidationUi();
    });

    it('match interaction: moving an association reports once with the final value', () => {
      mount(MATCH_XML);
      q(container, '.cutie-match-choice[data-identifier="S1"]').click();
      q(container, '.cutie-match-choice[data-identifier="T1"]').click();
      onResponseChange.mockClear();

      // The chip beside S1 represents T1: selecting it picks up T1's end of the association
      q(container, '.cutie-match-chip[data-connected-id="T1"]').click();
      expect(onResponseChange).not.toHaveBeenCalled();
      q(container, '.cutie-match-choice[data-identifier="S2"]').click(); // move to S2

      expect(onResponseChange).toHaveBeenCalledTimes(1);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: ['S2 T1'] });
    });

    it('gap match interaction: reports placing and removing a choice', () => {
      mount(GAP_MATCH_XML);
      const c1 = q(container, '.cutie-gap-text[data-identifier="C1"]');
      const g1 = q(container, '.cutie-gap[data-identifier="G1"]');
      const g2 = q(container, '.cutie-gap[data-identifier="G2"]');

      c1.click(); // selection only
      expect(onResponseChange).not.toHaveBeenCalled();

      g1.click(); // place C1 in G1
      expect(onResponseChange).toHaveBeenCalledTimes(1);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: ['C1 G1'] });

      g1.click(); // pick up from G1
      g2.click(); // move to G2
      expect(onResponseChange).toHaveBeenCalledTimes(2);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: ['C1 G2'] });

      g2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
      expect(onResponseChange).toHaveBeenCalledTimes(3);
      expect(onResponseChange).toHaveBeenLastCalledWith({ R1: null });
      expectNoValidationUi();
    });

    it('reports the value of every interaction on each edit', () => {
      mount(DEFAULTS_XML);
      typeInto(q<HTMLInputElement>(container, 'input[type="text"]'), 'hello!');

      expect(onResponseChange).toHaveBeenCalledTimes(1);
      expect(onResponseChange).toHaveBeenLastCalledWith({
        CH: 'A',
        TE: 'hello!',
        MA: ['S1 T1'],
        GM: ['C1 G1'],
      });
    });
  });

  it('collectResponses still validates and shows errors on demand', () => {
    const item = mount(TEXT_ENTRY_XML);
    typeInto(q<HTMLInputElement>(container, 'input'), 'abc');
    expectNoValidationUi();

    expect(item.collectResponses()).toBeUndefined();
    expect(container.querySelector('[aria-invalid="true"]')).not.toBeNull();
  });

  describe('does not fire outside learner edits', () => {
    it('does not fire on mount, even when restoring default values', () => {
      mount(DEFAULTS_XML);
      expect(onResponseChange).not.toHaveBeenCalled();
    });

    it('does not fire on update()', () => {
      const item = mount(DEFAULTS_XML);
      item.update(DEFAULTS_XML);
      expect(onResponseChange).not.toHaveBeenCalled();
    });

    it('does not fire on setInteractionState()', () => {
      const item = mount(DEFAULTS_XML);
      item.setInteractionState('disabled');
      item.setInteractionState('enabled');
      expect(onResponseChange).not.toHaveBeenCalled();
    });

    it('does not fire on collectResponses()', () => {
      const item = mount(CHOICE_XML);
      item.collectResponses();
      expect(onResponseChange).not.toHaveBeenCalled();
    });
  });

  it('keeps firing after update() re-renders the item', () => {
    const item = mount(TEXT_ENTRY_XML);
    typeInto(q<HTMLInputElement>(container, 'input'), '1');
    expect(onResponseChange).toHaveBeenCalledTimes(1);

    item.update(TEXT_ENTRY_XML);
    expect(onResponseChange).toHaveBeenCalledTimes(1);

    typeInto(q<HTMLInputElement>(container, 'input'), '42');
    expect(onResponseChange).toHaveBeenCalledTimes(2);
    expect(onResponseChange).toHaveBeenLastCalledWith({ R1: '42' });
  });

  it('works without an onResponseChange option', () => {
    mounted = mountItem(container, TEXT_ENTRY_XML);
    expect(() => typeInto(q<HTMLInputElement>(container, 'input'), '1')).not.toThrow();
  });
});

describe('mountItem cleanup lifetimes', () => {
  const clicks = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.filter((call) => call[0] === 'click').length;

  it('tears down each render\'s document listeners on update() and unmount()', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const container = document.createElement('div');
    document.body.appendChild(container);

    const item = mountItem(container, MATCH_XML);
    for (let i = 0; i < 3; i++) item.update(MATCH_XML);

    // Only the current render's listener is still attached
    expect(clicks(add) - clicks(remove)).toBe(1);

    item.unmount();
    expect(clicks(add) - clicks(remove)).toBe(0);

    add.mockRestore();
    remove.mockRestore();
    container.remove();
  });

  it('shares the live regions between mounted items until the last unmounts', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);

    const a = mountItem(first, MATCH_XML);
    const b = mountItem(second, MATCH_XML);
    const regions = Array.from(document.querySelectorAll('[aria-live]'));
    expect(regions).toHaveLength(2);

    a.unmount();
    expect(Array.from(document.querySelectorAll('[aria-live]'))).toEqual(regions);

    b.unmount();
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(0);
    first.remove();
    second.remove();
  });

  it('drops announcements still queued when the last item unmounts', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const item = mountItem(container, MATCH_XML);
    const retry = MATCH_XML.replace('<qti-item-body>', '<qti-item-body><div data-cutie-retry="incorrect">Try again</div>');

    item.update(retry); // queues the retry message's announcement
    item.unmount(); // before the queue flushes
    await Promise.resolve();

    expect(document.querySelectorAll('[aria-live]')).toHaveLength(0);
    container.remove();
  });

  it('leaves nothing behind when the first render throws', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    expect(() => mountItem(container, '<not-qti/>')).toThrow();
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(0);

    // A later mount still owns, and removes, the regions
    const item = mountItem(container, MATCH_XML);
    item.unmount();
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(0);
    container.remove();
  });

  it('drops an unmounted item\'s queued announcements while another item still holds the regions', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const withRetry = (text: string) =>
      MATCH_XML.replace('<qti-item-body>', `<qti-item-body><div data-cutie-retry="incorrect">${text}</div>`);

    const a = mountItem(first, MATCH_XML);
    const b = mountItem(second, MATCH_XML);

    a.update(withRetry('From A')); // queues A's announcement
    b.update(withRetry('From B')); // and B's
    a.unmount(); // before the queue flushes
    await Promise.resolve();

    const polite = q(document.body, '[aria-live="polite"]');
    expect(polite.textContent).toContain('From B');
    expect(polite.textContent).not.toContain('From A');

    b.unmount();
    first.remove();
    second.remove();
  });

  it('keeps the live regions across update() and removes them on unmount()', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const item = mountItem(container, MATCH_XML);
    const regions = Array.from(document.querySelectorAll('[aria-live]'));
    expect(regions).toHaveLength(2);

    item.update(MATCH_XML);
    expect(Array.from(document.querySelectorAll('[aria-live]'))).toEqual(regions);

    item.unmount();
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(0);
    container.remove();
  });
});

describe('mountItem interactionState', () => {
  let container: HTMLElement;
  let mounted: MountedItem | undefined;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    mounted?.unmount();
    mounted = undefined;
    container.remove();
  });

  /** Whether each control in the container is disabled, in document order */
  function disabledStates(): boolean[] {
    return Array.from(container.querySelectorAll<HTMLElement>('input, select, textarea, button, [aria-disabled]')).map(
      (el) => (el as HTMLInputElement).disabled === true || el.getAttribute('aria-disabled') === 'true'
    );
  }

  it('mounts with interactions disabled as setInteractionState leaves them', () => {
    const reference = mountItem(container, DEFAULTS_XML);
    reference.setInteractionState('disabled');
    const expected = disabledStates();
    reference.unmount();

    mounted = mountItem(container, DEFAULTS_XML, { interactionState: 'disabled' });

    expect(expected).toContain(true);
    expect(disabledStates()).toEqual(expected);
  });

  it('keeps interactions disabled across update()', () => {
    mounted = mountItem(container, DEFAULTS_XML, { interactionState: 'disabled' });
    const expected = disabledStates();

    mounted.update(DEFAULTS_XML);

    expect(disabledStates()).toEqual(expected);
  });

  it('keeps interactions read-only across update()', () => {
    mounted = mountItem(container, DEFAULTS_XML, { interactionState: 'readonly' });
    const expected = disabledStates();

    mounted.update(DEFAULTS_XML);

    expect(expected).toContain(true);
    expect(disabledStates()).toEqual(expected);
  });

  it('enables them with setInteractionState', () => {
    const reference = mountItem(container, DEFAULTS_XML);
    const expected = disabledStates();
    reference.unmount();

    mounted = mountItem(container, DEFAULTS_XML, { interactionState: 'disabled' });
    mounted.setInteractionState('enabled');

    expect(disabledStates()).toEqual(expected);
  });
});

describe('mountItem docked stimulus', () => {
  it('renders a stimulus cutie-core inlined into its dock as ordinary content', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const item = mountItem(
      container,
      `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item">
  <qti-assessment-stimulus-ref identifier="Stimulus1" href="passages/night.xml"/>
  <qti-item-body>
    <div class="qti-shared-stimulus" data-stimulus-idref="Stimulus1">
      <div class="qti-shared-stimulus-wrapper"><p>It was a night.</p></div>
    </div>
  </qti-item-body>
</qti-assessment-item>`,
    );

    const dock = container.querySelector('[data-stimulus-idref="Stimulus1"]');
    expect(dock?.classList.contains('qti-shared-stimulus')).toBe(true);
    expect(dock?.querySelector('p')?.textContent).toBe('It was a night.');
    expect(container.textContent).not.toContain('Unsupported');

    item.unmount();
    container.remove();
  });
});
