// cspell:ignore subgrid
import { createMissingAttributeError } from '../../../errors/errorDisplay.js';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../../errors/validationDisplay.js';
import { announce } from '../../../utils/liveRegion.js';
import type { ElementHandler, InteractionState, TransformContext } from '../../types.js';
import {
  clearConstraintVerdict,
  clearEvaluated,
  clearVerdictOnEdit,
  cloneLabel,
  createCorrectAnswer,
  getVerdictText,
  markEvaluated,
  parseDirectedPair,
  readEvaluation,
} from '../evaluation/index.js';
import { getDefaultValue } from '../responseUtils.js';
import { MatchController } from './controller.js';
import { MATCH_INTERACTION_STYLES } from './styles.js';

type DirectedPair = NonNullable<ReturnType<typeof parseDirectedPair>>;

const getAssociableChoices = (matchSet: Element): Element[] =>
  Array.from(matchSet.children).filter(
    (child) => child.tagName.toLowerCase() === 'qti-simple-associable-choice'
  );

const getMatchGroups = (choice: Element): string[] =>
  (choice.getAttribute('match-group') ?? '').split(/\s+/).filter(Boolean);

/**
 * A choice's plain-text name, used for announcements and accessible labels: its
 * text, with each image's alt text in its place, so an image that identifies
 * the choice isn't lost beside text of its own.
 */
const getChoiceText = (choice: Element): string => {
  const parts: string[] = [];
  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? '');
    } else if (node instanceof Element && node.tagName.toLowerCase() === 'img') {
      parts.push(` ${node.getAttribute('alt') ?? ''} `);
    } else {
      node.childNodes.forEach(walk);
    }
  };
  choice.childNodes.forEach(walk);
  return parts.join('').replace(/\s+/g, ' ').trim();
};

const parseCount = (choice: Element, attribute: string, fallback: number): number => {
  const parsed = parseInt(choice.getAttribute(attribute) ?? String(fallback), 10);
  return isNaN(parsed) ? fallback : parsed;
};

const getMatchMax = (choice: Element): number => parseCount(choice, 'match-max', 1);
const getMatchMin = (choice: Element): number => parseCount(choice, 'match-min', 0);

/**
 * Plan one word bank per target column, or return null to bank every source
 * together. Per-column banks are used when the sources' match-groups partition
 * them into the target columns: every source names exactly one target
 * identifier, and every target is named by at least one source.
 */
function planColumnBanks(
  sourceChoices: Element[],
  targetChoices: Element[]
): Map<string, Element[]> | null {
  const banks = new Map<string, Element[]>();
  for (const target of targetChoices) {
    const targetId = target.getAttribute('identifier');
    if (targetId) banks.set(targetId, []);
  }

  for (const source of sourceChoices) {
    const groups = getMatchGroups(source);
    const bank = groups.length === 1 ? banks.get(groups[0]) : undefined;
    if (!bank) return null;
    bank.push(source);
  }

  for (const bank of banks.values()) {
    if (bank.length === 0) return null;
  }

  return banks;
}

/**
 * A sentence of the constraint text, with the minimum it asks for: of the
 * whole response (min-associations), or of one choice (its match-min).
 */
interface ConstraintSentence {
  text: string;
  min: number;
  choiceId?: string;
}

/**
 * The constraint sentences: the interaction's min/max-associations, then the
 * match-min of each choice that has one.
 */
function buildConstraintSentences(min: number, max: number, choices: Element[]): ConstraintSentence[] {
  const plural = (n: number) => `${n} match${n === 1 ? '' : 'es'}`;
  const sentences: ConstraintSentence[] = [];

  if (min > 0 && max > 0 && min !== max) {
    sentences.push({ text: `Make between ${min} and ${max} matches.`, min });
  } else if (min > 0) {
    sentences.push({ text: `Make at least ${plural(min)}.`, min });
  }

  for (const choice of choices) {
    const choiceId = choice.getAttribute('identifier');
    const matchMin = getMatchMin(choice);
    if (!choiceId || matchMin <= 0) continue;
    const exact = matchMin === getMatchMax(choice);
    sentences.push({
      text: `Make ${exact ? '' : 'at least '}${plural(matchMin)} for ${getChoiceText(choice)}.`,
      min: matchMin,
      choiceId,
    });
  }

  return sentences;
}

