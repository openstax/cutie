import { Editor } from 'slate';
import { describe, expect, it } from 'vitest';
import { createQtiEditor } from '../editor/createQtiEditor.js';
import { serializeSlateToQti } from '../serialization/slateToXml.js';
import { parseXmlToSlate } from '../serialization/xmlToSlate.js';

/**
 * Load an item body into an editor, normalize it, and return the serialized item
 */
function normalizeItemBody(content: string): Document {
  const input = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
${content}
  </qti-item-body>
</qti-assessment-item>`;
  const editor = createQtiEditor();
  editor.children = parseXmlToSlate(input);
  Editor.normalize(editor, { force: true });
  const { xml } = serializeSlateToQti(editor.children, input);
  return new DOMParser().parseFromString(xml, 'application/xml');
}

describe('wrapFeedbackContentInContentBody', () => {
  it('moves loose feedback block content into a qti-content-body', () => {
    const doc = normalizeItemBody(`
      <p>Question</p>
      <qti-feedback-block outcome-identifier="FEEDBACK" identifier="F1" show-hide="show">
        <p>Explanation</p>
      </qti-feedback-block>`);

    const feedback = doc.querySelector('qti-feedback-block')!;
    expect(Array.from(feedback.children).map(child => child.localName)).toEqual(['qti-content-body']);
    expect(feedback.querySelector('qti-content-body > p')?.textContent).toBe('Explanation');
  });

  it('leaves an existing qti-content-body alone', () => {
    const doc = normalizeItemBody(`
      <p>Question</p>
      <qti-feedback-block outcome-identifier="FEEDBACK" identifier="F1" show-hide="show">
        <qti-content-body><p>Explanation</p></qti-content-body>
      </qti-feedback-block>`);

    const feedback = doc.querySelector('qti-feedback-block')!;
    expect(feedback.querySelectorAll('qti-content-body')).toHaveLength(1);
    expect(feedback.querySelector('qti-content-body > p')?.textContent).toBe('Explanation');
  });
});
