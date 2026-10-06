/* spell-checker: ignore parsererror */
import { beginAttempt, submitResponse } from '@openstax/cutie-core';
import { classifyResponseProcessing } from '@openstax/cutie-editor/utils/responseProcessingClassifier';
import { describe, expect, it } from 'vitest';
import type { Sample } from './types';
import { samples } from './index';

type Submission = Record<string, string | string[]>;

/* one incorrect submission per automatically scored sample */
const incorrectSubmissions: Record<string, Submission> = {
  choice: { RESPONSE: 'choiceC' },
  'choice-multiple': { RESPONSE: ['choiceA', 'choiceC'] },
  'text-entry': { RESPONSE: 'joule' },
  'text-entry-numeric': { RESPONSE: '10' },
  'text-entry-multiple': { RESPONSE: 'hydrogen', RESPONSE_2: 'carbon' },
  'inline-choice': { RESPONSE: 'increases' },
  'inline-choice-multiple': { RESPONSE: 'second', RESPONSE_2: 'netForce' },
  match: { RESPONSE: ['proteins nucleotides', 'nucleicAcids aminoAcids', 'carbohydrates monosaccharides'] },
  'gap-match': { RESPONSE: ['water G1', 'carbonDioxide G2', 'oxygen G3'] },
  formula: { RESPONSE: '2x+3' },
};

/* mapped text entries: forgiving word forms, case-sensitive symbols */
const acceptedVariants: Record<string, Submission[]> = {
  'text-entry': [{ RESPONSE: 'Newtons' }, { RESPONSE: 'N' }],
  'text-entry-multiple': [{ RESPONSE: 'Hydrogen', RESPONSE_2: 'OXYGEN' }, { RESPONSE: 'H', RESPONSE_2: 'O' }],
};

const rejectedVariants: Record<string, Submission[]> = {
  'text-entry': [{ RESPONSE: 'n' }],
  'text-entry-multiple': [{ RESPONSE: 'h', RESPONSE_2: 'O' }, { RESPONSE: 'H', RESPONSE_2: 'o' }],
};

const SHUFFLED_INTERACTIONS = [
  'qti-choice-interaction',
  'qti-inline-choice-interaction',
  'qti-match-interaction',
  'qti-gap-match-interaction',
];

const FEEDBACK_ELEMENTS = 'qti-feedback-block, qti-feedback-inline, qti-modal-feedback';

const parse = (xml: string): Document => new DOMParser().parseFromString(xml, 'application/xml');

const isExternallyScored = (doc: Document): boolean =>
  doc.querySelector('qti-outcome-declaration[identifier="SCORE"]')?.hasAttribute('external-scored') ?? false;

const responseDeclarations = (doc: Document): Element[] =>
  Array.from(doc.querySelectorAll('qti-response-declaration'));

const correctSubmission = (doc: Document): Submission => Object.fromEntries(
  responseDeclarations(doc).map(decl => {
    const values = Array.from(decl.querySelectorAll('qti-correct-response > qti-value'))
      .map(value => value.textContent ?? '');
    return [
      decl.getAttribute('identifier') ?? '',
      decl.getAttribute('cardinality') === 'single' ? values[0] : values,
    ];
  })
);

const feedbackIdentifiers = (root: Document | Element): string[] =>
  Array.from(root.querySelectorAll(FEEDBACK_ELEMENTS))
    .map(element => element.getAttribute('identifier') ?? '');

/* sanitized templates only include feedback that is currently shown */
const submitAndListFeedback = async (sample: Sample, submission: Submission) => {
  const { state } = await beginAttempt(sample.item);
  const result = await submitResponse(submission, state, sample.item);
  return { state: result.state, shownFeedback: feedbackIdentifiers(parse(result.template)) };
};

