/**
 * Evaluation display: draws the evaluation cutie-core adds to the template
 * once an attempt is finished (see the showEvaluation delivery option).
 *
 * Nothing about correctness is computed here — the client only renders what
 * core sent:
 * - the verdict, a `data-evaluation` attribute on the interaction element
 * - the correct response, a `qti-correct-response` in the response declaration
 *
 * Handlers read both with `readEvaluation`, build the marks with these helpers,
 * and decide where to place them. The verdict is never conveyed by color alone
 * (WCAG 1.4.1): colored marks are paired with an icon or text that carries
 * the verdict, and screen readers get the same information as text.
 */
import { addAriaDescribedBy } from '../../../utils/aria';
import type { StyleManager } from '../../types';
import {
  createFeedbackIcon,
  FEEDBACK_ICON_STYLES,
  type IconType,
} from '../feedback/feedbackIcons';
import { getCorrectResponse, toValueList } from '../responseUtils';

const VERDICTS = ['correct', 'incorrect', 'partial'] as const;

export type Verdict = (typeof VERDICTS)[number];

/**
 * Partial uses the info color with its own half-filled icon: distinct from
 * correct and incorrect, and from neutral info feedback.
 */
const VERDICT_CONFIG: Record<Verdict, { text: string; icon: IconType }> = {
  correct: { text: 'Correct', icon: 'correct' },
  incorrect: { text: 'Incorrect', icon: 'incorrect' },
  partial: { text: 'Partially correct', icon: 'partial' },
};

const CORRECT_ANSWER_LABEL = 'Correct answer:';

/**
 * Read the verdict core placed on an interaction element.
 * Returns null when absent (the response couldn't be judged) or unrecognized.
 */
export function getVerdict(element: Element): Verdict | null {
  const value = element.getAttribute('data-evaluation');
  return VERDICTS.includes(value as Verdict) ? (value as Verdict) : null;
}

export interface InteractionEvaluation {
  /** Verdict from data-evaluation, or null when the response couldn't be judged */
  verdict: Verdict | null;
  /** Correct response values (one per qti-value); empty when not provided */
  correctResponse: string[];
}

/**
 * Read the evaluation core sent for an interaction: its verdict and the
 * correct response of its declaration. Returns null when there is neither
 * (the attempt isn't finished, or the delivery options hide the evaluation).
 * Registers the shared evaluation styles when there is something to draw.
 */
export function readEvaluation(
  element: Element,
  responseIdentifier: string,
  styleManager?: StyleManager
): InteractionEvaluation | null {
  const verdict = getVerdict(element);
  const correctResponse = toValueList(getCorrectResponse(element.ownerDocument, responseIdentifier));
  if (!verdict && correctResponse.length === 0) return null;

  registerEvaluationStyles(styleManager);
  return { verdict, correctResponse };
}

/**
 * Split a directedPair value ("SOURCE TARGET") into its two identifiers.
 */
export function parseDirectedPair(value: string): { source: string; target: string } | null {
  const [source, target, ...rest] = value.trim().split(/\s+/);
  if (!source || !target || rest.length > 0) return null;
  return { source, target };
}

/**
 * Copy an element's rendered children for reuse as a label elsewhere
 * (e.g. a choice's content in a correct-answer list). Ids are stripped so the
 * copy doesn't duplicate them.
 */
export function cloneLabel(source: Element): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const child of Array.from(source.childNodes)) {
    const copy = child.cloneNode(true);
    if (copy instanceof Element) {
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    }
    fragment.appendChild(copy);
  }
  return fragment;
}

/**
 * Register the shared evaluation styles (idempotent).
 */
export function registerEvaluationStyles(styleManager?: StyleManager): void {
  if (!styleManager) return;
  if (!styleManager.hasStyle('cutie-feedback-icon')) {
    styleManager.addStyle('cutie-feedback-icon', FEEDBACK_ICON_STYLES);
  }
  if (!styleManager.hasStyle(EVALUATION_STYLE_ID)) {
    styleManager.addStyle(EVALUATION_STYLE_ID, EVALUATION_STYLES);
  }
}

/**
 * Style an interaction's control or container with the verdict color
 * (a border; the accompanying verdict mark carries the text).
 *
 * @param inline - true for inline controls (select, input): colors their own
 *   border; otherwise a leading border is drawn on the block container
 */
export function markEvaluated(target: HTMLElement, verdict: Verdict | null, inline = false): void {
  if (!verdict) return;
  target.classList.add('cutie-evaluated', `cutie-evaluated--${verdict}`);
  if (inline) target.classList.add('cutie-evaluated--inline');
}

