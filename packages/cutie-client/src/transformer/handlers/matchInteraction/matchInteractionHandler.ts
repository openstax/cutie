// cspell:ignore draggables distractors subgrid
import { createMissingAttributeError } from '../../../errors/errorDisplay.js';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../../errors/validationDisplay.js';
import { addAriaDescribedBy } from '../../../utils/aria.js';
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

/** The rendered choices of an interaction, by identifier. */
const getChoicesById = (container: HTMLElement): Map<string, HTMLElement> => {
  const choices = new Map<string, HTMLElement>();
  for (const choice of container.querySelectorAll<HTMLElement>('.cutie-match-choice')) {
    const id = choice.getAttribute('data-identifier');
    if (id) choices.set(id, choice);
  }
  return choices;
};

/**
 * The displayed labels of the given choices, comma separated, for a
 * correct-answer key; a choice that isn't found shows its identifier.
 */
const joinChoiceLabels = (ids: string[], choices: Map<string, HTMLElement>): DocumentFragment => {
  const content = document.createDocumentFragment();
  ids.forEach((id, index) => {
    if (index > 0) content.append(', ');
    const label = choices.get(id)?.querySelector('.cutie-match-choice-label');
    content.append(label ? cloneLabel(label) : id);
  });
  return content;
};

/** A target column in the grouped (bowtie) layout, with the sources banked under it. */
interface GroupedColumn {
  target: Element;
  targetId: string;
  matchMax: number;
  sources: Element[];
  /** Number of slots drawn: one per unit of the target's capacity. */
  capacity: number;
}

const getAssociableChoices = (matchSet: Element): Element[] =>
  Array.from(matchSet.children).filter(
    (child) => child.tagName.toLowerCase() === 'qti-simple-associable-choice'
  );

const getMatchGroups = (choice: Element): string[] =>
  (choice.getAttribute('match-group') ?? '').split(/\s+/).filter(Boolean);

/**
 * A choice's plain-text name, used for announcements and accessible labels: its
 * text, or the alt text of its images when it has no text of its own.
 */
const getChoiceText = (choice: Element): string =>
  choice.textContent?.trim()
  || Array.from(choice.querySelectorAll('img'), (img) => img.getAttribute('alt') ?? '')
    .join(' ')
    .trim();

const getMatchMax = (choice: Element): number => {
  const parsed = parseInt(choice.getAttribute('match-max') ?? '1', 10);
  return isNaN(parsed) ? 1 : parsed;
};

/**
 * Plan the grouped (bowtie) layout, or return null when the match isn't a
 * well-formed bowtie and should render as a classic two-set match instead.
 *
 * A well-formed bowtie partitions the sources into the target columns:
 * - every source names exactly one target identifier in its match-group
 * - every target is named by at least one source
 * - a target with a match-group of its own names every source in its bank
 * - every target's slots can be filled (match-max ≤ the sources in its bank;
 *   extra sources are distractors)
 * - all the slots can be filled at once (total slots ≤ max-associations, when
 *   the interaction limits associations)
 *
 * Anything else (a source with no or an unknown match-group, a source naming
 * several targets, a target that excludes one of its sources, a column or set
 * of columns that can't be filled) falls back to the classic layout, where
 * match-group still restricts pairing.
 */
function planGroupedColumns(
  sourceChoices: Element[],
  targetChoices: Element[],
  maxAssociations: number
): GroupedColumn[] | null {
  const columns = new Map<string, GroupedColumn>();
  for (const target of targetChoices) {
    const targetId = target.getAttribute('identifier');
    if (!targetId) return null;
    columns.set(targetId, { target, targetId, matchMax: getMatchMax(target), sources: [], capacity: 0 });
  }

  for (const source of sourceChoices) {
    const groups = getMatchGroups(source);
    const column = groups.length === 1 ? columns.get(groups[0]) : undefined;
    if (!source.getAttribute('identifier') || !column) return null;
    column.sources.push(source);
  }

  for (const column of columns.values()) {
    const bankSize = column.sources.length;
    if (bankSize === 0 || column.matchMax > bankSize) return null;

    const targetGroups = getMatchGroups(column.target);
    if (targetGroups.length
      && column.sources.some((source) => !targetGroups.includes(source.getAttribute('identifier') ?? ''))) {
      return null;
    }

    // Unbounded targets fall back to max-associations, capped by the bank.
    column.capacity = column.matchMax > 0
      ? column.matchMax
      : maxAssociations > 0 ? Math.min(maxAssociations, bankSize) : bankSize;
  }

  const planned = Array.from(columns.values());
  const totalSlots = planned.reduce((sum, column) => sum + column.capacity, 0);
  if (maxAssociations > 0 && totalSlots > maxAssociations) return null;

  return planned;
}

