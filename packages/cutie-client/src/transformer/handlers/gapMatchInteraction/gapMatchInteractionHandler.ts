import { createMissingAttributeError } from '../../../errors/errorDisplay';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../../errors/validationDisplay';
import type { ElementHandler, TransformContext } from '../../types';
import { parseChoicesContainerWidth } from '../../vocabUtils';
import { getDefaultValue } from '../responseUtils';
import { GapMatchController } from './controller';
import { analyzeMatchGroups } from './matchGroupAnalysis';
import { GAP_MATCH_INTERACTION_STYLES } from './styles';

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
 * Present a match-group identifier to assistive tech (identifiers are
 * machine tokens like "vital-signs").
 */
function humanizeGroupId(group: string): string {
  return group.replace(/[-_]+/g, ' ');
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
      ? `cutie-gap-match-interaction ${sourceClasses}`
      : 'cutie-gap-match-interaction';
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

    // Create the choice buttons up front; the layout below decides where
    // each button lands in the DOM.
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

      choiceButtons.set(choice.identifier, { button: choiceBtn, content });
    }

    // Derived grouping: when the match-group data proves that every choice
    // has exactly one target group the choices cluster by group, and when
    // the content blocks also partition the gaps by group, each block
    // becomes a column with its group's choices banked beneath it.
    const analysis = analyzeMatchGroups(element);
    const choicesContainerWidth = parseChoicesContainerWidth(element);
    const choiceBanks: HTMLElement[] = [];
    const orderedChoices: ChoiceData[] = [];

    const createBank = (ariaLabel: string): HTMLElement => {
      const bank = document.createElement('div');
      bank.className = 'cutie-gap-match-choices';
      bank.setAttribute('role', 'listbox');
      bank.setAttribute('aria-label', ariaLabel);
      if (choicesContainerWidth !== null) {
        bank.style.width = `${choicesContainerWidth}px`;
      }
      choiceBanks.push(bank);
      return bank;
    };

    const placeChoice = (parent: HTMLElement, choice: ChoiceData): void => {
      const entry = choiceButtons.get(choice.identifier);
      if (entry) {
        parent.appendChild(entry.button);
        orderedChoices.push(choice);
      }
    };

    const choicesForGroup = (group: string): ChoiceData[] =>
      choices.filter((choice) => choice.matchGroups.length === 1 && choice.matchGroups[0] === group);

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

    const blockGroups = analysis.blockGroups;
    if (blockGroups) {
      // The blocks partition the gaps by group: render each block as a
      // column with its group's choices banked beneath its gaps.
      contentContainer.classList.add('cutie-gap-match-content--grouped');
      contentContainer.style.setProperty('--cutie-match-group-count', String(blockGroups.length));

      for (let i = 0; i < contentBlocks.length; i++) {
        const child = contentBlocks[i];
        const group = blockGroups[i];

        const block = document.createElement('div');
        block.className = 'cutie-match-group-block';
        block.setAttribute('data-match-group', group);
        if (context.transformChildren) {
          block.appendChild(context.transformChildren(child));
        }

        const groupChoices = choicesForGroup(group);
        if (groupChoices.length > 0) {
          const bank = createBank(`${humanizeGroupId(group)} choices`);
          bank.classList.add('cutie-gap-match-choices--bank');
          bank.setAttribute('data-match-group', group);
          for (const choice of groupChoices) {
            placeChoice(bank, choice);
          }
          block.appendChild(bank);
        }

        contentContainer.appendChild(block);
      }
    } else {
      // Shared tray, sectioned by group when the choices cluster.
      const tray = createBank('Available choices');
      if (analysis.trayGroups) {
        tray.classList.add('cutie-gap-match-choices--grouped');
        for (const group of analysis.trayGroups) {
          const section = document.createElement('div');
          section.className = 'cutie-gap-match-choice-group';
          section.setAttribute('role', 'group');
          section.setAttribute('aria-label', humanizeGroupId(group));
          section.setAttribute('data-match-group', group);
          for (const choice of choicesForGroup(group)) {
            placeChoice(section, choice);
          }
          tray.appendChild(section);
        }
      } else {
        for (const choice of choices) {
          placeChoice(tray, choice);
        }
      }
      container.appendChild(tray);

      for (const child of contentBlocks) {
        if (context.transformChildren) {
          contentContainer.appendChild(context.transformChildren(child));
        }
      }
    }

    container.appendChild(contentContainer);

    // Parse optional association constraints
    const minAssociations = parseInt(element.getAttribute('min-associations') ?? '0', 10) || 0;
    const maxAssociations = parseInt(element.getAttribute('max-associations') ?? '0', 10) || 0;

    // Add constraint message if min-associations > 0
    let constraint: ConstraintMessage | undefined;
    const constraintText = buildGapMatchConstraintText(minAssociations, maxAssociations);
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

    // Register choices in DOM order so keyboard navigation follows the layout
    let isFirst = true;
    for (const choice of orderedChoices) {
      const entry = choiceButtons.get(choice.identifier);
      if (!entry) continue;

      entry.button.setAttribute('tabindex', isFirst ? '0' : '-1');
      controller.registerChoice(choice.identifier, entry.button, choice.matchMax, entry.content, choice.matchGroups);
      isFirst = false;
    }

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

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, () => {
        const response = controller.getResponse();
        const isValid =
          (minAssociations <= 0 || response.length >= minAssociations) &&
          (maxAssociations <= 0 || response.length <= maxAssociations);

        if (!isValid) {
          container.setAttribute('aria-invalid', 'true');
          constraint?.setError(true);
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
}
