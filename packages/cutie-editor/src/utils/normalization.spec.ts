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

describe('ensurePromptFirst', () => {
  it('keeps a gap-match prompt and writes it before the choices', () => {
    const doc = normalizeItemBody(`
      <qti-gap-match-interaction response-identifier="RESPONSE">
        <qti-prompt>Drag a word into the blank.</qti-prompt>
        <qti-gap-text identifier="W" match-max="1">winter</qti-gap-text>
        <p>Now is the <qti-gap identifier="G1"/> of our discontent</p>
      </qti-gap-match-interaction>`);

    const interaction = doc.querySelector('qti-gap-match-interaction')!;
    expect(Array.from(interaction.children).map(child => child.localName)).toEqual(['qti-prompt', 'qti-gap-text', 'p']);
    expect(interaction.querySelector('qti-prompt')?.textContent).toBe('Drag a word into the blank.');
  });

  it.each([
    ['an id on the prompt', '<qti-prompt id="question"/>', 'qti-prompt#question'],
    ['an id on its paragraph', '<qti-prompt><p id="question"/></qti-prompt>', 'qti-prompt > p#question'],
  ])('keeps an empty prompt with %s', (_label, prompt, selector) => {
    const doc = normalizeItemBody(`
      <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
        ${prompt}
        <qti-simple-choice identifier="A">A</qti-simple-choice>
      </qti-choice-interaction>`);

    expect(doc.querySelector(selector)).not.toBeNull();
  });

  it.each([
    ['qti-choice-interaction', '<qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A">A</qti-simple-choice></qti-choice-interaction>'],
    ['qti-extended-text-interaction', '<qti-extended-text-interaction response-identifier="RESPONSE"/>'],
    ['qti-match-interaction', '<qti-match-interaction response-identifier="RESPONSE" max-associations="1"><qti-simple-match-set><qti-simple-associable-choice identifier="S" match-max="1">S</qti-simple-associable-choice></qti-simple-match-set><qti-simple-match-set><qti-simple-associable-choice identifier="T" match-max="1">T</qti-simple-associable-choice></qti-simple-match-set></qti-match-interaction>'],
    ['qti-gap-match-interaction', '<qti-gap-match-interaction response-identifier="RESPONSE"><qti-gap-text identifier="W" match-max="1">winter</qti-gap-text><p>Now is the <qti-gap identifier="G1"/></p></qti-gap-match-interaction>'],
  ])('does not add an empty prompt to a %s without one', (tagName, content) => {
    const doc = normalizeItemBody(content);

    expect(doc.querySelector(tagName)).not.toBeNull();
    expect(doc.querySelector('qti-prompt')).toBeNull();
  });
});

describe('spacer paragraphs', () => {
  it('keep empty paragraphs that have attributes', () => {
    const doc = normalizeItemBody(`
      <section>
        <p id="answer-anchor"/>
        <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
          <qti-prompt>Pick one</qti-prompt>
          <qti-simple-choice identifier="A">A</qti-simple-choice>
        </qti-choice-interaction>
      </section>`);

    expect(doc.querySelector('section > p#answer-anchor')).not.toBeNull();
  });

  it.each(['div', 'blockquote'])('are not saved inside a %s', (tagName) => {
    const doc = normalizeItemBody(`
      <${tagName}>
        <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
          <qti-prompt>Pick one</qti-prompt>
          <qti-simple-choice identifier="A">A</qti-simple-choice>
        </qti-choice-interaction>
      </${tagName}>`);

    const container = doc.querySelector(tagName)!;
    expect(Array.from(container.children).map(child => child.localName)).toEqual(['qti-choice-interaction']);
  });

  it('are not saved inside xhtml containers', () => {
    const doc = normalizeItemBody(`
      <table><tbody><tr><td>
        <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
          <qti-prompt>Pick one</qti-prompt>
          <qti-simple-choice identifier="A">A</qti-simple-choice>
        </qti-choice-interaction>
      </td></tr></tbody></table>`);

    const cell = doc.querySelector('td')!;
    expect(Array.from(cell.children).map(child => child.localName)).toEqual(['qti-choice-interaction']);
  });
});
