import { createMissingAttributeError } from '../../../errors/errorDisplay';
import { shuffleWithFixed } from '../../../utils';
import type { ElementHandler, TransformContext } from '../../types';
import { getDefaultValue } from '../responseUtils';
import { GapMatchController } from './controller';
import { GAP_MATCH_INTERACTION_STYLES } from './styles';

interface ChoiceData {
  identifier: string;
  element: Element;
  fixed: boolean;
  matchMax: number;
  matchGroup: string;
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
    if (context.styleManager && !context.styleManager.hasStyle('qti-gap-match-interaction')) {
      context.styleManager.addStyle('qti-gap-match-interaction', GAP_MATCH_INTERACTION_STYLES);
    }

    // Get required response-identifier
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      fragment.appendChild(
        createMissingAttributeError('qti-gap-match-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Check if shuffle is enabled
    const shuffle = element.getAttribute('shuffle') === 'true';

    // Create main container
    const container = document.createElement('div');
    container.className = 'qti-gap-match-interaction';
    container.setAttribute('data-response-identifier', responseIdentifier);

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
    if (promptElement && context.transformChildren) {
      const promptDiv = document.createElement('div');
      promptDiv.className = 'qti-prompt';
      promptDiv.appendChild(context.transformChildren(promptElement));
      container.appendChild(promptDiv);
    }

    // Create choices container
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'qti-gap-match-choices';
    choicesContainer.setAttribute('role', 'listbox');
    choicesContainer.setAttribute('aria-label', 'Available choices');

    // Build choice data
    const choices: ChoiceData[] = [];
    for (const choiceElement of choiceElements) {
      const identifier = choiceElement.getAttribute('identifier');
      if (!identifier) {
        console.warn('qti-gap-text/qti-gap-img missing identifier attribute, skipping');
        continue;
      }

      const matchMax = parseInt(choiceElement.getAttribute('match-max') ?? '1', 10);

      choices.push({
        identifier,
        element: choiceElement,
        fixed: choiceElement.getAttribute('fixed') === 'true',
        matchMax: isNaN(matchMax) ? 1 : matchMax,
        matchGroup: choiceElement.getAttribute('match-group') ?? '',
        isImage: choiceElement.tagName.toLowerCase() === 'qti-gap-img',
      });
    }

    // Apply shuffle if enabled, respecting fixed positions
    const orderedChoices = shuffle ? shuffleWithFixed(choices) : choices;

    container.appendChild(choicesContainer);

    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.className = 'qti-gap-match-live';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    container.appendChild(liveRegion);

    // Create content container and transform remaining children (which includes gaps)
    const contentContainer = document.createElement('div');
    contentContainer.className = 'qti-gap-match-content';

    // Transform all non-choice, non-prompt children
    for (const child of children) {
      const tagName = child.tagName.toLowerCase();
      if (
        tagName !== 'qti-prompt' &&
        tagName !== 'qti-gap-text' &&
        tagName !== 'qti-gap-img'
      ) {
        if (context.transformChildren) {
          contentContainer.appendChild(context.transformChildren(child));
        }
      }
    }

    container.appendChild(contentContainer);

    // Create the controller
    const controller = new GapMatchController(responseIdentifier, choicesContainer, liveRegion, container);

    // Create and register choice elements
    let isFirst = true;
    for (const choice of orderedChoices) {
      const choiceBtn = document.createElement('button');
      choiceBtn.className = 'qti-gap-text';
      choiceBtn.type = 'button';
      choiceBtn.setAttribute('role', 'option');
      choiceBtn.setAttribute('data-identifier', choice.identifier);
      choiceBtn.setAttribute('data-match-max', String(choice.matchMax));
      choiceBtn.setAttribute('tabindex', isFirst ? '0' : '-1');
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
        img.className = 'qti-gap-img-content';
        choiceBtn.appendChild(img);
        content = imgAlt || 'image option';
      } else {
        // Handle qti-gap-text
        content = choice.element.textContent ?? '';
        choiceBtn.textContent = content;
      }

      choicesContainer.appendChild(choiceBtn);

      const matchGroups = choice.matchGroup ? choice.matchGroup.split(/\s+/) : [];
      controller.registerChoice(choice.identifier, choiceBtn, choice.matchMax, content, matchGroups);
      isFirst = false;
    }

    // Find and register all gap elements in the transformed content
    const gapElements = contentContainer.querySelectorAll('.qti-gap');
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
        return response.length > 0 ? response : null;
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
