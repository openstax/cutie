import { describe, expect, it } from 'vitest';
import { DefaultStyleManager } from '../../styleManager';
import {
  cloneLabel,
  createCorrectAnswer,
  createCorrectAnswerOverline,
  createEvaluationSummary,
  createVerdictMark,
  getVerdict,
  getVerdictText,
  markEvaluated,
  parseDirectedPair,
  readEvaluation,
  wrapInlineEvaluation,
} from './evaluationDisplay';

function parse(html: string): Document {
  return new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html');
}

describe('getVerdict', () => {
  it.each(['correct', 'incorrect', 'partial'])('reads data-cutie-evaluation="%s"', (value) => {
    const el = document.createElement('qti-choice-interaction');
    el.setAttribute('data-cutie-evaluation', value);
    expect(getVerdict(el)).toBe(value);
  });

  it('returns null when absent or unrecognized', () => {
    const el = document.createElement('qti-choice-interaction');
    expect(getVerdict(el)).toBeNull();
    el.setAttribute('data-cutie-evaluation', 'bogus');
    expect(getVerdict(el)).toBeNull();
  });
});

describe('readEvaluation', () => {
  it('returns null when neither verdict nor correct response is present', () => {
    const doc = parse(`
      <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier">
        <qti-default-value><qti-value>A</qti-value></qti-default-value>
      </qti-response-declaration>
      <qti-choice-interaction response-identifier="R1"></qti-choice-interaction>
    `);
    const el = doc.querySelector('qti-choice-interaction')!;
    expect(readEvaluation(el, 'R1')).toBeNull();
  });

  it('reads the verdict and correct response without confusing it with the default value', () => {
    const doc = parse(`
      <qti-response-declaration identifier="R1" cardinality="multiple" base-type="identifier">
        <qti-default-value><qti-value>B</qti-value></qti-default-value>
        <qti-correct-response><qti-value>A</qti-value><qti-value>C</qti-value></qti-correct-response>
      </qti-response-declaration>
      <qti-choice-interaction response-identifier="R1" data-cutie-evaluation="partial"></qti-choice-interaction>
    `);
    const el = doc.querySelector('qti-choice-interaction')!;
    expect(readEvaluation(el, 'R1')).toEqual({ verdict: 'partial', correctResponse: ['A', 'C'] });
  });

  it('registers shared styles only when there is something to draw', () => {
    const doc = parse('<qti-choice-interaction response-identifier="R1"></qti-choice-interaction>');
    const el = doc.querySelector('qti-choice-interaction')!;
    const styleManager = new DefaultStyleManager();

    readEvaluation(el, 'R1', styleManager);
    expect(styleManager.hasStyle('cutie-evaluation')).toBe(false);

    el.setAttribute('data-cutie-evaluation', 'correct');
    readEvaluation(el, 'R1', styleManager);
    expect(styleManager.hasStyle('cutie-evaluation')).toBe(true);
    expect(styleManager.hasStyle('cutie-feedback-icon')).toBe(true);
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

describe('createVerdictMark', () => {
  it.each([
    ['correct', 'Correct', 'cutie-feedback-icon--correct'],
    ['incorrect', 'Incorrect', 'cutie-feedback-icon--incorrect'],
    ['partial', 'Partially correct', 'cutie-feedback-icon--partial'],
  ] as const)('renders an icon plus visible text for %s', (verdict, text, iconClass) => {
    const mark = createVerdictMark(verdict);
    expect(mark.classList.contains(`cutie-verdict--${verdict}`)).toBe(true);
    expect(mark.querySelector(`.${iconClass} svg`)).not.toBeNull();
    // Decorative icon: the visible text is the only text, so it isn't read twice
    expect(mark.querySelector('.cutie-feedback-sr-text')).toBeNull();
    expect(mark.textContent).toBe(text);
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

  it.each([
    ['correct', 'Correct', 'cutie-feedback-icon--correct'],
    ['incorrect', 'Incorrect', 'cutie-feedback-icon--incorrect'],
    ['partial', 'Partially correct', 'cutie-feedback-icon--partial'],
  ] as const)('leads with a titled %s icon and hidden verdict text', (verdict, text, iconClass) => {
    const overline = createCorrectAnswerOverline('Paris', verdict);
    const icon = overline.firstElementChild as HTMLElement;
    expect(icon.classList.contains(iconClass)).toBe(true);
    expect(icon.title).toBe(text);
    expect(overline.textContent).toBe(`${text}. Correct answer: Paris`);
  });
});

describe('wrapInlineEvaluation', () => {
  it('returns the control itself when there is nothing to show', () => {
    const input = document.createElement('input');
    expect(wrapInlineEvaluation(input, 'e', { verdict: null, correctResponse: [] }, null)).toBe(input);
    expect(input.classList.contains('cutie-evaluated')).toBe(false);
  });

  it('wraps the control with a hidden overline that describes it', () => {
    const input = document.createElement('input');
    const wrapper = wrapInlineEvaluation(input, 'e', { verdict: 'incorrect', correctResponse: ['York'] }, 'York');
    expect(wrapper.classList.contains('cutie-inline-evaluation')).toBe(true);
    expect(wrapper.firstElementChild).toBe(input);
    const overline = wrapper.querySelector('#e')!;
    expect(overline.getAttribute('aria-hidden')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('e');
    expect(input.classList.contains('cutie-evaluated--incorrect')).toBe(true);
  });
});

describe('getVerdictText', () => {
  it.each([
    ['correct', 'Correct response'],
    ['incorrect', 'Incorrect response'],
    ['partial', 'Partially correct response'],
  ] as const)('describes the response for %s', (verdict, text) => {
    expect(getVerdictText(verdict)).toBe(text);
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
    expect(createEvaluationSummary({ id: 'e', verdict: null })).toBeNull();
    expect(createEvaluationSummary({ id: 'e', verdict: null, correctAnswer: null })).toBeNull();
  });

  it('renders verdict and correct answer with the given id', () => {
    const summary = createEvaluationSummary({ id: 'e', verdict: 'incorrect', correctAnswer: 'Paris' })!;
    expect(summary.id).toBe('e');
    expect(summary.querySelector('.cutie-verdict--incorrect')).not.toBeNull();
    expect(summary.querySelector('.cutie-correct-answer')?.textContent).toBe('Correct answer: Paris');
    expect(summary.hasAttribute('aria-hidden')).toBe(false);
  });
});

describe('markEvaluated', () => {
  it('adds verdict classes, with an inline modifier for inline controls', () => {
    const block = document.createElement('div');
    markEvaluated(block, 'correct');
    expect(block.className).toBe('cutie-evaluated cutie-evaluated--correct');

    const input = document.createElement('input');
    markEvaluated(input, 'partial', true);
    expect(input.className).toBe('cutie-evaluated cutie-evaluated--partial cutie-evaluated--inline');
  });

  it('does nothing without a verdict', () => {
    const block = document.createElement('div');
    markEvaluated(block, null);
    expect(block.className).toBe('');
  });
});
