import { createMissingAttributeError } from '../../../errors/errorDisplay.js';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../../errors/validationDisplay.js';
import { addAriaDescribedBy } from '../../../utils/aria.js';
import { announce } from '../../../utils/liveRegion.js';
import type { ElementHandler, InteractionState, TransformContext } from '../../types.js';
import { parseChoicesContainerWidth } from '../../vocabUtils.js';
import {
  clearConstraintVerdict,
  clearEvaluated,
  clearVerdictOnEdit,
  createCorrectAnswerOverline,
  getVerdictText,
  markEvaluated,
  parseDirectedPair,
  readEvaluation,
} from '../evaluation/index.js';
import { getDefaultValue } from '../responseUtils.js';
import { GapMatchController } from './controller.js';
import { GAP_MATCH_INTERACTION_STYLES } from './styles.js';

function buildGapMatchConstraintText(min: number, max: number): string | null {
  if (min > 0 && max > 0 && min !== max) {
    return `Fill between ${min} and ${max} gaps.`;
  }
  if (min > 0) {
    return `Fill at least ${min} gap${min === 1 ? '' : 's'}.`;
  }
  return null;
}

interface ChoiceData {
  identifier: string;
  element: Element;
  matchMax: number;
  matchGroups: string[];
  isImage: boolean;
}

/**
 * Handler for qti-gap-match-interaction elements.
 * Creates a container with draggable choices and wires up all interactions.
 */
