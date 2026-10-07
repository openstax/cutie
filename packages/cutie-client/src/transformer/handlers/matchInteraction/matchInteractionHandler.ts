// cspell:ignore draggables
import { createMissingAttributeError } from '../../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../../errors/validationDisplay';
import { announce } from '../../../utils/liveRegion';
import type { ElementHandler, TransformContext } from '../../types';
import { getDefaultValue } from '../responseUtils';
import { MatchController } from './controller';
import { MATCH_INTERACTION_STYLES } from './styles';

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
    container.className = 'cutie-match-interaction';
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

    // Grouped (bowtie) mode: when source choices carry match-group, render one
    // column per target choice with per-group source banks instead of two sets
    // side by side. The interaction stays a legal two-set directedPair match —
    // only the presentation changes, derived from the target set.
    const sourceChoiceEls = Array.from(matchSets[0].children).filter(
      (child) => child.tagName.toLowerCase() === 'qti-simple-associable-choice'
    );
    const grouped = sourceChoiceEls.some((child) => child.hasAttribute('match-group'));

    if (grouped) {
      controller.enableGroupedMode();
      // Pass through QTI shared vocabulary (qti-choices-*) so CSS can position
      // each column's bank; flag the interaction so grouped styles are scoped.
      const sourceClasses = element.getAttribute('class');
      if (sourceClasses) {
        container.classList.add(...sourceClasses.split(/\s+/).filter(Boolean));
      }
      container.classList.add('cutie-match-interaction--grouped');

      container.appendChild(
        this.createColumns(
          matchSets[0], matchSets[1], controller, context, responseIdentifier, maxAssociations
        )
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
        this.createMatchSet(matchSets[0], 'source', controller, context, responseIdentifier)
      );
      layoutContainer.appendChild(
        this.createMatchSet(matchSets[1], 'target', controller, context, responseIdentifier)
      );

      container.appendChild(layoutContainer);
    }

    // Add constraint message if min-associations > 0
    let constraint: ConstraintMessage | undefined;
    const constraintText = buildMatchConstraintText(minAssociations, maxAssociations);
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

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, () => {
        const response = controller.getResponse();
        const isValid = minAssociations <= 0 || response.length >= minAssociations;

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
      const observer = (state: { interactionsEnabled: boolean }) => {
        controller.setEnabled(state.interactionsEnabled);
      };

      context.itemState.addObserver(observer);

      // Set initial state
      controller.setEnabled(context.itemState.interactionsEnabled);
    }

    fragment.appendChild(container);
    return fragment;
  }

  /**
   * Create a single choice: a wrapper holding the choice element and its chips
   * container as siblings (avoids nested draggables). Registers the choice with
   * the controller. tabindex defaults to -1; callers seed the roving tabbable.
   * Label ids are scoped by response-identifier so repeated choice identifiers
   * across interactions on one page stay unique.
   */
  private createChoiceWrapper(
    choiceElement: Element,
    setType: 'source' | 'target',
    controller: MatchController,
    context: TransformContext,
    responseIdentifier: string,
    matchGroups: string[]
  ): { wrapper: HTMLElement; choice: HTMLElement; identifier: string; labelId: string } | null {
    const identifier = choiceElement.getAttribute('identifier');
    if (!identifier) {
      console.warn('qti-simple-associable-choice missing identifier, skipping');
      return null;
    }

    const matchMaxAttr = parseInt(choiceElement.getAttribute('match-max') ?? '1', 10);
    const matchMax = isNaN(matchMaxAttr) ? 1 : matchMaxAttr;
    const content = choiceElement.textContent ?? '';

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
    const labelId = `cutie-match-label-${responseIdentifier}-${identifier}`;
    labelSpan.id = labelId;
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

    controller.registerChoice(identifier, setType, choiceDiv, matchMax, content, matchGroups);

    return { wrapper, choice: choiceDiv, identifier, labelId };
  }

  /**
   * Create a match set container with its choices (classic two-set layout).
   * Choices are already in the correct (potentially shuffled) order from the server.
   */
  private createMatchSet(
    matchSetElement: Element,
    setType: 'source' | 'target',
    controller: MatchController,
    context: TransformContext,
    responseIdentifier: string
  ): HTMLElement {
    const setContainer = document.createElement('div');
    setContainer.className = `cutie-match-set cutie-match-set--${setType}`;
    setContainer.setAttribute('role', 'listbox');
    setContainer.setAttribute('aria-label', `${setType === 'source' ? 'Source' : 'Target'} choices`);

    const choiceElements = Array.from(matchSetElement.children).filter(
      (child) => child.tagName.toLowerCase() === 'qti-simple-associable-choice'
    );

    // Seed one tabbable choice per set; the rest join its roving group.
    let isFirst = true;
    for (const choiceElement of choiceElements) {
      const created = this.createChoiceWrapper(
        choiceElement, setType, controller, context, responseIdentifier, []
      );
      if (!created) continue;
      created.choice.setAttribute('tabindex', isFirst ? '0' : '-1');
      setContainer.appendChild(created.wrapper);
      isFirst = false;
    }

    return setContainer;
  }

  /**
   * Create the grouped (bowtie) layout: one column per target choice. Each
   * column is a plain HEADER plus a fixed row of slot boxes (the drop targets),
   * and a per-group bank of the source choices whose match-group names that
   * target. The slot count is the target's capacity — its match-max, falling back
   * to the interaction's max-associations (capped by the bank size) when the
   * target is unbounded. The interaction's qti-choices-* class positions each
   * bank relative to its header/slots (via CSS). Columns are derived entirely
   * from the target set — no authored layout grid needed.
   */
  private createColumns(
    sourceSetElement: Element,
    targetSetElement: Element,
    controller: MatchController,
    context: TransformContext,
    responseIdentifier: string,
    maxAssociations: number
  ): HTMLElement {
    const columnsRow = document.createElement('div');
    columnsRow.className = 'cutie-match-columns';

    const sourceChoices = Array.from(sourceSetElement.children).filter(
      (child) => child.tagName.toLowerCase() === 'qti-simple-associable-choice'
    );
    const targetChoices = Array.from(targetSetElement.children).filter(
      (child) => child.tagName.toLowerCase() === 'qti-simple-associable-choice'
    );

    const groupsOf = (choice: Element): string[] =>
      (choice.getAttribute('match-group') ?? '').split(/\s+/).filter(Boolean);

    // A source is banked once, under the first target column its match-group
    // names, so a stray multi-group value can't register it twice.
    const placedSources = new Set<string>();

    for (const targetChoice of targetChoices) {
      const targetId = targetChoice.getAttribute('identifier');
      if (!targetId) {
        console.warn('qti-simple-associable-choice (target) missing identifier, skipping');
        continue;
      }

      const matchMaxRaw = parseInt(targetChoice.getAttribute('match-max') ?? '1', 10);
      const targetMatchMax = isNaN(matchMaxRaw) ? 1 : matchMaxRaw;
      const targetContent = targetChoice.textContent ?? '';

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
        header.appendChild(context.transformChildren(targetChoice));
      } else {
        header.textContent = targetContent;
      }
      targetArea.appendChild(header);
      controller.registerGroupedTarget(targetId, header, targetMatchMax, targetContent);

      // The sources that may fill this column.
      const columnSources = sourceChoices.filter((sc) => {
        const id = sc.getAttribute('identifier');
        return id && !placedSources.has(id) && groupsOf(sc).includes(targetId);
      });

      // Draw one slot per unit of capacity.
      const bankSize = columnSources.length;
      const capacity = Math.max(
        1,
        targetMatchMax > 0
          ? targetMatchMax
          : maxAssociations > 0 ? Math.min(maxAssociations, bankSize) : bankSize
      );

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
      column.appendChild(targetArea);

      // Per-group source bank, labelled by the column header.
      const bank = document.createElement('div');
      bank.className = 'cutie-match-bank';
      bank.setAttribute('role', 'listbox');
      bank.setAttribute('data-match-group', targetId);
      bank.setAttribute('aria-labelledby', labelId);

      let isFirstInBank = true;
      for (const sourceChoice of columnSources) {
        const created = this.createChoiceWrapper(
          sourceChoice, 'source', controller, context, responseIdentifier, groupsOf(sourceChoice)
        );
        if (!created) continue;
        created.choice.setAttribute('tabindex', isFirstInBank ? '0' : '-1');
        bank.appendChild(created.wrapper);
        placedSources.add(created.identifier);
        isFirstInBank = false;
      }

      controller.registerGroupedBank(bank);
      column.appendChild(bank);
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
