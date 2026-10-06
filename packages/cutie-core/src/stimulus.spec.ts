/* spell-checker: ignore undocked inlines */
import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test, vi } from 'vitest';
import type { AssetRequest, StimulusResolver } from './types.js';
import {
  beginAttempt,
  listItemDependencies,
  listStimulusDependencies,
  renderPreview,
  renderStimulus,
} from './index.js';

const stimulus = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-stimulus xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="Stimulus1" title="An Unbelievable Night">
  <qti-stylesheet href="stylesheets/night.css" type="text/css"/>
  <qti-stimulus-body>
    <div class="qti-shared-stimulus-wrapper">
      <img src="images/door.png" alt="A door"/>
      <p data-cutie-evaluation="correct">It was an unbelievable night.</p>
      <div data-cutie-retry="incorrect">Spoofed</div>
    </div>
  </qti-stimulus-body>
</qti-assessment-stimulus>`;

const item = (body: string) => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="item" title="Item" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-assessment-stimulus-ref identifier="Stimulus1" href="passages/night.xml" title="An Unbelievable Night"/>
  <qti-item-body>
    ${body}
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A"><img src="images/a.png" alt="A"/></qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`;

const dockedItem = item('<div class="qti-shared-stimulus" data-stimulus-idref="Stimulus1"></div>');
const undockedItem = item('<p>Read the passage.</p>');

function parse(xml: string): Element {
  return new DOMParser().parseFromString(xml, 'text/xml').documentElement;
}

function dockIn(template: string): Element {
  const dock = Array.from(parse(template).getElementsByTagName('div')).find((element) =>
    element.hasAttribute('data-stimulus-idref')
  );
  if (!dock) throw new Error('no dock');
  return dock;
}

describe('listItemDependencies', () => {
  test('lists a stimulus the item docks', () => {
    expect(listItemDependencies(dockedItem).stimuli).toEqual([
      { identifier: 'Stimulus1', href: 'passages/night.xml', title: 'An Unbelievable Night', docked: true },
    ]);
  });

  test('lists a stimulus the item does not dock', () => {
    expect(listItemDependencies(undockedItem).stimuli).toEqual([
      { identifier: 'Stimulus1', href: 'passages/night.xml', title: 'An Unbelievable Night', docked: false },
    ]);
  });

  test('lists the item\'s own assets', () => {
    expect(listItemDependencies(dockedItem).assets).toEqual(['images/a.png']);
  });

  test('lists no stimuli for an item without references', () => {
    const plain = undockedItem.replace(/<qti-assessment-stimulus-ref[^>]*\/>/, '');
    expect(listItemDependencies(plain).stimuli).toEqual([]);
  });
});

describe('renderStimulus', () => {
  test('keeps the stimulus body', async () => {
    const root = parse(await renderStimulus(stimulus));
    expect(root.tagName).toBe('qti-assessment-stimulus');
    expect(root.getElementsByTagName('qti-stimulus-body')[0]?.textContent).toContain('unbelievable night');
  });

  test('removes markup only core may add', async () => {
    const xml = await renderStimulus(stimulus);
    expect(xml).not.toContain('data-cutie-evaluation');
    expect(xml).not.toContain('Spoofed');
  });

  test('resolves its assets as its own', async () => {
    const resolveAssets = vi.fn(async (assets: AssetRequest[]) => assets.map(({ url }) => `https://cdn/${url}`));
    const xml = await renderStimulus(stimulus, { resolveAssets });

    expect(resolveAssets).toHaveBeenCalledWith([{ url: 'images/door.png' }]);
    expect(xml).toContain('src="https://cdn/images/door.png"');
  });

  test('rejects a document that is not a stimulus', async () => {
    await expect(renderStimulus(undockedItem)).rejects.toThrow('qti-assessment-stimulus');
  });

  test('rejects a stimulus without a body', async () => {
    const empty = '<qti-assessment-stimulus identifier="S" title="S"/>';
    await expect(renderStimulus(empty)).rejects.toThrow('qti-stimulus-body');
  });
});

describe('listStimulusDependencies', () => {
  test('lists asset URLs relative to the stimulus', () => {
    expect(listStimulusDependencies(stimulus)).toEqual({ assets: ['images/door.png'] });
  });
});