function buildMatchConstraintText(min: number, max: number): string | null {
  if (min > 0 && max > 0 && min !== max) {
    return `Make between ${min} and ${max} matches.`;
  }
  if (min > 0) {
    return `Make at least ${min} match${min === 1 ? '' : 'es'}.`;
  }
  return null;
}

/**
 * Handler for qti-match-interaction elements.
 * Creates a two-set layout where items from either set can be associated.
 *
 * QTI Structure:
 * - qti-match-interaction[response-identifier, shuffle?, max-associations?]
 *   - qti-prompt
 *   - qti-simple-match-set (source set)
 *     - qti-simple-associable-choice[identifier, match-max]
 *   - qti-simple-match-set (target set)
 *     - qti-simple-associable-choice[identifier, match-max]
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

    // Grouped (bowtie) layout: when the sources' match-groups partition them into
    // the target columns, render one column per target choice with per-group
    // source banks instead of two sets side by side. The interaction stays a
    // legal two-set directedPair match — only the presentation changes, derived
    // from the target set.
    const groupedColumns = planGroupedColumns(
      getAssociableChoices(matchSets[0]),
      getAssociableChoices(matchSets[1]),
      maxAssociations
    );

    if (groupedColumns) {
      controller.enableGroupedMode();
      // Pass through QTI shared vocabulary (qti-choices-*) so CSS can position
      // each column's bank; flag the interaction so grouped styles are scoped.
      const sourceClasses = element.getAttribute('class');
      if (sourceClasses) {
        container.classList.add(...sourceClasses.split(/\s+/).filter(Boolean));
      }
      container.classList.add('cutie-match-interaction--grouped');

      container.appendChild(
        this.createColumns(groupedColumns, controller, context, responseIdentifier)
      );
    } else {
      // Classic two-set layout with orientation from the QTI class attribute.
      // Note: choices are pre-shuffled by the server in renderTemplate.
      const layoutContainer = document.createElement('div');
      layoutContainer.className = 'cutie-match-layout';

      const qtiClass = element.getAttribute('class') ?? '';
      if (qtiClass.includes('qti-match-source-right')) {
        layoutContainer.classList.add('cutie-match-source-right');
      } else if (qtiClass.includes('qti-match-source-top')) {
        layoutContainer.classList.add('cutie-match-source-top');
      } else if (qtiClass.includes('qti-match-source-bottom')) {
        layoutContainer.classList.add('cutie-match-source-bottom');
      } else {
        layoutContainer.classList.add('cutie-match-source-left');
      }

      layoutContainer.appendChild(
        this.createMatchSet(matchSets[0], 'source', controller, context)
      );
      layoutContainer.appendChild(
        this.createMatchSet(matchSets[1], 'target', controller, context)
      );

      container.appendChild(layoutContainer);
    }

    // Evaluation of a finished attempt when the delivery options show one,
    // or the last try's verdict on a fresh try
    const evaluation = readEvaluation(element, responseIdentifier, context.styleManager);

    // Add constraint message if min-associations > 0. A finished attempt with
    // a verdict describes the response in its place, so it is announced with
    // the group; the status rail is the visual verdict.
    let constraint: ConstraintMessage | undefined;
    const verdict = evaluation?.verdict ?? null;
    const associationText = buildMatchConstraintText(minAssociations, maxAssociations);
    let constraintText = verdict ? getVerdictText(verdict) : associationText;
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

    // Draw the evaluation: the status rail and the correct answer, placed to
    // suit the layout. The verdict is in the constraint text.
    if (evaluation) {
      const pairs = evaluation.correctResponse
        .map(parseDirectedPair)
        .filter((pair): pair is DirectedPair => pair !== null);
      if (groupedColumns) {
        this.drawGroupedKey(container, pairs, responseIdentifier);
      } else {
        this.drawClassicKey(container, pairs, responseIdentifier);
      }
      markEvaluated(container, evaluation.verdict);
    }
    clearVerdictOnEdit(context, responseIdentifier, evaluation, () => {
      clearEvaluated(container);
      clearConstraintVerdict(constraint, container, associationText);
      constraintText = associationText;
    });

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, (options) => {
        const response = controller.getResponse();
        const isValid = minAssociations <= 0 || response.length >= minAssociations;

        if (options?.silent) {
          return { value: response.length > 0 ? response : null, valid: isValid };
        }

        if (!isValid) {
          container.setAttribute('aria-invalid', 'true');
          constraint?.setError(true);
          if (constraintText) announce(context, constraintText, 'assertive');
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
   * Create a single choice: a wrapper holding the choice element and its chips
   * container as siblings (avoids nested draggables). Registers the choice with
   * the controller. tabindex defaults to -1; callers seed the roving tabbable.
   */
  private createChoiceWrapper(
    choiceElement: Element,
    setType: 'source' | 'target',
    controller: MatchController,
    context: TransformContext
  ): { wrapper: HTMLElement; choice: HTMLElement; identifier: string } | null {
    const identifier = choiceElement.getAttribute('identifier');
    if (!identifier) {
      console.warn('qti-simple-associable-choice missing identifier, skipping');
      return null;
    }

    const matchMax = getMatchMax(choiceElement);
    const content = getChoiceText(choiceElement);

    const wrapper = document.createElement('div');
    wrapper.className = 'cutie-match-choice-wrapper';

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
    wrapper.appendChild(choiceDiv);

    // Chips container as sibling (not inside choice)
    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'cutie-match-choice-chips';
    wrapper.appendChild(chipsContainer);

    controller.registerChoice(
      identifier, setType, choiceDiv, matchMax, content, getMatchGroups(choiceElement)
    );

    return { wrapper, choice: choiceDiv, identifier };
  }

  /**
   * Classic key: under each choice (above its chips, and reciprocally, like the
   * chips) the choices it is correctly matched with, by their displayed labels.
   * Each choice is described by its own correct answer.
   */
  private drawClassicKey(
    container: HTMLElement,
    pairs: DirectedPair[],
    responseIdentifier: string
  ): void {
    const choices = getChoicesById(container);

    const partners = new Map<string, string[]>();
    const addPartner = (id: string, partner: string) => {
      partners.set(id, [...(partners.get(id) ?? []), partner]);
    };
    for (const { source, target } of pairs) {
      addPartner(source, target);
      addPartner(target, source);
    }

    for (const [id, partnerIds] of partners) {
      const choice = choices.get(id);
      const chips = choice?.parentElement?.querySelector('.cutie-match-choice-chips');
      if (!choice || !chips) continue;

      const answer = createCorrectAnswer(joinChoiceLabels(partnerIds, choices));
      answer.id = `evaluation-${responseIdentifier}-${id}`;
      chips.before(answer);
      addAriaDescribedBy(choice, answer.id);
    }
  }

  /**
   * Grouped (bowtie) key: under each column's last slot, the sources that belong
   * there, by their displayed labels — like the per-gap key of a gap match. A
   * source's column is already shown by the bank it sits in, so sources carry
   * no key of their own. Each slot of the column is described by the key.
   */
  private drawGroupedKey(
    container: HTMLElement,
    pairs: DirectedPair[],
    responseIdentifier: string
  ): void {
    const choices = getChoicesById(container);
    const correctByTarget = new Map<string, string[]>();
    for (const { source, target } of pairs) {
      correctByTarget.set(target, [...(correctByTarget.get(target) ?? []), source]);
    }

    for (const column of container.querySelectorAll<HTMLElement>('.cutie-match-column')) {
      const targetId = column.getAttribute('data-match-group');
      const sourceIds = targetId ? correctByTarget.get(targetId) : undefined;
      const slots = column.querySelector<HTMLElement>('.cutie-match-slots');
      if (!targetId || !sourceIds || !slots) continue;

      const answer = createCorrectAnswer(joinChoiceLabels(sourceIds, choices));
      answer.id = `evaluation-${responseIdentifier}-${targetId}`;
      for (const slot of slots.querySelectorAll<HTMLElement>('.cutie-match-slot')) {
        addAriaDescribedBy(slot, answer.id);
      }
      // Inside the slots' grid row: the column's subgrid has no row of its own for it
      slots.append(answer);
    }
  }

  /**
   * Create a match set container with its choices (classic two-set layout).
   * Choices are already in the correct (potentially shuffled) order from the server.
   */
  private createMatchSet(
    matchSetElement: Element,
    setType: 'source' | 'target',
    controller: MatchController,
    context: TransformContext
  ): HTMLElement {
    const setContainer = document.createElement('div');
    setContainer.className = `cutie-match-set cutie-match-set--${setType}`;
    setContainer.setAttribute('role', 'listbox');
    setContainer.setAttribute('aria-label', `${setType === 'source' ? 'Source' : 'Target'} choices`);

    // Seed one tabbable choice per set; the rest join its roving group.
    let isFirst = true;
    for (const choiceElement of getAssociableChoices(matchSetElement)) {
      const created = this.createChoiceWrapper(choiceElement, setType, controller, context);
      if (!created) continue;
      created.choice.setAttribute('tabindex', isFirst ? '0' : '-1');
      setContainer.appendChild(created.wrapper);
      isFirst = false;
    }

    return setContainer;
  }

  /**
   * Create the grouped (bowtie) layout from a planned set of columns (see
   * planGroupedColumns). Each column is a per-group bank of the source choices
   * whose match-group names that target, then a plain HEADER plus a fixed row of
   * slot boxes (the drop targets). The bank comes first in the DOM because the
   * QTI vocabulary asks for choices to be presented before targets to assistive
   * technology; the interaction's qti-choices-* class only repositions each
   * bank visually (via CSS). Columns are derived entirely from the target set —
   * no authored layout grid needed.
   */
  private createColumns(
    columns: GroupedColumn[],
    controller: MatchController,
    context: TransformContext,
    responseIdentifier: string
  ): HTMLElement {
    const columnsRow = document.createElement('div');
    columnsRow.className = 'cutie-match-columns';

    for (const { target, targetId, matchMax, sources, capacity } of columns) {
      const targetContent = getChoiceText(target);

      const column = document.createElement('div');
      column.className = 'cutie-match-column';
      column.setAttribute('data-match-group', targetId);

      // Header + slots share the "target" grid area so qti-choices-* positioning places
      // them together opposite the bank.
      const targetArea = document.createElement('div');
      targetArea.className = 'cutie-match-choice-wrapper';

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
      controller.registerGroupedTarget(
        targetId, header, matchMax, targetContent, getMatchGroups(target)
      );

      // Draw one slot per unit of capacity.
      const slots = document.createElement('div');
      slots.className = 'cutie-match-slots';
      slots.setAttribute('role', 'group');
      slots.setAttribute('aria-labelledby', labelId);
      for (let i = 0; i < capacity; i++) {
        const slot = this.createSlot();
        controller.registerGroupedSlot(slot, targetId, i + 1, capacity);
        slots.appendChild(slot);
      }
      targetArea.appendChild(slots);

      // Per-group source bank, labelled by the column header.
      const bank = document.createElement('div');
      bank.className = 'cutie-match-bank';
      bank.setAttribute('role', 'listbox');
      bank.setAttribute('data-match-group', targetId);
      bank.setAttribute('aria-labelledby', labelId);

      let isFirstInBank = true;
      for (const sourceChoice of sources) {
        const created = this.createChoiceWrapper(sourceChoice, 'source', controller, context);
        if (!created) continue;
        created.choice.setAttribute('tabindex', isFirstInBank ? '0' : '-1');
        bank.appendChild(created.wrapper);
        isFirstInBank = false;
      }

      controller.registerGroupedBank(bank);
      column.append(bank, targetArea);
      columnsRow.appendChild(column);
    }

    return columnsRow;
  }

  /**
   * Create a single empty slot: one unit of target capacity shown under a grouped column
   * header. Holds a placeholder (shown when empty) and a content span (shown
   * when filled). The controller labels it and wires its interactions.
   */
  private createSlot(): HTMLElement {
    const slot = document.createElement('div');
    slot.className = 'cutie-match-slot';
    slot.setAttribute('role', 'button');
    slot.setAttribute('tabindex', '-1');
    slot.setAttribute('draggable', 'false');

    const placeholder = document.createElement('span');
    placeholder.className = 'cutie-match-slot-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    slot.appendChild(placeholder);

    const content = document.createElement('span');
    content.className = 'cutie-match-slot-content';
    content.style.display = 'none';
    slot.appendChild(content);

    return slot;
  }
}
