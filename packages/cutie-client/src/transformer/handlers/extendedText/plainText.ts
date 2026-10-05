import { createMissingAttributeError } from '../../../errors/errorDisplay';
import { addAriaDescribedBy } from '../../../utils/aria';
import { registry } from '../../registry';
import type { ElementHandler, TransformContext } from '../../types';
import {
  clearEvaluated,
  clearVerdictOnEdit,
  createEvaluationSummary,
  getVerdictText,
  markEvaluated,
  readEvaluation,
} from '../evaluation';
import { getDefaultValue } from '../responseUtils';
import {
  clearConstraintResultVerdict,
  createCharacterCounter,
  createConstraintElements,
  createInteractionContainer,
  createInteractionFooter,
  createReadOnlyResponse,
  isPreview,
  parseConstraints,
  parseCounterDirection,
  parseExpectedLength,
  processPrompt,
  showConstraintError,
  wireConstraintDescribedBy,
} from './utils';

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
class ExtendedTextInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === 'qti-extended-text-interaction';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Get required response-identifier attribute
    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      console.error('qti-extended-text-interaction missing required response-identifier attribute');
      fragment.appendChild(
        createMissingAttributeError('qti-extended-text-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-extended-text-interaction')) {
      context.styleManager.addStyle('cutie-extended-text-interaction', EXTENDED_TEXT_INTERACTION_STYLES);
    }

    // Create container for the interaction
    const container = createInteractionContainer(element, 'cutie-extended-text-interaction', responseIdentifier);

    // Process qti-prompt if present
    const prompt = processPrompt(element, responseIdentifier, context);
    if (prompt) {
      container.appendChild(prompt.element);
    }

    // Create textarea for response input
    const textarea = document.createElement('textarea');
    textarea.className = 'cutie-extended-text-response';
    textarea.id = `textarea-${responseIdentifier}`;
    if (prompt) {
      textarea.setAttribute('aria-labelledby', prompt.id);
    } else {
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
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    if (defaultValue !== null && typeof defaultValue === 'string') {
      textarea.value = defaultValue;
    }

    container.appendChild(textarea);

    // Parse constraint attributes (used by both counter and validation below)
    const constraints = parseConstraints(element);

    // Character counter
    // data-max-characters forces the counter on (defaulting to 'down'),
    // otherwise expected-length + a counter direction class is required.
    const expectedLength = parseExpectedLength(element);
    const counterDirection = parseCounterDirection(element);
    const minCharacters = constraints.minCharacters;
    const maxCharacters = constraints.maxCharacters;
    const counterTarget = maxCharacters ?? expectedLength;
    const isHardLimit = maxCharacters !== null;
    const effectiveDirection = counterDirection ?? (isHardLimit ? 'down' : null);

    let counterElement: HTMLDivElement | null = null;
    if (counterTarget !== null && effectiveDirection !== null) {
      const counter = createCharacterCounter(
        counterTarget, effectiveDirection, responseIdentifier, context.styleManager, isHardLimit,
        isPreview(element),
      );
      counterElement = counter.element;
      counter.update(textarea.value.length);
      textarea.addEventListener('input', () => {
        counter.update(textarea.value.length);
      });
    }

    // The response as text in place of the textarea while interactions are read-only
    const readOnlyResponse = createReadOnlyResponse({
      element,
      promptId: prompt?.id ?? null,
      input: textarea,
      render: () => (textarea.value.trim() === '' ? null : document.createTextNode(textarea.value)),
      plainText: true,
      context,
    });
    container.appendChild(readOnlyResponse);

    // Evaluation of a finished attempt when the delivery options show one, or
    // the last try's verdict on a fresh try. Its verdict takes the constraint
    // text's place.
    const evaluation = readEvaluation(element, responseIdentifier, context.styleManager);
    const verdictText = evaluation?.verdict ? getVerdictText(evaluation.verdict) : null;

    // Create constraint elements
    const constraintResult = createConstraintElements(
      constraints, responseIdentifier, context.styleManager, verdictText,
    );

    if (constraintResult) {
      wireConstraintDescribedBy(textarea, constraintResult.constraint.element);
      wireConstraintDescribedBy(readOnlyResponse, constraintResult.constraint.element);
    }

    // Wrap counter and/or constraint in a shared footer row
    const footer = createInteractionFooter(
      constraintResult?.constraint.element ?? null,
      counterElement,
      context.styleManager,
    );
    if (footer) {
      container.appendChild(footer);
    }

    // The correct answer below the textarea, described by it; the status rail
    // is the visual verdict
    if (evaluation) {
      const summary = createEvaluationSummary({
        id: `evaluation-${responseIdentifier}`,
        verdict: null,
        correctAnswer: evaluation.correctResponse.join(', ') || null,
      });
      if (summary) {
        container.appendChild(summary);
        addAriaDescribedBy(textarea, summary.id);
        addAriaDescribedBy(readOnlyResponse, summary.id);
      }
      markEvaluated(container, evaluation.verdict);
    }
    clearVerdictOnEdit(context, responseIdentifier, evaluation, () => {
      clearEvaluated(container);
      clearConstraintResultVerdict(constraintResult, textarea);
    });

    // Register response accessor with itemState
    if (context.itemState) {
      // Find the first violated constraint, without touching the UI.
      // Returns null when valid, otherwise the message text to display.
      const findViolation = (): { text: string | null } | null => {
        const value = textarea.value.trim();

        // Min-strings check: empty input when required
        if (constraints.minStrings > 0 && value.length === 0) {
          return { text: constraintResult?.minStringsText ?? null };
        }

        // Min-characters check: too short (includes empty — implies required)
        if (minCharacters !== null && value.length < minCharacters) {
          return { text: constraintResult?.minCharactersText ?? null };
        }

        // Pattern-mask check: non-empty but wrong format
        if (constraints.patternMask && !new RegExp(constraints.patternMask).test(textarea.value)) {
          return { text: constraintResult?.patternText ?? null };
        }

        // Max-characters check: hard character limit exceeded
        if (maxCharacters !== null && value.length > maxCharacters) {
          return { text: constraintResult?.maxCharactersText ?? null };
        }

        return null;
      };

      // Validate constraints and update error UI. Returns true when valid.
      const validate = (): boolean => {
        const violation = findViolation();
        if (violation) {
          textarea.setAttribute('aria-invalid', 'true');
          showConstraintError(constraintResult, violation.text, context);
          return false;
        }

        textarea.removeAttribute('aria-invalid');
        if (constraintResult) {
          constraintResult.constraint.setError(false);
          constraintResult.constraint.setText(constraintResult.initialText);
        }
        return true;
      };

      context.itemState.registerResponse(responseIdentifier, (options) => {
        const value = textarea.value.trim();
        const valid = options?.silent ? findViolation() === null : validate();
        return { value: value === '' ? null : value, valid };
      });

      // Re-validate on input so errors clear as soon as the value becomes valid
      textarea.addEventListener('input', () => {
        if (textarea.hasAttribute('aria-invalid')) {
          validate();
        }
        context.itemState?.notifyResponseChange(responseIdentifier);
      });

      // Observe interaction state changes to enable/disable textarea
      context.itemState.addObserver((state) => {
        textarea.disabled = state.interactionState !== 'enabled';
      });

      // Set initial disabled state
      textarea.disabled = context.itemState.interactionState !== 'enabled';
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

.cutie-extended-text-interaction textarea[aria-invalid="true"] {
  border-color: var(--cutie-feedback-incorrect);
}

.cutie-extended-text-interaction textarea[aria-invalid="true"]:focus {
  outline-color: var(--cutie-feedback-incorrect);
  border-color: var(--cutie-feedback-incorrect);
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
registry.register('extended-text-interaction', new ExtendedTextInteractionHandler(), 50);
