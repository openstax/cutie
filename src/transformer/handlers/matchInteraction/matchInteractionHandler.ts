// cspell:ignore draggables
import { createMissingAttributeError } from '../../../errors/errorDisplay';
import type { ElementHandler, TransformContext } from '../../types';
import { getDefaultValue } from '../responseUtils';
import { MatchController } from './controller';
import { MATCH_INTERACTION_STYLES } from './styles';

interface ChoiceData {
  identifier: string;
  content: string;
  matchMax: number;
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
    if (context.styleManager && !context.styleManager.hasStyle('qti-match-interaction')) {
      context.styleManager.addStyle('qti-match-interaction', MATCH_INTERACTION_STYLES);
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

    // Create main container
    const container = document.createElement('div');
    container.className = 'qti-match-interaction';
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
      promptDiv.className = 'qti-prompt';
      promptDiv.id = promptId;
      promptDiv.appendChild(context.transformChildren(promptElement));
      container.appendChild(promptDiv);
      container.setAttribute('aria-labelledby', promptId);
    } else {
      container.setAttribute('aria-label', 'Match interaction');
    }

    // Create layout container
    // Default to source-left orientation; later we can read this from QTI class attribute
    const layoutContainer = document.createElement('div');
    layoutContainer.className = 'qti-match-layout qti-match-source-left';

    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.className = 'qti-match-live';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');

    // Create the controller
    const controller = new MatchController(
      responseIdentifier,
      liveRegion,
      container,
      maxAssociations
    );

    // Process source set (first match set)
    // Note: choices are pre-shuffled by the server in renderTemplate
    const sourceSetElement = layoutContainer.appendChild(
      this.createMatchSet(matchSets[0], 'source', controller, context)
    );

    // Process target set (second match set)
    const targetSetElement = layoutContainer.appendChild(
      this.createMatchSet(matchSets[1], 'target', controller, context)
    );

    container.appendChild(layoutContainer);
    container.appendChild(liveRegion);

    // Initialize controller after all choices are registered
    controller.initialize(sourceSetElement, targetSetElement);

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

  /**
   * Create a match set container with its choices.
   * Choices are already in the correct (potentially shuffled) order from the server.
   */
  private createMatchSet(
    matchSetElement: Element,
    setType: 'source' | 'target',
    controller: MatchController,
    _context: TransformContext
  ): HTMLElement {
    const setContainer = document.createElement('div');
    setContainer.className = `qti-match-set qti-match-set--${setType}`;
    setContainer.setAttribute('role', 'listbox');
    setContainer.setAttribute('aria-label', `${setType === 'source' ? 'Source' : 'Target'} choices`);

    // Extract choices from the match set
    const choiceElements = Array.from(matchSetElement.children).filter(
      (child) => child.tagName.toLowerCase() === 'qti-simple-associable-choice'
    );

    // Build choice data - choices are already in the correct order from the server
    const choices: ChoiceData[] = [];
    for (const choiceElement of choiceElements) {
      const identifier = choiceElement.getAttribute('identifier');
      if (!identifier) {
        console.warn('qti-simple-associable-choice missing identifier, skipping');
        continue;
      }

      const matchMax = parseInt(choiceElement.getAttribute('match-max') ?? '1', 10);

      choices.push({
        identifier,
        content: choiceElement.textContent ?? '',
        matchMax: isNaN(matchMax) ? 1 : matchMax,
      });
    }

    // Create choice elements
    let isFirst = true;
    for (const choice of choices) {
      // Create wrapper to hold choice and chips as siblings (avoids nested draggables)
      const wrapperDiv = document.createElement('div');
      wrapperDiv.className = 'qti-match-choice-wrapper';

      const choiceDiv = document.createElement('div');
      choiceDiv.className = 'qti-match-choice';
      choiceDiv.setAttribute('role', 'option');
      choiceDiv.setAttribute('data-identifier', choice.identifier);
      choiceDiv.setAttribute('data-match-max', String(choice.matchMax));
      choiceDiv.setAttribute('tabindex', isFirst ? '0' : '-1');
      choiceDiv.setAttribute('draggable', 'true');

      // Label
      const labelSpan = document.createElement('span');
      labelSpan.className = 'qti-match-choice-label';
      labelSpan.textContent = choice.content;
      choiceDiv.appendChild(labelSpan);

      wrapperDiv.appendChild(choiceDiv);

      // Chips container as sibling (not inside choice)
      const chipsContainer = document.createElement('div');
      chipsContainer.className = 'qti-match-choice-chips';
      wrapperDiv.appendChild(chipsContainer);

      setContainer.appendChild(wrapperDiv);

      // Register with controller
      controller.registerChoice(
        choice.identifier,
        setType,
        choiceDiv,
        choice.matchMax,
        choice.content
      );

      isFirst = false;
    }

    return setContainer;
  }
}
