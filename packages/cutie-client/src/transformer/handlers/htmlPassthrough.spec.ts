/* spell-checker: ignore MATHML mfrac */
import { describe, expect, it } from 'vitest';
import { parseQtiXml } from '../../parser/xmlParser';
import { createTransformContext, transformChildren } from '../elementTransformer';

const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

function render(bodyXml: string, rootAttributes = ''): HTMLElement {
  const xml = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" ${rootAttributes}
    identifier="item" title="Item" adaptive="false" time-dependent="false">
    <qti-item-body>${bodyXml}</qti-item-body>
  </qti-assessment-item>`;
  const { itemBody } = parseQtiXml(xml);
  const container = document.createElement('div');
  container.appendChild(transformChildren(itemBody, createTransformContext()));
  return container;
}

describe('htmlPassthrough', () => {
  it('creates HTML elements in the HTML namespace', () => {
    const container = render('<p class="lead">Some <em>text</em></p>');

    const p = container.querySelector('p')!;
    expect(p.namespaceURI).toBe(XHTML_NS);
    expect(p.getAttribute('class')).toBe('lead');
    expect(container.querySelector('em')!.namespaceURI).toBe(XHTML_NS);
  });

  it('creates MathML elements in the MathML namespace', () => {
    const container = render(`<p>
      <math xmlns="${MATHML_NS}" display="block">
        <semantics>
          <mfrac><mi>a</mi><mi>b</mi></mfrac>
          <annotation encoding="application/x-tex">\\frac{a}{b}</annotation>
        </semantics>
      </math>
    </p>`);

    const math = container.querySelector('math')!;
    expect(math.namespaceURI).toBe(MATHML_NS);
    expect(math.getAttribute('display')).toBe('block');
    for (const name of ['semantics', 'mfrac', 'mi', 'annotation']) {
      expect(container.querySelector(name)!.namespaceURI).toBe(MATHML_NS);
    }
    expect(container.querySelector('annotation')!.getAttribute('encoding')).toBe(
      'application/x-tex'
    );
  });

  it('drops the prefix from prefixed MathML', () => {
    const container = render(
      '<p><m:math><m:mi>x</m:mi></m:math></p>',
      `xmlns:m="${MATHML_NS}"`
    );

    const math = container.querySelector('p')!.firstElementChild!;
    expect(math.namespaceURI).toBe(MATHML_NS);
    expect(math.localName).toBe('math');
    expect(math.prefix).toBeNull();
    expect(math.firstElementChild!.localName).toBe('mi');
    expect(math.firstElementChild!.namespaceURI).toBe(MATHML_NS);
  });
});