/**
 * Create the verdict mark: an icon plus visible text ("Correct", "Incorrect",
 * "Partially correct").
 */
export function createVerdictMark(verdict: Verdict): HTMLSpanElement {
  const config = VERDICT_CONFIG[verdict];

  const mark = document.createElement('span');
  mark.className = `cutie-verdict cutie-verdict--${verdict}`;
  mark.appendChild(createFeedbackIcon(config.icon, { decorative: true }));

  const text = document.createElement('span');
  text.className = 'cutie-verdict__text';
  text.textContent = config.text;
  mark.appendChild(text);

  return mark;
}

/**
 * Create a correct-answer block: the "CORRECT ANSWER" overline label (the same
 * label the choice interaction puts on its correct choices) above the content.
 * A visually hidden colon keeps "Correct answer: <content>" as the text read
 * wherever the block describes an interaction.
 *
 * @param content - Text, or rendered content (e.g. a cloned label or a list)
 */
export function createCorrectAnswer(content: Node | string): HTMLElement {
  const answer = document.createElement('div');
  answer.className = 'cutie-correct-answer';

  const label = createCorrectAnswerOverline();
  label.appendChild(createSrText(': '));
  answer.appendChild(label);

  const value = document.createElement('div');
  value.className = 'cutie-correct-answer__value';
  value.append(content);
  answer.appendChild(value);

  return answer;
}

/**
 * Create the overline placed above an answer option in its reserved slot
 * (--cutie-overline-slot); the interaction positions it.
 *
 * - With nothing given, it labels an option that is part of the correct
 *   response ("CORRECT ANSWER"): plain text, so it is part of the option's
 *   accessible name.
 * - With a value, it shows the correct response for the option (e.g. the word
 *   that belongs in a gap), with a visually hidden "Correct answer:" prefix for
 *   the option to reference via aria-describedby.
 * - With a verdict, the verdict's icon comes first, titled and with visually
 *   hidden verdict text: for options that are their own interaction (an inline
 *   choice, a text entry), so each carries its own verdict.
 */
export function createCorrectAnswerOverline(value?: string, verdict?: Verdict | null): HTMLSpanElement {
  const overline = document.createElement('span');
  overline.className = 'cutie-correct-answer-overline';
  if (value === undefined && !verdict) {
    overline.textContent = 'Correct answer';
    return overline;
  }

  overline.classList.add('cutie-correct-answer-overline--value');

  if (verdict) {
    // The hidden text sits inside the icon, so it (not the title, a hover
    // tooltip) is the icon's text wherever the overline is read
    const { icon, text } = VERDICT_CONFIG[verdict];
    const verdictIcon = createFeedbackIcon(icon, { decorative: true });
    verdictIcon.title = text;
    verdictIcon.appendChild(createSrText(`${text}. `));
    overline.appendChild(verdictIcon);
  }

  if (value !== undefined) {
    overline.append(createSrText(`${CORRECT_ANSWER_LABEL} `), value);
  }
  return overline;
}

/**
 * Show an inline control's evaluation (a select, an input): the verdict color
 * on the control and, in the slot the control reserves above itself, an
 * overline with the verdict icon and the correct answer. The overline is
 * hidden from the accessibility tree and describes the control, so the inline
 * annotator doesn't fold it into the control's label.
 *
 * Returns the element to place where the control would go: the control
 * wrapped with its overline, or the control itself when there is nothing to
 * show. The wrapper takes the control's own box, so wrapping shifts nothing.
 */
export function wrapInlineEvaluation(
  control: HTMLElement,
  id: string,
  evaluation: InteractionEvaluation,
  correctAnswerText: string | null
): HTMLElement {
  if (!evaluation.verdict && correctAnswerText === null) return control;

  markEvaluated(control, evaluation.verdict, true);

  const overline = createCorrectAnswerOverline(correctAnswerText ?? undefined, evaluation.verdict);
  overline.id = id;
  overline.setAttribute('aria-hidden', 'true');
  addAriaDescribedBy(control, id);

  const wrapper = document.createElement('span');
  wrapper.className = 'cutie-inline-evaluation';
  wrapper.append(control, overline);
  return wrapper;
}

function createSrText(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cutie-evaluation-sr-only';
  span.textContent = text;
  return span;
}

/**
 * Text describing the learner's response by its verdict ("Incorrect response"),
 * for an interaction to announce with its control.
 */
export function getVerdictText(verdict: Verdict): string {
  return VERDICT_RESPONSE_TEXT[verdict];
}