const joinSentences = (sentences: ConstraintSentence[]): string | null =>
  sentences.length > 0 ? sentences.map((sentence) => sentence.text).join(' ') : null;

/**
 * Handler for qti-match-interaction elements.
 *
 * Sources are drawn in word banks and each target as a column: a header over
 * slots that sources are placed into. When the sources' match-groups partition
 * them by target, each column gets its own bank (a "bowtie"); otherwise every
 * source shares one bank. The interaction stays a plain two-set directedPair
 * match — only the presentation is derived from the choices.
 *
 * QTI Structure:
 * - qti-match-interaction[response-identifier, shuffle?, max-associations?]
 *   - qti-prompt
 *   - qti-simple-match-set (source set)
 *     - qti-simple-associable-choice[identifier, match-max, match-min?, match-group?]
 *   - qti-simple-match-set (target set)
 *     - qti-simple-associable-choice[identifier, match-max, match-min?, match-group?]
 */
export class MatchInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-match-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-match-interaction')) {
      context.styleManager.addStyle('cutie-match-interaction', MATCH_INTERACTION_STYLES);
    }

    // Get required response-identifier
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      fragment.appendChild(
        createMissingAttributeError('qti-match-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Get optional attributes
    const maxAssociations = parseInt(element.getAttribute('max-associations') ?? '0', 10);
    const minAssociations = parseInt(element.getAttribute('min-associations') ?? '0', 10) || 0;

    // Create main container
    const container = document.createElement('div');
    container.className = 'cutie-match-interaction cutie-status-rail';
    container.setAttribute('data-response-identifier', responseIdentifier);
    container.setAttribute('role', 'group');

    // Find elements
    const children = Array.from(element.children);
    const promptElement = children.find(
      (child) => child.tagName.toLowerCase() === 'qti-prompt'
    );
    const matchSets = children.filter(
      (child) => child.tagName.toLowerCase() === 'qti-simple-match-set'
    );

    if (matchSets.length !== 2) {
      console.warn('qti-match-interaction requires exactly 2 qti-simple-match-set elements');
      fragment.appendChild(container);
      return fragment;
    }

    // Transform prompt if present
    const promptId = `prompt-${responseIdentifier}`;
    if (promptElement && context.transformChildren) {
      const promptDiv = document.createElement('div');
      promptDiv.className = 'cutie-prompt';
      promptDiv.id = promptId;
      promptDiv.appendChild(context.transformChildren(promptElement));
      container.appendChild(promptDiv);
      container.setAttribute('aria-labelledby', promptId);
    } else {
      container.setAttribute('aria-label', 'Match interaction');
    }

    // Create the controller
    const controller = new MatchController(
      responseIdentifier,
      context,
      container,
      maxAssociations
    );

    // Note: choices are pre-shuffled by the server in renderTemplate.
    const sourceChoices = getAssociableChoices(matchSets[0]);
    const targetChoices = getAssociableChoices(matchSets[1]);
    const columnBanks = planColumnBanks(sourceChoices, targetChoices);

    // Pass through QTI shared vocabulary (qti-choices-*) so CSS can position
    // the bank(s) relative to the target columns.
    const sourceClasses = element.getAttribute('class');
    if (sourceClasses) {
      container.classList.add(...sourceClasses.split(/\s+/).filter(Boolean));
    }
    container.classList.add(
      columnBanks ? 'cutie-match-interaction--column-banks' : 'cutie-match-interaction--shared-bank'
    );

    // The bank(s) come before the target slots in the DOM because the QTI
    // vocabulary asks for choices to be presented before targets to assistive
    // technology; qti-choices-* only repositions them visually.
    const body = document.createElement('div');
    body.className = 'cutie-match-body';
    if (!columnBanks) {
      body.appendChild(this.createBank(sourceChoices, { label: 'Available choices' }, controller, context));
    }

    const columnsRow = document.createElement('div');
    columnsRow.className = 'cutie-match-columns';
    for (const target of targetChoices) {
      const column = this.createColumn(
        target, columnBanks, controller, context, responseIdentifier
      );
      if (column) columnsRow.appendChild(column);
    }
    body.appendChild(columnsRow);
    container.appendChild(body);

    // Evaluation of a finished attempt when the delivery options show one,
    // or the last try's verdict on a fresh try
    const evaluation = readEvaluation(element, responseIdentifier, context.styleManager);

    // Add constraint message for min-associations and match-min. A finished
    // attempt with a verdict describes the response in its place, so it is
    // announced with the group; the status rail is the visual verdict.
    let constraint: ConstraintMessage | undefined;
    const verdict = evaluation?.verdict ?? null;
    const constraintSentences = buildConstraintSentences(
      minAssociations, maxAssociations, [...sourceChoices, ...targetChoices]
    );
    const associationText = joinSentences(constraintSentences);
    const constraintText = verdict ? getVerdictText(verdict) : associationText;
    if (constraintText) {
      constraint = createConstraintMessage(
        `constraint-${responseIdentifier}`,
        constraintText,
        context.styleManager,
      );
      container.appendChild(constraint.element);

      const existingDescribedBy = container.getAttribute('aria-describedby');
      container.setAttribute(
        'aria-describedby',
        existingDescribedBy
          ? `${existingDescribedBy} ${constraint.element.id}`
          : constraint.element.id
      );
    }

    // Initialize controller after all choices are registered
    controller.initialize();

    // Initialize with default values if present
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null) {
      const defaults = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      controller.initializeFromDefaults(defaults);
    }

    // Draw the evaluation: the status rail and each column's correct answer.
    // The verdict is in the constraint text.
    if (evaluation) {
      const pairs = evaluation.correctResponse
        .map(parseDirectedPair)
        .filter((pair): pair is DirectedPair => pair !== null);
      this.drawKey(container, pairs, controller, responseIdentifier);
      markEvaluated(container, evaluation.verdict);
    }
    clearVerdictOnEdit(context, responseIdentifier, evaluation, () => {
      clearEvaluated(container);
      clearConstraintVerdict(constraint, container, associationText);
    });

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, (options) => {
        const response = controller.getResponse();
        const unmet = constraintSentences.filter((sentence) =>
          (sentence.choiceId ? controller.associationCount(sentence.choiceId) : response.length) < sentence.min
        );
        const isValid = unmet.length === 0;

        if (options?.silent) {
          return { value: response.length > 0 ? response : null, valid: isValid };
        }

        if (!isValid) {
          container.setAttribute('aria-invalid', 'true');
          constraint?.setError(true);
          // The constraint text keeps every requirement as a hint; only the
          // ones still unmet are announced.
          announce(context, joinSentences(unmet) ?? '', 'assertive');
          return { value: response.length > 0 ? response : null, valid: false };
        }

        container.removeAttribute('aria-invalid');
        constraint?.setError(false);
        return { value: response.length > 0 ? response : null, valid: true };
      });

      // Observe interaction enabled state
      const observer = (state: { interactionState: InteractionState }) => {
        controller.setEnabled(state.interactionState === 'enabled');
      };

      context.itemState.addObserver(observer);

      // Set initial state
      controller.setEnabled(context.itemState.interactionState === 'enabled');
    }

    fragment.appendChild(container);
    return fragment;
  }

  /**
   * Create a word bank (a listbox) of source choices, named either by a
   * referenced element (aria-labelledby — e.g. its column's header) or a
   * literal string, and register its sources with the controller.
   */
  private createBank(
    sources: Element[],
    naming: { label: string } | { labelledBy: string },
    controller: MatchController,
    context: TransformContext
  ): HTMLElement {
    const bank = document.createElement('div');
    bank.className = 'cutie-match-bank';
    bank.setAttribute('role', 'listbox');
    if ('labelledBy' in naming) {
      bank.setAttribute('aria-labelledby', naming.labelledBy);
    } else {
      bank.setAttribute('aria-label', naming.label);
    }

    for (const source of sources) {
      const choice = this.createSourceChoice(source, controller, context);
      if (choice) bank.appendChild(choice);
    }

    controller.registerBank(bank);
    return bank;
  }

  /**
   * Create a source choice and register it with the controller. The
   * controller seeds its tabindex once every bank is built.
   */
  private createSourceChoice(
    choiceElement: Element,
    controller: MatchController,
    context: TransformContext
  ): HTMLElement | null {
    const identifier = choiceElement.getAttribute('identifier');
    if (!identifier) {
      console.warn('qti-simple-associable-choice missing identifier, skipping');
      return null;
    }

    const matchMax = getMatchMax(choiceElement);
    const content = getChoiceText(choiceElement);

    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'cutie-match-choice';
    choiceDiv.setAttribute('role', 'option');
    choiceDiv.setAttribute('aria-selected', 'false');
    choiceDiv.setAttribute('data-identifier', identifier);
    choiceDiv.setAttribute('data-match-max', String(matchMax));
    choiceDiv.setAttribute('tabindex', '-1');
    choiceDiv.setAttribute('draggable', 'true');

    // Label — use transformChildren for rich content (HTML/MathML)
    const labelSpan = document.createElement('span');
    labelSpan.className = 'cutie-match-choice-label';
    if (context.transformChildren) {
      labelSpan.appendChild(context.transformChildren(choiceElement));
    } else {
      labelSpan.textContent = content;
    }
    choiceDiv.appendChild(labelSpan);

    controller.registerSource(
      identifier, choiceDiv, getMatchMin(choiceElement), matchMax, content, getMatchGroups(choiceElement)
    );

    return choiceDiv;
  }

  /**
   * Create a target column: its own bank of sources when the banks are per
   * column, then a plain header over the slots the controller draws.
   */
  private createColumn(
    target: Element,
    columnBanks: Map<string, Element[]> | null,
    controller: MatchController,
    context: TransformContext,
    responseIdentifier: string
  ): HTMLElement | null {
    const targetId = target.getAttribute('identifier');
    if (!targetId) {
      console.warn('qti-simple-associable-choice missing identifier, skipping');
      return null;
    }

    const targetContent = getChoiceText(target);

    const column = document.createElement('div');
    column.className = 'cutie-match-column';
    column.setAttribute('data-target-id', targetId);

    // Header + slots share the target grid area so qti-choices-* positioning
    // places them together opposite the bank.
    const targetArea = document.createElement('div');
    targetArea.className = 'cutie-match-target';

    const header = document.createElement('div');
    header.className = 'cutie-match-target-header';
    const labelId = `cutie-match-label-${responseIdentifier}-${targetId}`;
    header.id = labelId;
    if (context.transformChildren) {
      header.appendChild(context.transformChildren(target));
    } else {
      header.textContent = targetContent;
    }
    targetArea.appendChild(header);

    const slots = document.createElement('div');
    slots.className = 'cutie-match-slots';
    slots.setAttribute('role', 'group');
    slots.setAttribute('aria-labelledby', labelId);
    targetArea.appendChild(slots);

    controller.registerTarget(
      targetId, header, slots, getMatchMin(target), getMatchMax(target), targetContent, getMatchGroups(target)
    );

    const bankSources = columnBanks?.get(targetId);
    if (bankSources) {
      const bank = this.createBank(bankSources, { labelledBy: labelId }, controller, context);
      bank.setAttribute('data-target-id', targetId);
      column.appendChild(bank);
    }
    column.appendChild(targetArea);

    return column;
  }

  /**
   * The correct-answer key: under each column's slots, the sources that belong
   * there, by their displayed labels — like the per-gap key of a gap match.
   * Every slot of the column is described by the key.
   */
  private drawKey(
    container: HTMLElement,
    pairs: DirectedPair[],
    controller: MatchController,
    responseIdentifier: string
  ): void {
    const choices = new Map<string, HTMLElement>();
    for (const choice of container.querySelectorAll<HTMLElement>('.cutie-match-choice')) {
      const id = choice.getAttribute('data-identifier');
      if (id) choices.set(id, choice);
    }

    const correctByTarget = new Map<string, string[]>();
    for (const { source, target } of pairs) {
      correctByTarget.set(target, [...(correctByTarget.get(target) ?? []), source]);
    }

    for (const column of container.querySelectorAll<HTMLElement>('.cutie-match-column')) {
      const targetId = column.getAttribute('data-target-id');
      const sourceIds = targetId ? correctByTarget.get(targetId) : undefined;
      const slots = column.querySelector<HTMLElement>('.cutie-match-slots');
      if (!targetId || !sourceIds || !slots) continue;

      const content = document.createDocumentFragment();
      sourceIds.forEach((id, index) => {
        if (index > 0) content.append(', ');
        const label = choices.get(id)?.querySelector('.cutie-match-choice-label');
        content.append(label ? cloneLabel(label) : id);
      });

      const answer = createCorrectAnswer(content);
      answer.id = `evaluation-${responseIdentifier}-${targetId}`;
      // Inside the slots' grid row: the column's subgrid has no row of its own for it
      slots.append(answer);
      controller.describeTarget(targetId, answer.id);
    }
  }
}