describe('docked stimuli', () => {
  const resolveStimuli: StimulusResolver = async (refs) => refs.map(() => stimulus);

  test('inlines the stimulus body into its dock', async () => {
    const { template } = await beginAttempt(dockedItem, { resolveStimuli });
    const dock = dockIn(template);

    expect(dock.getAttribute('class')).toBe('qti-shared-stimulus');
    expect(dock.getElementsByTagName('qti-stimulus-body')).toHaveLength(0);
    expect(dock.getElementsByTagName('div')[0]?.getAttribute('class')).toBe('qti-shared-stimulus-wrapper');
    expect(dock.textContent).toContain('unbelievable night');
  });

  test('passes the docked references to the resolver in one batch', async () => {
    const resolver = vi.fn(resolveStimuli);
    const twice = item(
      '<div data-stimulus-idref="Stimulus1"></div><div data-stimulus-idref="Stimulus1"></div>'
    );
    const { template } = await beginAttempt(twice, { resolveStimuli: resolver });

    expect(resolver).toHaveBeenCalledTimes(1);
    expect(resolver).toHaveBeenCalledWith([
      { identifier: 'Stimulus1', href: 'passages/night.xml', title: 'An Unbelievable Night' },
    ]);
    expect(template.match(/unbelievable night/g)).toHaveLength(2);
  });

  test('does not carry over the stimulus stylesheet', async () => {
    const { template } = await beginAttempt(dockedItem, { resolveStimuli });
    expect(template).not.toContain('night.css');
  });

  test('sanitizes the inlined stimulus', async () => {
    const { template } = await beginAttempt(dockedItem, { resolveStimuli });
    expect(template).not.toContain('data-cutie-evaluation');
    expect(template).not.toContain('Spoofed');
  });

  test('resolves stimulus assets with the item assets, naming the stimulus they appear in', async () => {
    const resolveAssets = vi.fn(async (assets: AssetRequest[]) =>
      assets.map(({ url, base }) => `https://cdn/${base ?? 'item'}/${url}`)
    );
    const { template } = await beginAttempt(dockedItem, { resolveStimuli, resolveAssets });

    expect(resolveAssets).toHaveBeenCalledTimes(1);
    expect(resolveAssets).toHaveBeenCalledWith([
      { url: 'images/door.png', base: 'passages/night.xml' },
      { url: 'images/a.png' },
    ]);
    expect(template).toContain('src="https://cdn/passages/night.xml/images/door.png"');
    expect(template).toContain('src="https://cdn/item/images/a.png"');
  });

  test('keeps stimulus asset URLs as authored', async () => {
    const { template } = await beginAttempt(dockedItem, { resolveStimuli });
    expect(template).toContain('src="images/door.png"');
  });

  test('requests the same URL once per document it appears in', async () => {
    const resolveAssets = vi.fn(async (assets: AssetRequest[]) =>
      assets.map(({ url, base }) => `https://cdn/${base ?? 'item'}/${url}`)
    );
    const sameUrl = item(
      '<img src="images/door.png" alt="item door"/><div data-stimulus-idref="Stimulus1"></div><div data-stimulus-idref="Stimulus1"></div>'
    );
    const { template } = await beginAttempt(sameUrl, { resolveStimuli, resolveAssets });

    expect(resolveAssets).toHaveBeenCalledWith([
      { url: 'images/door.png' },
      { url: 'images/door.png', base: 'passages/night.xml' },
      { url: 'images/a.png' },
    ]);
    expect(template.match(/src="https:\/\/cdn\/item\/images\/door.png"/g)).toHaveLength(1);
    expect(template.match(/src="https:\/\/cdn\/passages\/night.xml\/images\/door.png"/g)).toHaveLength(2);
  });

  test('leaves the content of an undocked item alone, and never calls the resolver', async () => {
    const resolver = vi.fn(resolveStimuli);
    const { template } = await beginAttempt(undockedItem, { resolveStimuli: resolver });

    expect(resolver).not.toHaveBeenCalled();
    expect(template).not.toContain('unbelievable night');
    expect(template).toContain('qti-assessment-stimulus-ref');
  });

  test('inlines into a preview', async () => {
    const template = await renderPreview(dockedItem, { resolveStimuli });
    expect(dockIn(template).textContent).toContain('unbelievable night');
  });

  test('does not resolve a dock hidden by a template condition', async () => {
    const resolver = vi.fn(resolveStimuli);
    const hidden = item(`
      <qti-template-block template-identifier="SHOW" identifier="yes" show-hide="show">
        <qti-content-body><div data-stimulus-idref="Stimulus1"></div></qti-content-body>
      </qti-template-block>`).replace(
      '<qti-outcome-declaration',
      `<qti-template-declaration identifier="SHOW" cardinality="single" base-type="identifier">
        <qti-default-value><qti-value>no</qti-value></qti-default-value>
      </qti-template-declaration>
      <qti-outcome-declaration`
    );
    await beginAttempt(hidden, { resolveStimuli: resolver });

    expect(resolver).not.toHaveBeenCalled();
  });

  test('throws without a stimulus resolver', async () => {
    await expect(beginAttempt(dockedItem)).rejects.toThrow('resolveStimuli');
  });

  test('throws when the resolver returns nothing for a stimulus', async () => {
    await expect(beginAttempt(dockedItem, { resolveStimuli: async () => [] })).rejects.toThrow(
      'Stimulus1'
    );
  });

  test('throws when the resolver returns something other than a stimulus', async () => {
    await expect(
      beginAttempt(dockedItem, { resolveStimuli: async () => [undockedItem] })
    ).rejects.toThrow('qti-assessment-stimulus');
  });

  test('throws when a dock names a stimulus the item does not reference', async () => {
    const unknown = item('<div data-stimulus-idref="Missing"></div>');
    await expect(beginAttempt(unknown, { resolveStimuli })).rejects.toThrow('Missing');
  });
});