const VERDICT_RESPONSE_TEXT: Record<Verdict, string> = {
  correct: 'Correct response',
  incorrect: 'Incorrect response',
  partial: 'Partially correct response',
};

export interface EvaluationSummaryOptions {
  /** Id for the summary, so the interaction can reference it via aria-describedby */
  id: string;
  verdict: Verdict | null;
  /** Correct-answer content, when the handler shows it in the summary */
  correctAnswer?: Node | string | null;
}

/**
 * Create the evaluation summary for an interaction: the verdict mark followed
 * by the correct answer, when either is present. Returns null when there is
 * nothing to show.
 */
export function createEvaluationSummary(options: EvaluationSummaryOptions): HTMLElement | null {
  const { id, verdict, correctAnswer } = options;
  const hasCorrectAnswer = correctAnswer !== undefined && correctAnswer !== null;
  if (!verdict && !hasCorrectAnswer) return null;

  const summary = document.createElement('div');
  summary.className = 'cutie-evaluation';
  summary.id = id;

  if (verdict) summary.appendChild(createVerdictMark(verdict));
  if (hasCorrectAnswer) summary.appendChild(createCorrectAnswer(correctAnswer));

  return summary;
}

const EVALUATION_STYLE_ID = 'cutie-evaluation';

/**
 * Verdict colors come from the feedback theme variables. Text stays in
 * --cutie-text: --cutie-feedback-correct/info only promise 3:1 (non-text)
 * contrast, so they color icons and borders only.
 */
const EVALUATION_STYLES = `
  .cutie-evaluated--correct,
  .cutie-verdict--correct {
    --cutie-verdict-color: var(--cutie-feedback-correct);
  }

  .cutie-evaluated--incorrect,
  .cutie-verdict--incorrect {
    --cutie-verdict-color: var(--cutie-feedback-incorrect);
  }

  .cutie-evaluated--partial,
  .cutie-verdict--partial {
    --cutie-verdict-color: var(--cutie-feedback-info);
  }

  .cutie-evaluated:not(.cutie-evaluated--inline) {
    border-inline-start: var(--cutie-status-rail-width) solid var(--cutie-verdict-color);
    padding-inline-start: var(--cutie-status-rail-gap);
  }

  /* Color only: the control keeps its own border width, so nothing shifts */
  .cutie-evaluated.cutie-evaluated--inline {
    border-color: var(--cutie-verdict-color);
  }

  .cutie-evaluation {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5em;
    margin-top: 0.75em;
    color: var(--cutie-text);
  }

  .cutie-verdict {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    padding: 0.15em 0.6em;
    border: 2px solid var(--cutie-verdict-color);
    border-radius: 999px;
    font-weight: 600;
    color: var(--cutie-text);
    background-color: var(--cutie-bg);
  }

  .cutie-verdict .cutie-feedback-icon {
    color: var(--cutie-verdict-color);
  }

  .cutie-correct-answer > .cutie-correct-answer-overline {
    display: block;
  }

  .cutie-correct-answer__value {
    margin-top: 0.25em;
  }

  /*
   * Small caps rather than text-transform: uppercase, which browsers carry
   * into the accessible name ("CORRECT ANSWER" can be read letter by letter).
   * Its line box is 1.125em.
   */
  .cutie-correct-answer-overline {
    font-size: 1em;
    font-weight: 600;
    line-height: 1.125;
    letter-spacing: 0.05em;
    font-variant-caps: all-small-caps;
    color: var(--cutie-text);
  }

  /* A value (e.g. a word) keeps its own case; the same 1.125em line box */
  .cutie-correct-answer-overline--value {
    font-size: 0.75em;
    line-height: 1.5;
    letter-spacing: normal;
    font-variant-caps: normal;
  }

  /*
   * An inline control with its evaluation. The control reserves the overline
   * slot as its top margin, so the overline sits at the top of this box,
   * centered over the control.
   */
  .cutie-inline-evaluation {
    position: relative;
    display: inline-block;
  }

  .cutie-inline-evaluation > .cutie-correct-answer-overline {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    white-space: nowrap;
  }

  /*
   * Center the verdict icon on the overline text. The icon's inline nudge
   * (translateY, tuned for icons sitting in running text) would push it
   * below center here.
   */
  .cutie-correct-answer-overline .cutie-feedback-icon {
    align-self: center;
  }

  .cutie-correct-answer-overline .cutie-feedback-icon__svg {
    display: block;
    transform: none;
  }

  .cutie-evaluation-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
