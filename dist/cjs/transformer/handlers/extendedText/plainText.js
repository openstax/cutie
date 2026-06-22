"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorDisplay_1 = require("../../../errors/errorDisplay");
const registry_1 = require("../../registry");
const responseUtils_1 = require("../responseUtils");
const utils_1 = require("./utils");
/**
 * Handler for qti-extended-text-interaction elements
 * Provides a multi-line text input area for learner responses
 *
 * QTI 3.0 Spec: https://www.imsglobal.org/spec/qti/v3p0/impl#h.w9vq14kyjxpy
 *
 * Supports:
 * - response-identifier attribute (required) - identifies the response variable
 * - qti-prompt child element (optional) - provides instructions to the learner
 * - Multi-line textarea for text input
 *
 * Basic level certification requirements:
 * - Can ignore sizing hints (expected-lines)
 * - Can ignore validation attributes (pattern-mask)
 * - Can treat all formats as plain text
 *
 * Advanced: expected-length is used with qti-counter-up/qti-counter-down
 * vocab classes to display a live character counter.
 */
class ExtendedTextInteractionHandler {
    canHandle(element) {
        return element.tagName.toLowerCase() === 'qti-extended-text-interaction';
    }
    transform(element, context) {
        var _a;
        const fragment = document.createDocumentFragment();
        // Get required response-identifier attribute
        const responseIdentifier = element.getAttribute('response-identifier');
        if (!responseIdentifier) {
            console.error('qti-extended-text-interaction missing required response-identifier attribute');
            fragment.appendChild((0, errorDisplay_1.createMissingAttributeError)('qti-extended-text-interaction', 'response-identifier'));
            return fragment;
        }
        // Register styles once
        if (context.styleManager && !context.styleManager.hasStyle('cutie-extended-text-interaction')) {
            context.styleManager.addStyle('cutie-extended-text-interaction', EXTENDED_TEXT_INTERACTION_STYLES);
        }
        // Create container for the interaction
        const container = (0, utils_1.createInteractionContainer)(element, 'cutie-extended-text-interaction', responseIdentifier);
        // Process qti-prompt if present
        const prompt = (0, utils_1.processPrompt)(element, responseIdentifier, context);
        if (prompt) {
            container.appendChild(prompt.element);
        }
        // Create textarea for response input
        const textarea = document.createElement('textarea');
        textarea.className = 'cutie-extended-text-response';
        textarea.id = `textarea-${responseIdentifier}`;
        if (prompt) {
            textarea.setAttribute('aria-labelledby', prompt.id);
        }
        else {
            textarea.setAttribute('aria-label', 'Response input');
        }
        textarea.setAttribute('data-response-identifier', responseIdentifier);
        // Set placeholder text if provided
        const placeholderText = element.getAttribute('placeholder-text');
        if (placeholderText) {
            textarea.placeholder = placeholderText;
        }
        // Optional: Use expected-lines hint for sizing if provided
        const expectedLines = element.getAttribute('expected-lines');
        if (expectedLines) {
            const lines = parseInt(expectedLines, 10);
            if (!isNaN(lines) && lines > 0) {
                textarea.style.minHeight = `calc(${lines * 1.4}em + 18px)`;
            }
        }
        // Initialize with default value from response declaration if present
        const defaultValue = (0, responseUtils_1.getDefaultValue)(element.ownerDocument, responseIdentifier);
        if (defaultValue !== null && typeof defaultValue === 'string') {
            textarea.value = defaultValue;
        }
        container.appendChild(textarea);
        // Parse constraint attributes (used by both counter and validation below)
        const constraints = (0, utils_1.parseConstraints)(element);
        // Character counter
        // data-max-characters forces the counter on (defaulting to 'down'),
        // otherwise expected-length + a counter direction class is required.
        const expectedLength = (0, utils_1.parseExpectedLength)(element);
        const counterDirection = (0, utils_1.parseCounterDirection)(element);
        const minCharacters = constraints.minCharacters;
        const maxCharacters = constraints.maxCharacters;
        const counterTarget = maxCharacters !== null && maxCharacters !== void 0 ? maxCharacters : expectedLength;
        const isHardLimit = maxCharacters !== null;
        const effectiveDirection = counterDirection !== null && counterDirection !== void 0 ? counterDirection : (isHardLimit ? 'down' : null);
        let counterElement = null;
        if (counterTarget !== null && effectiveDirection !== null) {
            const counter = (0, utils_1.createCharacterCounter)(counterTarget, effectiveDirection, responseIdentifier, context.styleManager, isHardLimit);
            counterElement = counter.element;
            counter.update(textarea.value.length);
            textarea.addEventListener('input', () => {
                counter.update(textarea.value.length);
            });
        }
        // Create constraint elements
        const constraintResult = (0, utils_1.createConstraintElements)(constraints, responseIdentifier, context.styleManager);
        if (constraintResult) {
            (0, utils_1.wireConstraintDescribedBy)(textarea, constraintResult.constraint.element);
        }
        // Wrap counter and/or constraint in a shared footer row
        const footer = (0, utils_1.createInteractionFooter)((_a = constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.constraint.element) !== null && _a !== void 0 ? _a : null, counterElement, context.styleManager);
        if (footer) {
            container.appendChild(footer);
        }
        // Register response accessor with itemState
        if (context.itemState) {
            // Validate constraints and update error UI. Returns true when valid.
            const validate = () => {
                const value = textarea.value.trim();
                // Min-strings check: empty input when required
                if (constraints.minStrings > 0 && value.length === 0) {
                    textarea.setAttribute('aria-invalid', 'true');
                    if (constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.minStringsText) {
                        constraintResult.constraint.setText(constraintResult.minStringsText);
                    }
                    constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.constraint.setError(true);
                    return false;
                }
                // Min-characters check: too short (includes empty — implies required)
                if (minCharacters !== null && value.length < minCharacters) {
                    textarea.setAttribute('aria-invalid', 'true');
                    if (constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.minCharactersText) {
                        constraintResult.constraint.setText(constraintResult.minCharactersText);
                    }
                    constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.constraint.setError(true);
                    return false;
                }
                // Pattern-mask check: non-empty but wrong format
                if (constraints.patternMask && !new RegExp(constraints.patternMask).test(textarea.value)) {
                    textarea.setAttribute('aria-invalid', 'true');
                    if (constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.patternText) {
                        constraintResult.constraint.setText(constraintResult.patternText);
                    }
                    constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.constraint.setError(true);
                    return false;
                }
                // Max-characters check: hard character limit exceeded
                if (maxCharacters !== null && value.length > maxCharacters) {
                    textarea.setAttribute('aria-invalid', 'true');
                    if (constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.maxCharactersText) {
                        constraintResult.constraint.setText(constraintResult.maxCharactersText);
                    }
                    constraintResult === null || constraintResult === void 0 ? void 0 : constraintResult.constraint.setError(true);
                    return false;
                }
                textarea.removeAttribute('aria-invalid');
                if (constraintResult) {
                    constraintResult.constraint.setError(false);
                    constraintResult.constraint.setText(constraintResult.initialText);
                }
                return true;
            };
            context.itemState.registerResponse(responseIdentifier, () => {
                const value = textarea.value.trim();
                const valid = validate();
                return { value: value === '' ? null : value, valid };
            });
            // Re-validate on input so errors clear as soon as the value becomes valid
            textarea.addEventListener('input', () => {
                if (textarea.hasAttribute('aria-invalid')) {
                    validate();
                }
            });
            // Observe interaction state changes to enable/disable textarea
            context.itemState.addObserver((state) => {
                textarea.disabled = !state.interactionsEnabled;
            });
            // Set initial disabled state
            textarea.disabled = !context.itemState.interactionsEnabled;
        }
        fragment.appendChild(container);
        return fragment;
    }
}
const EXTENDED_TEXT_INTERACTION_STYLES = `
.cutie-extended-text-interaction {
  display: block;
  margin: 8px 0;
}

.cutie-extended-text-interaction .cutie-prompt {
  margin-bottom: 8px;
}

.cutie-extended-text-interaction textarea {
  width: 100%;
  min-height: 7.5em;
  padding: 8px;
  font-size: 1.6rem;
  font-family: inherit;
  line-height: 1.4;
  border: 1px solid var(--cutie-border);
  border-radius: 4px;
  resize: vertical;
  box-sizing: border-box;
}

.cutie-extended-text-interaction textarea:focus {
  outline: 2px solid var(--cutie-primary);
  outline-offset: 1px;
  border-color: var(--cutie-primary);
}

.cutie-extended-text-interaction textarea:disabled {
  background-color: var(--cutie-bg-alt);
  cursor: not-allowed;
  opacity: 0.6;
}

.cutie-extended-text-interaction textarea:disabled:focus {
  outline: none;
}

.cutie-extended-text-interaction.qti-height-lines-3 textarea { min-height: calc(4.2em + 18px); }
.cutie-extended-text-interaction.qti-height-lines-6 textarea { min-height: calc(8.4em + 18px); }
.cutie-extended-text-interaction.qti-height-lines-15 textarea { min-height: calc(21em + 18px); }
`.trim();
// Register with priority 50 (after specific handlers, before unsupported catch-all at 500)
registry_1.registry.register('extended-text-interaction', new ExtendedTextInteractionHandler(), 50);
