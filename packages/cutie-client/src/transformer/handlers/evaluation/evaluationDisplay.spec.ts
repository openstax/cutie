import { describe, expect, it } from 'vitest';
import { DefaultStyleManager } from '../../styleManager.js';
import {
  cloneLabel,
  createCorrectAnswer,
  createCorrectAnswerOverline,
  createEvaluationSummary,
  getVerdict,
  parseDirectedPair,
  readEvaluation,
  wrapInlineEvaluation,
} from './evaluationDisplay.js';

function parse(html: string): Document {
  return new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html');
}

describe('getVerdict', () => {
  it.each(['correct', 'incorrect', 'partial'])('reads data-cutie-evaluation="%s"', (value) => {
    const el = document.createElement('qti-item-body');
    el.setAttribute('data-cutie-evaluation', value);
    expect(getVerdict(el)).toBe(value);
  });

  it('returns null when absent or unrecognized', () => {
    const el = document.createElement('qti-item-body');
    expect(getVerdict(el)).toBeNull();
    el.setAttribute('data-cutie-evaluation', 'bogus');
    expect(getVerdict(el)).toBeNull();
  });
});

describe('readEvaluation', () => {
  it('returns null when no correct response is present', () => {
    const doc = parse(`
      <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier">
        <qti-default-value><qti-value>A</qti-value></qti-default-value>
      </qti-response-declaration>
      <qti-choice-interaction response-identifier="R1"></qti-choice-interaction>
    `);
    const el = doc.querySelector('qti-choice-interaction')!;
    expect(readEvaluation(el, 'R1')).toBeNull();
  });

  it('reads the correct response without confusing it with the default value', () => {
    const doc = parse(`
      <qti-response-declaration identifier="R1" cardinality="multiple" base-type="identifier">
        <qti-default-value><qti-value>B</qti-value></qti-default-value>
        <qti-correct-response><qti-value>A</qti-value><qti-value>C</qti-value></qti-correct-response>
      </qti-response-declaration>
      <qti-choice-interaction response-identifier="R1"></qti-choice-interaction>
    `);
    const el = doc.querySelector('qti-choice-interaction')!;
    expect(readEvaluation(el, 'R1')).toEqual({ correctResponse: ['A', 'C'] });
  });

  it('registers shared styles only when there is something to draw', () => {
    const declaration = (correct: string) => `
      <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier">${correct}</qti-response-declaration>
      <qti-choice-interaction response-identifier="R1"></qti-choice-interaction>`;
    const styleManager = new DefaultStyleManager();

    const without = parse(declaration('')).querySelector('qti-choice-interaction')!;
    readEvaluation(without, 'R1', styleManager);
    expect(styleManager.hasStyle('cutie-evaluation')).toBe(false);

    const withCorrect = parse(declaration('<qti-correct-response><qti-value>A</qti-value></qti-correct-response>'))
      .querySelector('qti-choice-interaction')!;
    readEvaluation(withCorrect, 'R1', styleManager);
    expect(styleManager.hasStyle('cutie-evaluation')).toBe(true);
  });
});

describe('parseDirectedPair', () => {
  it('splits source and target', () => {
    expect(parseDirectedPair('S1 T2')).toEqual({ source: 'S1', target: 'T2' });
    expect(parseDirectedPair('  S1   T2 ')).toEqual({ source: 'S1', target: 'T2' });
  });

  it('rejects malformed values', () => {
    expect(parseDirectedPair('S1')).toBeNull();
    expect(parseDirectedPair('S1 T2 X')).toBeNull();
    expect(parseDirectedPair('')).toBeNull();
  });
});

describe('createCorrectAnswer', () => {
  it('labels the content with the small-caps overline, read as "Correct answer: …"', () => {
    const answer = createCorrectAnswer('Paris');
    expect(answer.tagName).toBe('DIV');
    const label = answer.firstElementChild!;
    expect(label.classList.contains('cutie-correct-answer-overline')).toBe(true);
    expect(label.classList.contains('cutie-correct-answer-overline--value')).toBe(false);
    // The colon is visually hidden, so the text still reads naturally
    expect(label.querySelector('.cutie-evaluation-sr-only')!.textContent).toBe(': ');
    expect(answer.textContent).toBe('Correct answer: Paris');
  });
});

describe('createCorrectAnswerOverline', () => {
  it('is plain "Correct answer" text', () => {
    const overline = createCorrectAnswerOverline();
    expect(overline.textContent).toBe('Correct answer');
    expect(overline.children).toHaveLength(0);
  });

  it('shows a value with a hidden "Correct answer:" prefix', () => {
    const overline = createCorrectAnswerOverline('word B');
    expect(overline.querySelector('.cutie-evaluation-sr-only')!.textContent).toBe('Correct answer: ');
    expect(overline.textContent).toBe('Correct answer: word B');
  });
});

describe('wrapInlineEvaluation', () => {
  it('wraps the control with a hidden overline of the correct answer that describes it', () => {
    const input = document.createElement('input');
    const wrapper = wrapInlineEvaluation(input, 'e', 'York');
    expect(wrapper.classList.contains('cutie-inline-evaluation')).toBe(true);
    expect(wrapper.firstElementChild).toBe(input);
    const overline = wrapper.querySelector('#e')!;
    expect(overline.getAttribute('aria-hidden')).toBe('true');
    expect(overline.textContent).toBe('Correct answer: York');
    // The correct answer only: nothing says whether the response matches it
    expect(overline.querySelector('.cutie-feedback-icon')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe('e');
  });
});

describe('cloneLabel', () => {
  it('copies children and strips ids', () => {
    const source = document.createElement('span');
    source.innerHTML = '<b id="x">Bold</b> text';
    const copy = document.createElement('div');
    copy.appendChild(cloneLabel(source));
    expect(copy.textContent).toBe('Bold text');
    expect(copy.querySelector('[id]')).toBeNull();
    expect(source.querySelector('#x')).not.toBeNull();
  });
});

describe('createEvaluationSummary', () => {
  it('returns null when there is nothing to show', () => {
    expect(createEvaluationSummary({ id: 'e', correctAnswer: null })).toBeNull();
  });

  it('renders the correct answer with the given id', () => {
    const summary = createEvaluationSummary({ id: 'e', correctAnswer: 'Paris' })!;
    expect(summary.id).toBe('e');
    expect(summary.querySelector('.cutie-correct-answer')?.textContent).toBe('Correct answer: Paris');
    expect(summary.hasAttribute('aria-hidden')).toBe(false);
  });
});
