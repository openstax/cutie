import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type MountedItem, mountItem } from '../../../mountItem';
import { announce } from '../../../utils/liveRegion';

vi.mock('../../../utils/liveRegion', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../utils/liveRegion')>();
  return { ...original, announce: vi.fn(original.announce) };
});

/** An item showing the given feedback blocks, by identifier */
function itemWith(...shown: string[]): string {
  const blocks = shown
    .map((id) => `<qti-feedback-block outcome-identifier="FEEDBACK" identifier="${id}" show-hide="show"><p>${id} text</p></qti-feedback-block>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item">
  <qti-item-body><p>Question</p>${blocks}</qti-item-body>
</qti-assessment-item>`;
}

describe('feedback announcements', () => {
  let container: HTMLElement;
  let mounted: MountedItem;

  const announced = () => vi.mocked(announce).mock.calls.map((call) => call[1]);

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.mocked(announce).mockClear();
  });

  afterEach(() => {
    mounted.unmount();
    container.remove();
  });

  it('announces nothing on the first render', () => {
    mounted = mountItem(container, itemWith('HINT'));
    expect(announced()).toEqual([]);
  });

  it('announces feedback that appears, and does not repeat feedback that stays', () => {
    mounted = mountItem(container, itemWith());
    mounted.update(itemWith('HINT'));
    expect(announced()).toEqual(['HINT text']);

    mounted.update(itemWith('HINT', 'MORE'));
    expect(announced()).toEqual(['HINT text', 'MORE text']);
  });

  it('announces feedback again when it goes away and comes back', () => {
    mounted = mountItem(container, itemWith());
    mounted.update(itemWith('HINT'));
    mounted.update(itemWith());
    mounted.update(itemWith('HINT'));
    expect(announced()).toEqual(['HINT text', 'HINT text']);
  });
});