export class GapMatchInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-gap-match-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-gap-match-interaction')) {
      context.styleManager.addStyle('cutie-gap-match-interaction', GAP_MATCH_INTERACTION_STYLES);
    }

    // Get required response-identifier
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      fragment.appendChild(
        createMissingAttributeError('qti-gap-match-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Create main container. Source classes carry QTI shared vocabulary
    // (e.g. qti-choices-bottom) — pass them through so CSS can key off them.
    const container = document.createElement('div');
    const sourceClasses = element.getAttribute('class');
    container.className = sourceClasses
      ? `cutie-gap-match-interaction cutie-status-rail ${sourceClasses}`
      : 'cutie-gap-match-interaction cutie-status-rail';
    container.setAttribute('data-response-identifier', responseIdentifier);
    container.setAttribute('role', 'group');

    // Find prompt element
    const children = Array.from(element.children);
    const promptElement = children.find(
      (child) => child.tagName.toLowerCase() === 'qti-prompt'
    );

    // Find choice elements (qti-gap-text and qti-gap-img)
    const choiceElements = children.filter(
      (child) =>
        child.tagName.toLowerCase() === 'qti-gap-text' ||
        child.tagName.toLowerCase() === 'qti-gap-img'
    );

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
      container.setAttribute('aria-label', 'Gap match interaction');
    }

    // Build choice data - choices are already in the correct order from the server
    const choices: ChoiceData[] = [];
    for (const choiceElement of choiceElements) {
      const identifier = choiceElement.getAttribute('identifier');
      if (!identifier) {
        console.warn('qti-gap-text/qti-gap-img missing identifier attribute, skipping');
        continue;
      }

      const matchMax = parseInt(choiceElement.getAttribute('match-max') ?? '1', 10);
      const matchGroup = choiceElement.getAttribute('match-group') ?? '';

      choices.push({
        identifier,
        element: choiceElement,
        matchMax: isNaN(matchMax) ? 1 : matchMax,
        matchGroups: matchGroup.split(/\s+/).filter(Boolean),
        isImage: choiceElement.tagName.toLowerCase() === 'qti-gap-img',
      });
    }

    // Create the word bank(s); their position follows the interaction's
    // qti-choices-* class. When the choices span 2+ match-groups (e.g. a
    // flowing sentence whose gaps are scoped by match-group), each group gets
    // its own word bank so the visual layout matches the functional
    // restriction. Choices bucket by their first match-group; ungrouped
    // choices form their own bucket.
    const groupKey = (choice: ChoiceData): string => choice.matchGroups[0] ?? '';
    const groupKeys = [...new Set(choices.map(groupKey))];
    const choiceBanks: HTMLElement[] = [];
    const bankForGroup = new Map<string, HTMLElement>();

    const createBank = (label: string): HTMLElement => {
      const bank = document.createElement('div');
      bank.className = 'cutie-gap-match-choices';
      bank.setAttribute('role', 'listbox');
      bank.setAttribute('aria-label', label);
      choiceBanks.push(bank);
      return bank;
    };

    // The outer element keeps the cutie-gap-match-choices class either way,
    // so the qti-choices-* positioning rules apply to it unchanged
    let choicesContainer: HTMLElement;
    if (groupKeys.length >= 2) {
      // A layout row, not itself a bank: role="group" because its children,
      // not it, are the listboxes
      const row = document.createElement('div');
      row.className = 'cutie-gap-match-choices cutie-gap-match-choices--multi-tray';
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', 'Available choices');
      groupKeys.forEach((key, index) => {
        // match-group is an opaque author-chosen identifier with no display
        // semantics, so each bank gets an ordinal name instead
        const bank = createBank(`Word bank ${index + 1}`);
        bank.classList.add('cutie-gap-match-choices--group');
        if (key) bank.setAttribute('data-match-group', key);
        row.appendChild(bank);
        bankForGroup.set(key, bank);
      });
      choicesContainer = row;
    } else {
      choicesContainer = createBank('Available choices');
    }
    const choicesContainerWidth = parseChoicesContainerWidth(element);
    if (choicesContainerWidth !== null) {
      choicesContainer.style.width = `${choicesContainerWidth}px`;
    }
    container.appendChild(choicesContainer);

    const choiceButtons = new Map<string, { button: HTMLButtonElement; content: string }>();
    for (const choice of choices) {
      const choiceBtn = document.createElement('button');
      choiceBtn.className = 'cutie-gap-text';
      choiceBtn.type = 'button';
      choiceBtn.setAttribute('role', 'option');
      choiceBtn.setAttribute('data-identifier', choice.identifier);
      choiceBtn.setAttribute('data-match-max', String(choice.matchMax));
      choiceBtn.setAttribute('draggable', 'true');
      choiceBtn.setAttribute('aria-pressed', 'false');

      let content: string;
      if (choice.isImage) {
        // Handle qti-gap-img
        const imgSrc = choice.element.getAttribute('src') ?? '';
        const imgAlt = choice.element.getAttribute('alt') ?? '';
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = imgAlt;
        img.className = 'cutie-gap-img-content';
        choiceBtn.appendChild(img);
        content = imgAlt || 'image option';
      } else {
        // Handle qti-gap-text
        content = choice.element.textContent ?? '';
        choiceBtn.textContent = content;
      }

      (bankForGroup.get(groupKey(choice)) ?? choicesContainer).appendChild(choiceBtn);
      choiceButtons.set(choice.identifier, { button: choiceBtn, content });
    }

    // Create content container and transform remaining children (which includes gaps)
    const contentContainer = document.createElement('div');
    contentContainer.className = 'cutie-gap-match-content';

    const contentBlocks = children.filter((child) => {
      const tagName = child.tagName.toLowerCase();
      return (
        tagName !== 'qti-prompt' &&
        tagName !== 'qti-gap-text' &&
        tagName !== 'qti-gap-img'
      );
    });

    // Transform the content blocks (which contain the gaps). transformNode
    // preserves each block element itself — crucial so an authored
    // qti-layout-row / qti-layout-col* grid survives into the output.
    for (const child of contentBlocks) {
      if (context.transformNode) {
        contentContainer.appendChild(context.transformNode(child));
      } else if (context.transformChildren) {
        contentContainer.appendChild(context.transformChildren(child));
      }
    }

    container.appendChild(contentContainer);

    // Parse optional association constraints
    const minAssociations = parseInt(element.getAttribute('min-associations') ?? '0', 10) || 0;
    const maxAssociations = parseInt(element.getAttribute('max-associations') ?? '0', 10) || 0;

    // Evaluation of a finished attempt when the delivery options show one,
    // or the last try's verdict on a fresh try
    const evaluation = readEvaluation(element, responseIdentifier, context.styleManager);

    // Add constraint message if min-associations > 0. A finished attempt with
    // a verdict describes the response in its place, so it is announced with
    // the group; the status rail is the visual verdict.
    let constraint: ConstraintMessage | undefined;
    const verdict = evaluation?.verdict ?? null;
    const associationText = buildGapMatchConstraintText(minAssociations, maxAssociations);
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

    // Create the controller
    const controller = new GapMatchController(responseIdentifier, choiceBanks, context, container, maxAssociations);

    // Register choices in DOM order (grouped by bank) so keyboard navigation
    // follows the layout
    const orderedChoices = groupKeys.flatMap((key) => choices.filter((choice) => groupKey(choice) === key));
    for (const choice of orderedChoices) {
      const entry = choiceButtons.get(choice.identifier);
      if (!entry) continue;

      controller.registerChoice(choice.identifier, entry.button, choice.matchMax, entry.content, choice.matchGroups);
    }

    // Each bank is its own listbox: seed one tabbable choice per bank so Tab
    // moves between banks and arrow keys move within a bank.
    controller.initRovingTabindex();

    // Find and register all gap elements in the transformed content
    const gapElements = contentContainer.querySelectorAll('.cutie-gap');
    let gapIndex = 1;
    for (const gapElement of gapElements) {
      const gapId = gapElement.getAttribute('data-identifier');
      if (gapId) {
        gapElement.setAttribute('aria-label', `Gap ${gapIndex}, empty`);
        const matchGroup = gapElement.getAttribute('data-match-group') ?? '';
        const matchGroups = matchGroup ? matchGroup.split(/\s+/) : [];
        controller.registerGap(gapId, gapElement as HTMLElement, matchGroups);
        gapIndex++;
      }
    }

    // Initialize with default values if present
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null) {
      const defaults = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      controller.initializeFromDefaults(defaults);
    }

    // Draw the evaluation: the status rail, and above each gap, in the slot
    // every gap reserves for it, the choice that belongs there (described by
    // the gap). The verdict is in the constraint text.
    if (evaluation) {
      const correctByGap = new Map<string, string[]>();
      for (const pair of evaluation.correctResponse.map(parseDirectedPair)) {
        if (!pair) continue;
        correctByGap.set(pair.target, [...(correctByGap.get(pair.target) ?? []), pair.source]);
      }

      for (const gapElement of gapElements) {
        const gapId = gapElement.getAttribute('data-identifier');
        const correctChoiceIds = gapId ? correctByGap.get(gapId) : undefined;
        if (!gapId || !correctChoiceIds) continue;

        const value = correctChoiceIds
          .map((choiceId) => choiceButtons.get(choiceId)?.content ?? choiceId)
          .join(', ');
        const overline = createCorrectAnswerOverline(value);
        overline.id = `evaluation-${responseIdentifier}-${gapId}`;
        gapElement.appendChild(overline);
        addAriaDescribedBy(gapElement, overline.id);
      }
      markEvaluated(container, evaluation.verdict);
    }
    clearVerdictOnEdit(context, responseIdentifier, evaluation, () => {
      clearEvaluated(container);
      clearConstraintVerdict(constraint, container, associationText);
      constraintText = associationText;
    });

    // Size gaps to their widest acceptable choice once they are in the
    // document, and again when web fonts have loaded and changed the text width
    context.onMount?.(() => {
      controller.sizeGapsToChoices();
      void document.fonts?.ready.then(() => controller.sizeGapsToChoices());
    });

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, (options) => {
        const response = controller.getResponse();
        const isValid =
          (minAssociations <= 0 || response.length >= minAssociations) &&
          (maxAssociations <= 0 || response.length <= maxAssociations);

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
}
