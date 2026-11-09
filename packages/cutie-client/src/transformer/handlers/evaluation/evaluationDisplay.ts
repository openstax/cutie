/**
 * Evaluation display: draws the evaluation cutie-core adds to the template
 * once an attempt is finished (see the showEvaluation delivery option).
 *
 * Nothing about correctness is computed here — the client only renders what
 * core sent:
 * - the verdict, a `data-cutie-evaluation` attribute on the item body, judging
 *   the item as a whole (drawn by the item, see createItemVerdict)
 * - the correct response, a `qti-correct-response` in the response declaration
 *
 * Handlers read the correct response with `readEvaluation`, build the marks
 * with these helpers, and decide where to place them. Interactions carry no
 * verdict of their own: response processing can combine responses, so a
 * response judged on its own can mislead.
 */
import { addAriaDescribedBy } from '../../../utils/aria.js';
import type { StyleManager } from '../../types.js';
import { getCorrectResponse, toValueList } from '../responseUtils.js';

const VERDICTS = ['correct', 'incorrect', 'partial'] as const;

export type Verdict = (typeof VERDICTS)[number];

const CORRECT_ANSWER_LABEL = 'Correct answer:';

/**
 * Read the verdict core placed on the item body.
 * Returns null when absent (the response couldn't be judged) or unrecognized.
 */
export function getVerdict(element: Element): Verdict | null {
  const value = element.getAttribute('data-cutie-evaluation');
  return VERDICTS.includes(value as Verdict) ? (value as Verdict) : null;
}

export interface InteractionEvaluation {
  /** Correct response values (one per qti-value) */
  correctResponse: string[];
}

/**
 * Read the evaluation core sent for an interaction: the correct response of
 * its declaration. Returns null when there is none (the attempt isn't
 * finished, or the delivery options hide the correct response).
 * Registers the shared evaluation styles when there is something to draw.
 */
export function readEvaluation(
  element: Element,
  responseIdentifier: string,
  styleManager?: StyleManager
): InteractionEvaluation | null {
  const correctResponse = toValueList(getCorrectResponse(element.ownerDocument, responseIdentifier));
  if (correctResponse.length === 0) return null;

  registerEvaluationStyles(styleManager);
  return { correctResponse };
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
  if (!styleManager.hasStyle(EVALUATION_STYLE_ID)) {
    styleManager.addStyle(EVALUATION_STYLE_ID, EVALUATION_STYLES);
  }
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
 * Create the overline labeling a selected option that is not part of the
 * correct response ("INCORRECT ANSWER", in the incorrect color): plain text,
 * so it is part of the option's accessible name.
 */
export function createIncorrectAnswerOverline(): HTMLSpanElement {
  const overline = document.createElement('span');
  overline.className = 'cutie-correct-answer-overline cutie-correct-answer-overline--incorrect';
  overline.textContent = 'Incorrect answer';
  return overline;
}

/**
 * Create the overline placed above an answer option in its reserved slot
 * (--cutie-overline-slot); the interaction positions it.
 *
 * - With nothing given, it labels an option that is part of the correct
 *   response ("CORRECT ANSWER"): plain text, so it is part of the option's
 *   accessible name.
 * - With a value, it shows the correct response for the option (e.g. the word
 *   that belongs in a gap, or in an inline choice), with a visually hidden
 *   "Correct answer:" prefix for the option to reference via aria-describedby.
 */
export function createCorrectAnswerOverline(value?: string): HTMLSpanElement {
  const overline = document.createElement('span');
  overline.className = 'cutie-correct-answer-overline';
  if (value === undefined) {
    overline.textContent = 'Correct answer';
    return overline;
  }

  overline.classList.add('cutie-correct-answer-overline--value');
  overline.append(createSrText(`${CORRECT_ANSWER_LABEL} `), value);
  return overline;
}

/**
 * Show an inline control's correct answer (a select, an input) in the slot
 * the control reserves above itself, as gap-match shows each gap's. The
 * overline is hidden from the accessibility tree and describes the control,
 * so the inline annotator doesn't fold it into the control's label.
 *
 * Returns the element to place where the control would go: the control
 * wrapped with its overline. The wrapper takes the control's own box, so
 * wrapping shifts nothing.
 */
export function wrapInlineEvaluation(control: HTMLElement, id: string, correctAnswerText: string): HTMLElement {
  const overline = createCorrectAnswerOverline(correctAnswerText);
  overline.id = id;
  overline.setAttribute('aria-hidden', 'true');
  addAriaDescribedBy(control, id);

  const wrapper = document.createElement('span');
  wrapper.className = 'cutie-inline-evaluation';
  wrapper.append(control, overline);
  return wrapper;
}

/**
 * Create visually hidden text, read by assistive technology only.
 */
export function createSrText(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cutie-evaluation-sr-only';
  span.textContent = text;
  return span;
}

export interface EvaluationSummaryOptions {
  /** Id for the summary, so the interaction can reference it via aria-describedby */
  id: string;
  /** Correct-answer content */
  correctAnswer: Node | string | null;
}

/**
 * Create the evaluation summary for an interaction with no options to mark
 * (an extended text): its correct answer. Returns null when there is none.
 */
export function createEvaluationSummary(options: EvaluationSummaryOptions): HTMLElement | null {
  if (options.correctAnswer === null) return null;

  const summary = document.createElement('div');
  summary.className = 'cutie-evaluation';
  summary.id = options.id;
  summary.appendChild(createCorrectAnswer(options.correctAnswer));
  return summary;
}

const EVALUATION_STYLE_ID = 'cutie-evaluation';

/**
 * The "Correct answer" label is colored text: --cutie-feedback-correct
 * promises 4.5:1 contrast.
 */
const EVALUATION_STYLES = `
  .cutie-evaluation {
    margin-top: 0.75em;
    color: var(--cutie-text);
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
    color: var(--cutie-feedback-correct);
  }

  .cutie-correct-answer-overline--incorrect {
    color: var(--cutie-feedback-incorrect);
  }

  /*
   * A value (e.g. a word) keeps its own case and the text color. Its line
   * box (plus a gap) is the --cutie-overline-slot reserved above options.
   */
  .cutie-correct-answer-overline--value {
    font-size: 0.875em;
    line-height: 1.5;
    letter-spacing: normal;
    font-variant-caps: normal;
    color: var(--cutie-text);
  }

  /*
   * An inline control with its evaluation. The control reserves the overline
   * slot as its top margin, so the overline sits in that margin, below the clearance,
   * centered over the control.
   */
  .cutie-inline-evaluation {
    position: relative;
    display: inline-block;
  }

  /*
   * The clearance resolves in the overline's own (0.875em) font size, so it
   * is scaled back to the control's em
   */
  .cutie-inline-evaluation > .cutie-correct-answer-overline {
    position: absolute;
    top: calc(var(--cutie-overline-clearance) / 0.875);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
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
