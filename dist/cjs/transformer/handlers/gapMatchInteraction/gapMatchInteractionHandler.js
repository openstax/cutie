"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapMatchInteractionHandler = void 0;
const errorDisplay_1 = require("../../../errors/errorDisplay");
const validationDisplay_1 = require("../../../errors/validationDisplay");
const responseUtils_1 = require("../responseUtils");
const controller_1 = require("./controller");
const styles_1 = require("./styles");
function buildGapMatchConstraintText(min, max) {
    if (min > 0 && max > 0 && min !== max) {
        return `Fill between ${min} and ${max} gaps.`;
    }
    if (min > 0) {
        return `Fill at least ${min} gap${min === 1 ? '' : 's'}.`;
    }
    return null;
}
/**
 * Handler for qti-gap-match-interaction elements.
 * Creates a container with draggable choices and wires up all interactions.
 */
class GapMatchInteractionHandler {
    canHandle(element) {
        return element.tagName.toLowerCase() === 'qti-gap-match-interaction';
    }
    transform(element, context) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const fragment = document.createDocumentFragment();
        // Register styles once
        if (context.styleManager && !context.styleManager.hasStyle('cutie-gap-match-interaction')) {
            context.styleManager.addStyle('cutie-gap-match-interaction', styles_1.GAP_MATCH_INTERACTION_STYLES);
        }
        // Get required response-identifier
        const responseIdentifier = element.getAttribute('response-identifier');
        if (!responseIdentifier) {
            fragment.appendChild((0, errorDisplay_1.createMissingAttributeError)('qti-gap-match-interaction', 'response-identifier'));
            return fragment;
        }
        // Create main container
        const container = document.createElement('div');
        container.className = 'cutie-gap-match-interaction';
        container.setAttribute('data-response-identifier', responseIdentifier);
        container.setAttribute('role', 'group');
        // Find prompt element
        const children = Array.from(element.children);
        const promptElement = children.find((child) => child.tagName.toLowerCase() === 'qti-prompt');
        // Find choice elements (qti-gap-text and qti-gap-img)
        const choiceElements = children.filter((child) => child.tagName.toLowerCase() === 'qti-gap-text' ||
            child.tagName.toLowerCase() === 'qti-gap-img');
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
            container.setAttribute('aria-label', 'Gap match interaction');
        }
        // Create choices container
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'cutie-gap-match-choices';
        choicesContainer.setAttribute('role', 'listbox');
        choicesContainer.setAttribute('aria-label', 'Available choices');
        // Build choice data - choices are already in the correct order from the server
        const choices = [];
        for (const choiceElement of choiceElements) {
            const identifier = choiceElement.getAttribute('identifier');
            if (!identifier) {
                console.warn('qti-gap-text/qti-gap-img missing identifier attribute, skipping');
                continue;
            }
            const matchMax = parseInt((_a = choiceElement.getAttribute('match-max')) !== null && _a !== void 0 ? _a : '1', 10);
            choices.push({
                identifier,
                element: choiceElement,
                matchMax: isNaN(matchMax) ? 1 : matchMax,
                matchGroup: (_b = choiceElement.getAttribute('match-group')) !== null && _b !== void 0 ? _b : '',
                isImage: choiceElement.tagName.toLowerCase() === 'qti-gap-img',
            });
        }
        container.appendChild(choicesContainer);
        // Create content container and transform remaining children (which includes gaps)
        const contentContainer = document.createElement('div');
        contentContainer.className = 'cutie-gap-match-content';
        // Transform all non-choice, non-prompt children
        for (const child of children) {
            const tagName = child.tagName.toLowerCase();
            if (tagName !== 'qti-prompt' &&
                tagName !== 'qti-gap-text' &&
                tagName !== 'qti-gap-img') {
                if (context.transformChildren) {
                    contentContainer.appendChild(context.transformChildren(child));
                }
            }
        }
        container.appendChild(contentContainer);
        // Parse optional association constraints
        const minAssociations = parseInt((_c = element.getAttribute('min-associations')) !== null && _c !== void 0 ? _c : '0', 10) || 0;
        const maxAssociations = parseInt((_d = element.getAttribute('max-associations')) !== null && _d !== void 0 ? _d : '0', 10) || 0;
        // Add constraint message if min-associations > 0
        let constraint;
        const constraintText = buildGapMatchConstraintText(minAssociations, maxAssociations);
        if (constraintText) {
            constraint = (0, validationDisplay_1.createConstraintMessage)(`constraint-${responseIdentifier}`, constraintText, context.styleManager);
            container.appendChild(constraint.element);
            const existingDescribedBy = container.getAttribute('aria-describedby');
            container.setAttribute('aria-describedby', existingDescribedBy
                ? `${existingDescribedBy} ${constraint.element.id}`
                : constraint.element.id);
        }
        // Create the controller
        const controller = new controller_1.GapMatchController(responseIdentifier, choicesContainer, context, container, maxAssociations);
        // Create and register choice elements
        let isFirst = true;
        for (const choice of choices) {
            const choiceBtn = document.createElement('button');
            choiceBtn.className = 'cutie-gap-text';
            choiceBtn.type = 'button';
            choiceBtn.setAttribute('role', 'option');
            choiceBtn.setAttribute('data-identifier', choice.identifier);
            choiceBtn.setAttribute('data-match-max', String(choice.matchMax));
            choiceBtn.setAttribute('tabindex', isFirst ? '0' : '-1');
            choiceBtn.setAttribute('draggable', 'true');
            choiceBtn.setAttribute('aria-pressed', 'false');
            let content;
            if (choice.isImage) {
                // Handle qti-gap-img
                const imgSrc = (_e = choice.element.getAttribute('src')) !== null && _e !== void 0 ? _e : '';
                const imgAlt = (_f = choice.element.getAttribute('alt')) !== null && _f !== void 0 ? _f : '';
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = imgAlt;
                img.className = 'cutie-gap-img-content';
                choiceBtn.appendChild(img);
                content = imgAlt || 'image option';
            }
            else {
                // Handle qti-gap-text
                content = (_g = choice.element.textContent) !== null && _g !== void 0 ? _g : '';
                choiceBtn.textContent = content;
            }
            choicesContainer.appendChild(choiceBtn);
            const matchGroups = choice.matchGroup ? choice.matchGroup.split(/\s+/) : [];
            controller.registerChoice(choice.identifier, choiceBtn, choice.matchMax, content, matchGroups);
            isFirst = false;
        }
        // Find and register all gap elements in the transformed content
        const gapElements = contentContainer.querySelectorAll('.cutie-gap');
        let gapIndex = 1;
        for (const gapElement of gapElements) {
            const gapId = gapElement.getAttribute('data-identifier');
            if (gapId) {
                gapElement.setAttribute('aria-label', `Gap ${gapIndex}, empty`);
                const matchGroup = (_h = gapElement.getAttribute('data-match-group')) !== null && _h !== void 0 ? _h : '';
                const matchGroups = matchGroup ? matchGroup.split(/\s+/) : [];
                controller.registerGap(gapId, gapElement, matchGroups);
                gapIndex++;
            }
        }
        // Initialize with default values if present
        const defaultValue = (0, responseUtils_1.getDefaultValue)(element.ownerDocument, responseIdentifier);
        if (defaultValue !== null) {
            const defaults = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
            controller.initializeFromDefaults(defaults);
        }
        // Register response accessor with itemState
        if (context.itemState) {
            context.itemState.registerResponse(responseIdentifier, () => {
                const response = controller.getResponse();
                const isValid = (minAssociations <= 0 || response.length >= minAssociations) &&
                    (maxAssociations <= 0 || response.length <= maxAssociations);
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
}
exports.GapMatchInteractionHandler = GapMatchInteractionHandler;
