import { createMissingAttributeError } from '../../../errors/errorDisplay.js';
import {
  type ConstraintMessage,
  createConstraintMessage,
} from '../../../errors/validationDisplay.js';
import { announce } from '../../../utils/liveRegion.js';
import type { ElementHandler, InteractionState, TransformContext } from '../../types.js';
import {
  clearConstraintVerdict,
  clearEvaluated,
  clearVerdictOnEdit,
  getVerdictText,
  markEvaluated,
  parseDirectedPair,
  readEvaluation,
} from '../evaluation/index.js';
import { getDefaultValue } from '../responseUtils.js';
import { type MatchChoice, readMatchSet, warnDuplicateIdentifiers } from './choices.js';
import { createColumns } from './columnsPresentation.js';
import type { DirectedPair } from './presentation.js';
import { MATCH_INTERACTION_STYLES } from './styles.js';
import { createTable } from './tabularPresentation.js';

/**
 * A sentence of the constraint text, with the minimum it asks for: of the
 * whole response (min-associations), or of one choice (its match-min).
 */
interface ConstraintSentence {
  text: string;
  min: number;
  choiceId?: string;
}

/**
 * The constraint sentences: the interaction's min/max-associations, then the
 * match-min of each choice that has one.
 */
function buildConstraintSentences(min: number, max: number, choices: MatchChoice[]): ConstraintSentence[] {
  const plural = (n: number) => `${n} match${n === 1 ? '' : 'es'}`;
  const sentences: ConstraintSentence[] = [];

  if (min > 0 && max > 0 && min !== max) {
    sentences.push({ text: `Make between ${min} and ${max} matches.`, min });
  } else if (min > 0) {
    sentences.push({ text: `Make at least ${plural(min)}.`, min });
  }

  for (const { choice } of choices) {
    if (choice.matchMin <= 0) continue;
    const exact = choice.matchMin === choice.matchMax;
    sentences.push({
      text: `Make ${exact ? '' : 'at least '}${plural(choice.matchMin)} for ${choice.content}.`,
      min: choice.matchMin,
      choiceId: choice.id,
    });
  }

  return sentences;
}

const joinSentences = (sentences: ConstraintSentence[]): string | null =>
  sentences.length > 0 ? sentences.map((sentence) => sentence.text).join(' ') : null;

/**
 * Handler for qti-match-interaction elements.
 *
 * Sources are drawn in word banks and each target as a column: a header over
 * slots that sources are placed into. When the sources' match-groups partition
 * them by target, each column gets its own bank (a "bowtie"); otherwise every
 * source shares one bank. With qti-match-tabular, the interaction is drawn as
 * a table instead: a row per source, a column per target, and an input per
 * cell. The interaction stays a plain two-set directedPair match — only the
 * presentation is derived from the class and the choices.
 *
 * QTI Structure:
 * - qti-match-interaction[response-identifier, shuffle?, max-associations?]
 *   - qti-prompt
 *   - qti-simple-match-set (source set)
 *     - qti-simple-associable-choice[identifier, match-max, match-min?, match-group?]
 *   - qti-simple-match-set (target set)
 *     - qti-simple-associable-choice[identifier, match-max, match-min?, match-group?]
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

    // Note: choices are pre-shuffled by the server in renderTemplate.
    const sources = readMatchSet(matchSets[0]);
    const targets = readMatchSet(matchSets[1]);
    warnDuplicateIdentifiers([...sources, ...targets]);

    // Pass through QTI shared vocabulary (qti-match-tabular, qti-header-hidden,
    // qti-choices-*) so CSS can lay out the table or position the bank(s)
    // relative to the target columns.
    const sourceClasses = element.getAttribute('class');
    if (sourceClasses) {
      container.classList.add(...sourceClasses.split(/\s+/).filter(Boolean));
    }

    const presentation = (container.classList.contains('qti-match-tabular') ? createTable : createColumns)({
      element, container, context, responseIdentifier, maxAssociations, sources, targets,
    });
    const { controller } = presentation;

    // Evaluation of a finished attempt when the delivery options show one,
    // or the last try's verdict on a fresh try
    const evaluation = readEvaluation(element, responseIdentifier, context.styleManager);

    // Add constraint message for min-associations and match-min. A finished
    // attempt with a verdict describes the response in its place, so it is
    // announced with the group; the status rail is the visual verdict.
    let constraint: ConstraintMessage | undefined;
    const verdict = evaluation?.verdict ?? null;
    const constraintSentences = buildConstraintSentences(
      minAssociations, maxAssociations, [...sources, ...targets]
    );
    const associationText = joinSentences(constraintSentences);
    const constraintText = verdict ? getVerdictText(verdict) : associationText;
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

    // Draw the evaluation: the status rail and the correct answer. The verdict
    // is in the constraint text.
    if (evaluation) {
      const pairs = evaluation.correctResponse
        .map(parseDirectedPair)
        .filter((pair): pair is DirectedPair => pair !== null);
      presentation.drawKey(pairs);
      markEvaluated(container, evaluation.verdict);
    }
    clearVerdictOnEdit(context, responseIdentifier, evaluation, () => {
      clearEvaluated(container);
      // Marks that describe the response go with the verdict
      presentation.clearResponseMarks();
      clearConstraintVerdict(constraint, container, associationText);
    });

    // Register response accessor with itemState
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, (options) => {
        const response = controller.getResponse();
        const unmet = constraintSentences.filter((sentence) =>
          (sentence.choiceId ? controller.associationCount(sentence.choiceId) : response.length) < sentence.min
        );
        const isValid = unmet.length === 0;

        if (options?.silent) {
          return { value: response.length > 0 ? response : null, valid: isValid };
        }

        if (!isValid) {
          container.setAttribute('aria-invalid', 'true');
          constraint?.setError(true);
          // The constraint text keeps every requirement as a hint; only the
          // ones still unmet are announced.
          announce(context, joinSentences(unmet) ?? '', 'assertive');
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
