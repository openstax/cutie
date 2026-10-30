// spell-checker: ignore colspan
import { beforeEach, describe, expect, it } from 'vitest';
import { labelChoiceInteractions } from './choiceInteractions.js';

let idCounter = 0;
const testIdGenerator = () => `s${++idCounter}`;

/** Build a DocumentFragment from an HTML string */
function fragmentFromHtml(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

/** A rendered choice interaction, with a legend when given a prompt */
function choice(prompt?: string): string {
  return `<div class="cutie-choice-interaction">
    <fieldset class="cutie-simple-choice-group">
      ${prompt ? `<legend class="cutie-prompt">${prompt}</legend>` : ''}
      <label class="cutie-simple-choice"><input type="checkbox" value="A"><span>Option A</span></label>
    </fieldset>
  </div>`;
}

function groups(fragment: DocumentFragment): Element[] {
  return Array.from(fragment.querySelectorAll('fieldset'));
}

describe('labelChoiceInteractions', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  it('labels a prompt-less group in a table cell by its row then column headers', () => {
    const fragment = fragmentFromHtml(`<table>
      <thead><tr><th scope="col">Categories</th><th scope="col">Potential Orders</th></tr></thead>
      <tbody>
        <tr><th scope="row">Activity</th><td>${choice()}</td></tr>
        <tr><th scope="row">Medications</th><td>${choice()}</td></tr>
      </tbody>
    </table>`);
    labelChoiceInteractions(fragment, testIdGenerator);

    const [activity, medications] = groups(fragment);
    expect(activity!.getAttribute('aria-labelledby')).toBe('s1 s2');
    expect(medications!.getAttribute('aria-labelledby')).toBe('s3 s2');
    expect(fragment.getElementById('s1')!.textContent).toBe('Activity');
    expect(fragment.getElementById('s2')!.textContent).toBe('Potential Orders');
    expect(fragment.getElementById('s3')!.textContent).toBe('Medications');
  });

  it('reuses header IDs the author gave', () => {
    const fragment = fragmentFromHtml(`<table>
      <tr><th scope="row" id="cat-activity">Activity</th><td>${choice()}</td></tr>
    </table>`);
    labelChoiceInteractions(fragment, testIdGenerator);

    expect(groups(fragment)[0]!.getAttribute('aria-labelledby')).toBe('cat-activity');
  });

  it('uses the headers the cell names in its headers attribute', () => {
    const fragment = fragmentFromHtml(`<table>
      <tr><th id="h-orders">Potential Orders</th><th id="h-other">Other</th></tr>
      <tr><th scope="row">Activity</th><td headers="h-orders">${choice()}</td></tr>
    </table>`);
    labelChoiceInteractions(fragment, testIdGenerator);

    expect(groups(fragment)[0]!.getAttribute('aria-labelledby')).toBe('h-orders');
  });

  it('leaves a group named by its prompt alone', () => {
    const fragment = fragmentFromHtml(`<table>
      <tr><th scope="row">Activity</th><td>${choice('Select the activity orders')}</td></tr>
    </table>`);
    labelChoiceInteractions(fragment, testIdGenerator);

    expect(groups(fragment)[0]!.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('leaves a group that already has an ARIA label alone', () => {
    const fragment = fragmentFromHtml(`<table>
      <tr><th scope="row">Activity</th><td>${choice()}</td></tr>
    </table>`);
    groups(fragment)[0]!.setAttribute('aria-label', 'Existing');
    labelChoiceInteractions(fragment, testIdGenerator);

    expect(groups(fragment)[0]!.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('leaves a prompt-less group outside a table unnamed', () => {
    const fragment = fragmentFromHtml(`<p>Select the orders.</p>${choice()}`);
    labelChoiceInteractions(fragment, testIdGenerator);

    expect(groups(fragment)[0]!.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('leaves a prompt-less group unnamed in a table with spanned cells', () => {
    const fragment = fragmentFromHtml(`<table>
      <tr><th colspan="2">Orders</th></tr>
      <tr><th scope="row">Activity</th><td>${choice()}</td></tr>
    </table>`);
    labelChoiceInteractions(fragment, testIdGenerator);

    expect(groups(fragment)[0]!.hasAttribute('aria-labelledby')).toBe(false);
  });
});