describe('samples', () => {
  it('have unique ids', () => {
    const ids = samples.map(sample => sample.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe.each(samples)('$id sample', (sample) => {
  const doc = parse(sample.item);
  const body = doc.querySelector('qti-item-body')!;

  it('is well-formed XML', () => {
    expect(doc.querySelector('parsererror')).toBeNull();
  });

  it('has a description', () => {
    expect(sample.description.trim()).not.toBe('');
  });

  it('has a one-line summary', () => {
    expect(sample.summary.trim()).not.toBe('');
    expect(sample.summary).not.toContain('\n');
  });

  it('lists the interaction types it uses', () => {
    const used = new Set(Array.from(body.querySelectorAll('*'))
      .map(element => element.tagName.match(/^qti-(.+)-interaction$/)?.[1])
      .filter((type): type is string => type !== undefined));
    expect(new Set(sample.interactionTypes)).toEqual(used);
  });

  it('uses response processing the editor can manage', () => {
    expect(classifyResponseProcessing(doc).mode).not.toBe('custom');
  });

  it('declares a correct response for every response', () => {
    if (isExternallyScored(doc)) return;
    for (const decl of responseDeclarations(doc)) {
      expect(decl.querySelectorAll('qti-correct-response > qti-value').length,
        decl.getAttribute('identifier') ?? '').toBeGreaterThan(0);
    }
  });

  it('sets every feedback identifier it shows', () => {
    const setIdentifiers = new Set(
      Array.from(doc.querySelectorAll('qti-response-processing qti-base-value[base-type="identifier"]'))
        .map(value => value.textContent?.trim())
    );
    for (const identifier of feedbackIdentifiers(body)) {
      expect(setIdentifiers).toContain(identifier);
    }
  });

  it('leaves verdict styling to the delivery system', () => {
    expect(body.querySelectorAll('[data-feedback-type]')).toHaveLength(0);
  });

  it('shuffles selectable options', () => {
    for (const interaction of body.querySelectorAll(SHUFFLED_INTERACTIONS.join(', '))) {
      expect(interaction.getAttribute('shuffle'), interaction.tagName).toBe('true');
    }
  });

  it('requires a selection in choice interactions', () => {
    for (const interaction of body.querySelectorAll('qti-choice-interaction')) {
      expect(interaction.getAttribute('min-choices')).toBe('1');
    }
  });

  it('requires a response in text entries', () => {
    for (const interaction of body.querySelectorAll('qti-text-entry-interaction')) {
      expect(interaction.getAttribute('pattern-mask')).toBe('.+');
      expect(interaction.getAttribute('data-patternmask-message')).toBe('Response required');
    }
  });

  it('requires a selection in drop-downs', () => {
    for (const interaction of body.querySelectorAll('qti-inline-choice-interaction')) {
      expect(interaction.getAttribute('required')).toBe('true');
    }
  });

  it('requires every gap to be filled', () => {
    for (const interaction of body.querySelectorAll('qti-gap-match-interaction')) {
      expect(interaction.getAttribute('min-associations'))
        .toBe(String(interaction.querySelectorAll('qti-gap').length));
    }
  });

  it('requires a response in extended text', () => {
    for (const interaction of body.querySelectorAll('qti-extended-text-interaction')) {
      expect(interaction.getAttribute('min-strings')).toBe('1');
    }
  });

  it('shows a character counter on free-text extended text', () => {
    for (const interaction of body.querySelectorAll('qti-extended-text-interaction')) {
      const responseIdentifier = interaction.getAttribute('response-identifier');
      const decl = doc.querySelector(`qti-response-declaration[identifier="${responseIdentifier}"]`);
      if (decl?.getAttribute('data-response-type') === 'formula') continue;
      expect(interaction.hasAttribute('expected-length')).toBe(true);
      expect(interaction.classList.contains('qti-counter-up')).toBe(true);
    }
  });

  if (isExternallyScored(doc)) {
    it('awaits manual scoring after submission', async () => {
      const { state } = await submitAndListFeedback(sample, { RESPONSE: 'A learner response.' });
      expect(state.pendingManualScoring).toBeTruthy();
    });
    return;
  }

  it('scores the correct response as fully correct', async () => {
    const { state, shownFeedback } = await submitAndListFeedback(sample, correctSubmission(doc));
    expect(state.score?.max).toBeGreaterThan(0);
    expect(state.score?.raw).toBe(state.score?.max);
    if (feedbackIdentifiers(body).includes('RESPONSE_correct')) {
      expect(shownFeedback).toContain('RESPONSE_correct');
      expect(shownFeedback).not.toContain('RESPONSE_incorrect');
    }
  });

  it.each(acceptedVariants[sample.id] ?? [])('scores the accepted variant %j as correct', async (submission) => {
    const { state } = await submitAndListFeedback(sample, submission);
    expect(state.score?.raw).toBe(state.score?.max);
  });

  it.each(rejectedVariants[sample.id] ?? [])('scores the rejected variant %j as incorrect', async (submission) => {
    const { state } = await submitAndListFeedback(sample, submission);
    expect(state.score?.raw).toBe(0);
  });

  it('scores an incorrect response as incorrect', async () => {
    const submission = incorrectSubmissions[sample.id];
    expect(submission, 'add an incorrect submission for this sample').toBeDefined();
    const { state, shownFeedback } = await submitAndListFeedback(sample, submission);
    expect(state.score?.raw).toBe(0);
    if (feedbackIdentifiers(body).includes('RESPONSE_incorrect')) {
      expect(shownFeedback).toContain('RESPONSE_incorrect');
      expect(shownFeedback).not.toContain('RESPONSE_correct');
    }
  });
});
