// cspell:ignore draggables
import { createMissingAttributeError } from '../../../errors/errorDisplay';
import { createConstraintMessage, } from '../../../errors/validationDisplay';
import { getDefaultValue } from '../responseUtils';
import { MatchController } from './controller';
import { MATCH_INTERACTION_STYLES } from './styles';
function buildMatchConstraintText(min, max) {
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
export class MatchInteractionHandler {
    canHandle(element) {
        return element.tagName.toLowerCase() === 'qti-match-interaction';
    }
    transform(element, context) {
        var _a, _b, _c;
        const fragment = document.createDocumentFragment();
        // Register styles once
        if (context.styleManager && !context.styleManager.hasStyle('cutie-match-interaction')) {
            context.styleManager.addStyle('cutie-match-interaction', MATCH_INTERACTION_STYLES);
        }
        // Get required response-identifier
        const responseIdentifier = element.getAttribute('response-identifier');
        if (!responseIdentifier) {
            fragment.appendChild(createMissingAttributeError('qti-match-interaction', 'response-identifier'));
            return fragment;
        }
        // Get optional attributes
        const maxAssociations = parseInt((_a = element.getAttribute('max-associations')) !== null && _a !== void 0 ? _a : '0', 10);
        const minAssociations = parseInt((_b = element.getAttribute('min-associations')) !== null && _b !== void 0 ? _b : '0', 10) || 0;
        // Create main container
        const container = document.createElement('div');
        container.className = 'cutie-match-interaction';
        container.setAttribute('data-response-identifier', responseIdentifier);
        container.setAttribute('role', 'group');
        // Find elements
        const children = Array.from(element.children);
        const promptElement = children.find((child) => child.tagName.toLowerCase() === 'qti-prompt');
        const matchSets = children.filter((child) => child.tagName.toLowerCase() === 'qti-simple-match-set');
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
        }
        else {
            container.setAttribute('aria-label', 'Match interaction');
        }
        // Create layout container with orientation from QTI class attribute
        const layoutContainer = document.createElement('div');
        layoutContainer.className = 'cutie-match-layout';
        const qtiClass = (_c = element.getAttribute('class')) !== null && _c !== void 0 ? _c : '';
        if (qtiClass.includes('qti-match-source-right')) {
            layoutContainer.classList.add('cutie-match-source-right');
        }
        else if (qtiClass.includes('qti-match-source-top')) {
            layoutContainer.classList.add('cutie-match-source-top');
        }
        else if (qtiClass.includes('qti-match-source-bottom')) {
            layoutContainer.classList.add('cutie-match-source-bottom');
        }
        else {
            layoutContainer.classList.add('cutie-match-source-left');
        }
        // Create the controller
        const controller = new MatchController(responseIdentifier, context, container, maxAssociations);
        // Process source set (first match set)
        // Note: choices are pre-shuffled by the server in renderTemplate
        const sourceSetElement = layoutContainer.appendChild(this.createMatchSet(matchSets[0], 'source', controller, context));
        // Process target set (second match set)
        const targetSetElement = layoutContainer.appendChild(this.createMatchSet(matchSets[1], 'target', controller, context));
        container.appendChild(layoutContainer);
        // Add constraint message if min-associations > 0
        let constraint;
        const constraintText = buildMatchConstraintText(minAssociations, maxAssociations);
        if (constraintText) {
            constraint = createConstraintMessage(`constraint-${responseIdentifier}`, constraintText, context.styleManager);
            container.appendChild(constraint.element);
            const existingDescribedBy = container.getAttribute('aria-describedby');
            container.setAttribute('aria-describedby', existingDescribedBy
                ? `${existingDescribedBy} ${constraint.element.id}`
                : constraint.element.id);
        }
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
                const isValid = minAssociations <= 0 || response.length >= minAssociations;
                if (!isValid) {
                    container.setAttribute('aria-invalid', 'true');
                    constraint === null || constraint === void 0 ? void 0 : constraint.setError(true);
                    return { value: response.length > 0 ? response : null, valid: false };
                }
                container.removeAttribute('aria-invalid');
                constraint === null || constraint === void 0 ? void 0 : constraint.setError(false);
                return { value: response.length > 0 ? response : null, valid: true };
            });
            // Observe interaction enabled state
            const observer = (state) => {
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
    createMatchSet(matchSetElement, setType, controller, context) {
        var _a, _b;
        const setContainer = document.createElement('div');
        setContainer.className = `cutie-match-set cutie-match-set--${setType}`;
        setContainer.setAttribute('role', 'listbox');
        setContainer.setAttribute('aria-label', `${setType === 'source' ? 'Source' : 'Target'} choices`);
        // Extract choices from the match set
        const choiceElements = Array.from(matchSetElement.children).filter((child) => child.tagName.toLowerCase() === 'qti-simple-associable-choice');
        // Build choice data - choices are already in the correct order from the server
        const choices = [];
        for (const choiceElement of choiceElements) {
            const identifier = choiceElement.getAttribute('identifier');
            if (!identifier) {
                console.warn('qti-simple-associable-choice missing identifier, skipping');
                continue;
            }
            const matchMax = parseInt((_a = choiceElement.getAttribute('match-max')) !== null && _a !== void 0 ? _a : '1', 10);
            choices.push({
                identifier,
                content: (_b = choiceElement.textContent) !== null && _b !== void 0 ? _b : '',
                matchMax: isNaN(matchMax) ? 1 : matchMax,
                element: choiceElement,
            });
        }
        // Create choice elements
        let isFirst = true;
        for (const choice of choices) {
            // Create wrapper to hold choice and chips as siblings (avoids nested draggables)
            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = 'cutie-match-choice-wrapper';
            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'cutie-match-choice';
            choiceDiv.setAttribute('role', 'option');
            choiceDiv.setAttribute('aria-selected', 'false');
            choiceDiv.setAttribute('data-identifier', choice.identifier);
            choiceDiv.setAttribute('data-match-max', String(choice.matchMax));
            choiceDiv.setAttribute('tabindex', isFirst ? '0' : '-1');
            choiceDiv.setAttribute('draggable', 'true');
            // Label — use transformChildren for rich content (HTML/MathML)
            const labelSpan = document.createElement('span');
            labelSpan.className = 'cutie-match-choice-label';
            if (context.transformChildren) {
                labelSpan.appendChild(context.transformChildren(choice.element));
            }
            else {
                labelSpan.textContent = choice.content;
            }
            choiceDiv.appendChild(labelSpan);
            wrapperDiv.appendChild(choiceDiv);
            // Chips container as sibling (not inside choice)
            const chipsContainer = document.createElement('div');
            chipsContainer.className = 'cutie-match-choice-chips';
            wrapperDiv.appendChild(chipsContainer);
            setContainer.appendChild(wrapperDiv);
            // Register with controller
            controller.registerChoice(choice.identifier, setType, choiceDiv, choice.matchMax, choice.content);
            isFirst = false;
        }
        return setContainer;
    }
}
