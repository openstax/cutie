/* spell-checker: ignore inlines */
import { AttemptState, FeedbackIdentity, ProcessingOptions } from '../types.js';
import { createValueContainer } from '../utils/valueContainer.js';
import { isAdaptive } from './adaptive.js';
import { finishContent, removeReservedMarkup } from './content.js';
import { canEvaluate } from './deliveryOptions.js';
import { evaluateResponse, ResponseEvaluation } from './evaluateResponses.js';
import { getCorrectResponse } from './responseDeclarations.js';
import { inlineDockedStimuli } from './stimulus.js';
import { evaluateTry } from './tries.js';
import { getFeedbackElements, processFeedbackVisibility, processTemplateConditionals } from './visibility.js';

/**
 * Renders a sanitized QTI template for client consumption.
 *
 * Builds the sanitized document (see buildTemplateDocument), finishes it
 * for the client (see serializeTemplate), and serializes it to XML.
 *
 * This runs after both initializeState and processResponse to generate
 * the template that the client will render.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param state - Current attempt state with variable values
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to sanitized QTI XML string safe for client rendering
 */
export async function renderTemplate(
  itemDoc: Document,
  state: AttemptState,
  options?: ProcessingOptions
): Promise<string> {
  return serializeTemplate(buildTemplateDocument(itemDoc, state), options);
}

/**
 * Builds the sanitized template document for an attempt state.
 *
 * This function:
 * 1. Substitutes template and outcome variable values into the item body
 * 2. Applies conditional visibility rules based on current state, replacing
 *    each template block or inline shown with its content
 * 3. Shows/hides feedback elements based on outcome variables, and removes
 *    feedback the attempt withholds (see AttemptState.withheldFeedback)
 * 4. Strips sensitive content that should not be exposed to the client:
 *    - qti-template-declaration elements
 *    - qti-template-processing rules
 *    - qti-response-processing rules
 *    - qti-correct-response, qti-mapping from response declarations
 *    - Response declarations not used in the filtered body
 *    - Hidden feedback that shouldn't be visible yet
 * 5. Injects current response values as qti-default-value elements
 * 6. Once the attempt can be evaluated, adds the evaluation its delivery options allow
 *    (see applyEvaluation); at the start of a fresh try, the last try's verdict
 *    (see applyRetryVerdict)
 *
 * The result depends only on the item and the state, so rendering the same
 * state again produces the same document.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param state - Current attempt state with variable values
 * @returns A sanitized copy of the item document
 */
export function buildTemplateDocument(itemDoc: Document, state: AttemptState): Document {
  // Clone the document to avoid mutating the original
  const clonedDoc = itemDoc.cloneNode(true) as Document;
  const root = clonedDoc.documentElement;

  // Step 1: Remove sensitive content that shouldn't be exposed to the client,
  // and any authored copy of the markup only core may add
  removeSensitiveElements(root);
  removeReservedMarkup(root);

  // Step 2: Substitute template variables into qti-printed-variable elements
  substituteVariables(root, state.variables);

  // Step 3: Process conditional template elements (blocks, inlines, choices),
  // leaving the content of those shown in place of them
  processTemplateConditionals(root, state.variables);
  unwrapTemplateContent(root);

  // Step 3.5: Apply shuffle orders to reorder interaction choices
  if (state.shuffleOrders) {
    applyShuffleOrders(root, state.shuffleOrders);
  }

  // Step 4: Process feedback visibility based on outcome variables
  processFeedbackVisibility(root, state.variables);

  // Step 4.5: Remove feedback the attempt withholds from the learner
  if (state.withheldFeedback) {
    removeWithheldFeedback(root, state.withheldFeedback);
  }

  // Step 5: Substitute math variables in MathML expressions
  substituteMathVariables(root, state.variables);

  // Step 6: Sanitize response declarations (after body is filtered)
  sanitizeResponseDeclarations(root, state.variables);

  // Step 6.5: Add the evaluation the attempt's delivery options allow
  if (canEvaluate(state)) {
    applyEvaluation(root, itemDoc, state);
  } else if (state.retryVerdict && state.variables.numAttempts === 0) {
    applyRetryVerdict(root, itemDoc, state, state.retryVerdict);
  }

  // Step 7: Clean up empty text nodes and normalize whitespace
  normalizeWhitespace(root);

  return clonedDoc;
}

/**
 * Builds the template document for a preview of the item (see renderPreview):
 * the item as an attempt at it begins, with the correct response of each
 * interaction, for an instructor or author rather than a learner.
 *
 * Unlike an attempt's template:
 * - choices keep their authored order (the state is initialized without shuffling)
 * - each response declaration with a correct response gets a qti-correct-response,
 *   with no verdict, as nothing has been submitted
 * - a printed outcome variable reads as a placeholder naming it (`[SCORE]`):
 *   outcomes only take their values from response processing
 * - with `allFeedback`, every feedback element is kept whatever its condition,
 *   rather than the feedback the initial outcomes show, and modal feedback
 *   becomes block feedback (see modalFeedbackToBlocks)
 * - the item body has a data-cutie-preview attribute, so clients can show the
 *   interactions to an instructor rather than as a learner's empty response
 *
 * @param itemDoc - Parsed QTI assessment item XML document, instantiated for state
 * @param state - A newly initialized attempt state
 * @param allFeedback - Whether to keep every feedback element
 * @returns A sanitized copy of the item document
 */
export function buildPreviewDocument(itemDoc: Document, state: AttemptState, allFeedback: boolean): Document {
  const clonedDoc = itemDoc.cloneNode(true) as Document;
  const root = clonedDoc.documentElement;
  const printedVariables = withOutcomePlaceholders(itemDoc, state.variables);

  removeSensitiveElements(root);
  removeReservedMarkup(root);
  substituteVariables(root, printedVariables);
  processTemplateConditionals(root, state.variables);
  unwrapTemplateContent(root);

  if (allFeedback) {
    modalFeedbackToBlocks(root);
  } else {
    processFeedbackVisibility(root, state.variables);
  }

  substituteMathVariables(root, state.variables);
  sanitizeResponseDeclarations(root, state.variables);
  addCorrectResponses(root, itemDoc);
  markPreview(root);
  normalizeWhitespace(root);

  return clonedDoc;
}

/**
 * Replaces each qti-modal-feedback with a qti-feedback-block, with the same
 * attributes and content, at the end of the item body: where clients show modal
 * feedback after the item, but in place, as a preview shows every feedback
 * element at once rather than one dialog after another.
 */
function modalFeedbackToBlocks(root: Element): void {
  const itemBody = root.getElementsByTagName('qti-item-body')[0];
  if (!itemBody) return;

  for (const modal of Array.from(root.getElementsByTagName('qti-modal-feedback'))) {
    const block = root.ownerDocument.createElementNS(modal.namespaceURI, 'qti-feedback-block');
    for (const attribute of Array.from(modal.attributes)) {
      block.setAttribute(attribute.name, attribute.value);
    }
    while (modal.firstChild) {
      block.appendChild(modal.firstChild);
    }
    modal.parentNode?.removeChild(modal);
    itemBody.appendChild(block);
  }
}

/**
 * The variables with each declared outcome's value replaced by a placeholder
 * naming it, for printing in a preview
 */
function withOutcomePlaceholders(
  itemDoc: Document,
  variables: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...variables };
  for (const declaration of Array.from(itemDoc.getElementsByTagName('qti-outcome-declaration'))) {
    const identifier = declaration.getAttribute('identifier');
    if (identifier) result[identifier] = `[${identifier}]`;
  }
  return result;
}

/**
 * Finishes a built template document for the client: inlines the stimuli its
 * body docks (see inlineDockedStimuli), resolves asset URLs if a resolver is
 * provided, each with the document it appears in, then serializes it to an XML
 * string. Mutates the document.
 */
export async function serializeTemplate(
  doc: Document,
  options?: ProcessingOptions
): Promise<string> {
  const baseOf = await inlineDockedStimuli(doc.documentElement, options?.resolveStimuli);
  return finishContent(doc, options, baseOf);
}

/**
 * The feedback elements visible in a built template document, in document order.
 */
export function collectVisibleFeedback(root: Element): FeedbackIdentity[] {
  return getFeedbackElements(root).map(getFeedbackIdentity);
}

/**
 * A string key for a feedback identity, for set comparisons.
 */
export function feedbackKey(feedback: FeedbackIdentity): string {
  return `${feedback.tagName}|${feedback.outcomeIdentifier}|${feedback.identifier}`;
}

function getFeedbackIdentity(element: Element): FeedbackIdentity {
  return {
    tagName: element.tagName,
    outcomeIdentifier: element.getAttribute('outcome-identifier') ?? '',
    identifier: element.getAttribute('identifier') ?? '',
  };
}

/**
 * Removes every feedback element matching one of the withheld identities.
 */
function removeWithheldFeedback(root: Element, withheld: FeedbackIdentity[]): void {
  const withheldKeys = new Set(withheld.map(feedbackKey));

  for (const element of getFeedbackElements(root)) {
    if (withheldKeys.has(feedbackKey(getFeedbackIdentity(element)))) {
      element.parentNode?.removeChild(element);
    }
  }
}

/**
 * Adds the evaluation allowed by the attempt's showEvaluation option to the
 * template of an attempt that can be evaluated (see canEvaluate):
 *
 * - `'correctness'`: a data-cutie-evaluation attribute ("correct", "incorrect" or
 *   "partial") on each interaction whose response can be judged
 *   (see evaluateResponse), and on the item body for the attempt as a whole
 *   (see evaluateTry)
 * - `'correctResponse'`: the verdict, plus a qti-correct-response holding this
 *   attempt's correct value in each response declaration that has one
 *
 * Nothing else about how responses are judged (mappings, the correct response
 * under `'correctness'`) reaches the template.
 */
function applyEvaluation(root: Element, itemDoc: Document, state: AttemptState): void {
  const { showEvaluation } = state.options;
  if (showEvaluation === 'none') return;

  markInteractionVerdicts(root, itemDoc, state);
  markItemVerdict(root, evaluateTry(itemDoc, state));

  if (showEvaluation === 'correctResponse') {
    addCorrectResponses(root, itemDoc);
  }
}

/**
 * Adds a qti-correct-response, holding the attempt's correct value, to each
 * response declaration left in the template that has one
 */
function addCorrectResponses(root: Element, itemDoc: Document): void {
  for (const declaration of Array.from(root.getElementsByTagName('qti-response-declaration'))) {
    const identifier = declaration.getAttribute('identifier');
    if (!identifier) continue;

    const correctValue = getCorrectResponse(itemDoc, identifier);
    if (correctValue !== null) {
      declaration.appendChild(
        createValueContainer(declaration.ownerDocument, 'qti-correct-response', correctValue)
      );
    }
  }
}

/**
 * Shows the verdict of the try that fell short at the start of the fresh try
 * that follows it (before its first submission), whatever showEvaluation
 * allows once the attempt is terminal:
 *
 * - a non-adaptive item keeps the learner's responses, so each interaction gets
 *   its data-cutie-evaluation, and the item body the try's, as under `'correctness'`
 * - an adaptive item starts over, so a message leads the item body instead:
 *   the adaptiveRetryMessage, in an element with data-cutie-retry set to the verdict
 */
function applyRetryVerdict(
  root: Element,
  itemDoc: Document,
  state: AttemptState,
  verdict: 'incorrect' | 'partial'
): void {
  if (!isAdaptive(itemDoc)) {
    markInteractionVerdicts(root, itemDoc, state);
    markItemVerdict(root, verdict);
    return;
  }

  const itemBody = root.getElementsByTagName('qti-item-body')[0];
  if (!itemBody) return;

  const message = itemBody.ownerDocument.createElementNS(itemBody.namespaceURI, 'div');
  message.setAttribute('data-cutie-retry', verdict);
  message.appendChild(
    itemBody.ownerDocument.createTextNode(
      state.options.adaptiveRetryMessage.split('{n}').join(String(state.triesRemaining))
    )
  );
  itemBody.insertBefore(message, itemBody.firstChild);
}

/**
 * Adds a data-cutie-preview attribute to the item body (see buildPreviewDocument).
 */
function markPreview(root: Element): void {
  root.getElementsByTagName('qti-item-body')[0]?.setAttribute('data-cutie-preview', 'true');
}

/**
 * Adds a data-cutie-evaluation attribute to the item body for the response as a
 * whole, when it can be judged: the one clients announce, where each
 * interaction's is read with the interaction.
 */
function markItemVerdict(root: Element, verdict: ResponseEvaluation | null): void {
  const itemBody = root.getElementsByTagName('qti-item-body')[0];
  if (itemBody && verdict) itemBody.setAttribute('data-cutie-evaluation', verdict);
}

/**
 * Adds a data-cutie-evaluation attribute ("correct", "incorrect" or "partial") to
 * each interaction whose response can be judged (see evaluateResponse)
 */
function markInteractionVerdicts(root: Element, itemDoc: Document, state: AttemptState): void {
  const itemBody = root.getElementsByTagName('qti-item-body')[0];
  if (!itemBody) return;

  for (const declaration of Array.from(root.getElementsByTagName('qti-response-declaration'))) {
    const identifier = declaration.getAttribute('identifier');
    if (!identifier) continue;

    const evaluation = evaluateResponse(itemDoc, identifier, state.variables);
    if (evaluation) {
      for (const interaction of findInteractions(itemBody, identifier)) {
        interaction.setAttribute('data-cutie-evaluation', evaluation);
      }
    }
  }
}

/**
 * Elements in the item body bound to the given response identifier
 */
function findInteractions(itemBody: Element, responseIdentifier: string): Element[] {
  return Array.from(itemBody.getElementsByTagName('*')).filter(
    (element) => element.getAttribute('response-identifier') === responseIdentifier
  );
}

/**
 * Substitutes variable values into qti-printed-variable elements.
 * Replaces each qti-printed-variable element with a text node containing the variable value.
 * If the variable is missing or null/undefined, replaces with an empty text node.
 */
function substituteVariables(
  root: Element,
  variables: Record<string, unknown>
): void {
  const printedVars = Array.from(
    root.getElementsByTagName('qti-printed-variable')
  );

  for (const printedVar of printedVars) {
    const identifier = printedVar.getAttribute('identifier');
    if (!identifier) continue;

    const value = variables[identifier];

    // Convert the value to a string representation (empty string if missing)
    const textValue = value === undefined || value === null ? '' : String(value);

    // Create a text node with the value
    const textNode = root.ownerDocument.createTextNode(textValue);

    // Replace the qti-printed-variable element with the text node
    const parent = printedVar.parentNode;
    if (parent) {
      parent.replaceChild(textNode, printedVar);
    }
  }
}

/**
 * Removes sensitive elements from the document that should not be exposed to the client.
 * This includes:
 * - qti-outcome-declaration
 * - qti-template-declaration
 * - qti-template-processing
 * - qti-response-processing
 * - qti-rubric-block elements not intended for the candidate view
 *
 * Note: qti-response-declaration elements are kept but sanitized separately.
 */
function removeSensitiveElements(root: Element): void {
  const sensitiveTagNames = [
    'qti-outcome-declaration',
    'qti-template-declaration',
    'qti-template-processing',
    'qti-response-processing',
  ];

  for (const tagName of sensitiveTagNames) {
    const elements = Array.from(root.getElementsByTagName(tagName));
    for (const element of elements) {
      element.parentNode?.removeChild(element);
    }
  }

  // Remove rubric blocks not intended for candidates
  const rubricBlocks = Array.from(root.getElementsByTagName('qti-rubric-block'));
  for (const rubric of rubricBlocks) {
    const view = rubric.getAttribute('view') ?? '';
    const views = view.split(/\s+/).filter(Boolean);
    if (!views.includes('candidate')) {
      rubric.parentNode?.removeChild(rubric);
    }
  }
}

/**
 * Replaces each qti-template-block and qti-template-inline left after template
 * conditionals with its content (a block's qti-content-body, or an inline's
 * children). Their visibility is decided for the attempt, so the client gets
 * the content alone, with nothing template-specific to render.
 */
function unwrapTemplateContent(root: Element): void {
  const templateElements = [
    ...Array.from(root.getElementsByTagName('qti-template-block')),
    ...Array.from(root.getElementsByTagName('qti-template-inline')),
  ];

  for (const element of templateElements) {
    const parent = element.parentNode;
    if (!parent) continue;

    const contentBody = Array.from(element.childNodes).find(
      (node): node is Element => node.nodeType === 1 && (node as Element).tagName === 'qti-content-body'
    );
    const content = contentBody ?? element;
    while (content.firstChild) {
      parent.insertBefore(content.firstChild, element);
    }
    parent.removeChild(element);
  }
}

/**
 * Substitutes template variables into MathML expressions.
 * Looks for <m:mi> and <m:mn> elements whose text content matches a variable identifier,
 * and replaces the content with the variable's value.
 */
function substituteMathVariables(
  root: Element,
  variables: Record<string, unknown>
): void {
  // Get all MathML identifier (mi) and number (mn) elements
  // MathML uses the namespace http://www.w3.org/1998/Math/MathML
  const mathElements = [
    ...Array.from(root.getElementsByTagName('m:mi')),
    ...Array.from(root.getElementsByTagName('m:mn')),
  ];

  for (const mathElement of mathElements) {
    const textContent = mathElement.textContent?.trim();
    if (!textContent) continue;

    // Check if this text content matches a variable identifier
    const value = variables[textContent];
    if (value === undefined || value === null) continue;

    // Replace the text content with the variable value
    mathElement.textContent = String(value);
  }
}

/**
 * Sanitizes qti-response-declaration elements:
 * 1. Collects response-identifier attributes from interaction elements in the body
 * 2. Removes declarations for identifiers not used in the filtered body
 * 3. Strips sensitive children (qti-correct-response, qti-mapping, qti-area-mapping)
 * 4. Injects qti-default-value with current response values from state
 */
function sanitizeResponseDeclarations(
  root: Element,
  variables: Record<string, unknown>
): void {
  // Step 1: Find all response identifiers used in the item body
  const itemBody = root.getElementsByTagName('qti-item-body')[0];
  const usedIdentifiers = new Set<string>();

  if (itemBody) {
    // Get all elements in the body that might have response-identifier
    const allElements = itemBody.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const responseId = element?.getAttribute('response-identifier');
      if (responseId) {
        usedIdentifiers.add(responseId);
      }
    }
  }

  // Step 2: Process all qti-response-declaration elements
  const declarations = Array.from(
    root.getElementsByTagName('qti-response-declaration')
  );

  for (const declaration of declarations) {
    const identifier = declaration.getAttribute('identifier');

    // Remove declarations not used in the body
    if (!identifier || !usedIdentifiers.has(identifier)) {
      declaration.parentNode?.removeChild(declaration);
      continue;
    }

    // Step 3: Remove sensitive child elements
    const sensitiveChildren = [
      'qti-correct-response',
      'qti-mapping',
      'qti-area-mapping',
    ];

    for (const tagName of sensitiveChildren) {
      const elements = Array.from(declaration.getElementsByTagName(tagName));
      for (const element of elements) {
        element.parentNode?.removeChild(element);
      }
    }

    // Step 4: Inject default value if response exists in state
    const responseValue = variables[identifier];
    if (responseValue !== undefined && responseValue !== null) {
      // Remove any existing qti-default-value first
      const existingDefaults = Array.from(
        declaration.getElementsByTagName('qti-default-value')
      );
      for (const existing of existingDefaults) {
        existing.parentNode?.removeChild(existing);
      }

      // Append new qti-default-value element
      declaration.appendChild(
        createValueContainer(declaration.ownerDocument, 'qti-default-value', responseValue)
      );
    }
  }
}

/**
 * Normalizes whitespace in the document by removing whitespace-only text nodes
 * that are direct children of qti-assessment-item.
 *
 * qti-assessment-item should only contain structural elements, so any text nodes
 * are just formatting. We remove all whitespace-only text nodes and add single
 * newlines between elements for readability.
 */
function normalizeWhitespace(root: Element): void {
  if (root.nodeName !== 'qti-assessment-item') {
    return;
  }

  const childNodes = Array.from(root.childNodes);

  // Remove all whitespace-only text nodes
  for (const child of childNodes) {
    if (child.nodeType === 3) {
      const textNode = child as Text;
      if (textNode.textContent?.trim() === '') {
        root.removeChild(child);
      }
    }
  }

  // Add single newline + indent between element children for formatting
  const elementChildren = Array.from(root.childNodes).filter(
    (node) => node.nodeType === 1
  );

  for (let i = 0; i < elementChildren.length; i++) {
    const elem = elementChildren[i];
    // Add newline before each element (except we'll handle the first one separately)
    if (i > 0) {
      root.insertBefore(root.ownerDocument.createTextNode('\n\n    '), elem);
    }
  }

  // Add newline at the start (after opening tag) and end (before closing tag)
  if (elementChildren.length > 0) {
    root.insertBefore(
      root.ownerDocument.createTextNode('\n\n    '),
      elementChildren[0]
    );
    root.appendChild(root.ownerDocument.createTextNode('\n\n  '));
  }
}

/**
 * Applies shuffle orders to reorder interaction choice elements.
 * Each interaction type has its choices reordered according to the stored shuffle order.
 */
function applyShuffleOrders(
  root: Element,
  shuffleOrders: Record<string, string[]>
): void {
  // Apply to choice interactions
  applyShuffleToChoiceInteractions(root, shuffleOrders);

  // Apply to inline-choice interactions
  applyShuffleToInlineChoiceInteractions(root, shuffleOrders);

  // Apply to match interactions
  applyShuffleToMatchInteractions(root, shuffleOrders);

  // Apply to gap-match interactions
  applyShuffleToGapMatchInteractions(root, shuffleOrders);
}

/**
 * Reorders qti-simple-choice elements within qti-choice-interaction.
 */
function applyShuffleToChoiceInteractions(
  root: Element,
  shuffleOrders: Record<string, string[]>
): void {
  const interactions = root.getElementsByTagName('qti-choice-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    const responseId = interaction.getAttribute('response-identifier');
    if (!responseId || !shuffleOrders[responseId]) continue;

    const order = shuffleOrders[responseId];
    reorderChildrenByIdentifier(interaction, 'qti-simple-choice', order);
  }
}

/**
 * Reorders qti-inline-choice elements within qti-inline-choice-interaction.
 */
function applyShuffleToInlineChoiceInteractions(
  root: Element,
  shuffleOrders: Record<string, string[]>
): void {
  const interactions = root.getElementsByTagName('qti-inline-choice-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    const responseId = interaction.getAttribute('response-identifier');
    if (!responseId || !shuffleOrders[responseId]) continue;

    const order = shuffleOrders[responseId];
    reorderChildrenByIdentifier(interaction, 'qti-inline-choice', order);
  }
}

/**
 * Reorders choices within qti-match-interaction match sets.
 * Uses keys like RESPONSE_0 and RESPONSE_1 for each match set.
 */
function applyShuffleToMatchInteractions(
  root: Element,
  shuffleOrders: Record<string, string[]>
): void {
  const interactions = root.getElementsByTagName('qti-match-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    const responseId = interaction.getAttribute('response-identifier');
    if (!responseId) continue;

    const matchSets = interaction.getElementsByTagName('qti-simple-match-set');

    for (let setIndex = 0; setIndex < matchSets.length; setIndex++) {
      const matchSet = matchSets[setIndex];
      const orderKey = `${responseId}_${setIndex}`;
      const order = shuffleOrders[orderKey];

      if (order) {
        reorderChildrenByIdentifier(matchSet, 'qti-simple-associable-choice', order);
      }
    }
  }
}

/**
 * Reorders qti-gap-text and qti-gap-img elements within qti-gap-match-interaction.
 */
function applyShuffleToGapMatchInteractions(
  root: Element,
  shuffleOrders: Record<string, string[]>
): void {
  const interactions = root.getElementsByTagName('qti-gap-match-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    const responseId = interaction.getAttribute('response-identifier');
    if (!responseId || !shuffleOrders[responseId]) continue;

    const order = shuffleOrders[responseId];
    reorderGapMatchChoices(interaction, order);
  }
}

/**
 * Reorders child elements of a specific tag name according to the given identifier order.
 */
function reorderChildrenByIdentifier(
  parent: Element,
  childTagName: string,
  order: string[]
): void {
  const children = Array.from(parent.getElementsByTagName(childTagName));

  // Create a map of identifier to element
  const elementMap = new Map<string, Element>();
  for (const child of children) {
    const identifier = child.getAttribute('identifier');
    if (identifier) {
      elementMap.set(identifier, child);
    }
  }

  // Find the first child element to use as insertion point
  const firstChild = children[0];
  if (!firstChild) return;

  // Remove all choice elements
  for (const child of children) {
    parent.removeChild(child);
  }

  // Re-insert in the specified order
  const insertionPoint = firstChild.nextSibling;
  for (const identifier of order) {
    const element = elementMap.get(identifier);
    if (element) {
      if (insertionPoint) {
        parent.insertBefore(element, insertionPoint);
      } else {
        parent.appendChild(element);
      }
    }
  }
}

/**
 * Reorders gap-text and gap-img elements within a gap-match interaction.
 * These are direct children of the interaction, mixed with other content.
 */
function reorderGapMatchChoices(interaction: Element, order: string[]): void {
  // Collect gap-text and gap-img elements
  const gapChoices: Element[] = [];
  const childNodes = Array.from(interaction.childNodes);

  for (const node of childNodes) {
    if (node.nodeType === 1) {
      const element = node as Element;
      const tagName = element.tagName?.toLowerCase();
      if (tagName === 'qti-gap-text' || tagName === 'qti-gap-img') {
        gapChoices.push(element);
      }
    }
  }

  if (gapChoices.length === 0) return;

  // Create a map of identifier to element
  const elementMap = new Map<string, Element>();
  for (const choice of gapChoices) {
    const identifier = choice.getAttribute('identifier');
    if (identifier) {
      elementMap.set(identifier, choice);
    }
  }

  // Find the position of the first gap choice
  const firstChoice = gapChoices[0];
  const insertionPoint = firstChoice;

  // Remove all gap choices
  for (const choice of gapChoices) {
    interaction.removeChild(choice);
  }

  // Find the new insertion point (the element that was after the first choice, or the first child)
  let insertBefore: Node | null = null;
  for (const node of Array.from(interaction.childNodes)) {
    if (node === insertionPoint) {
      insertBefore = node;
      break;
    }
  }
  // If the first choice was at the beginning, insert at the beginning
  if (!insertBefore) {
    insertBefore = interaction.firstChild;
  }

  // Re-insert in the specified order
  for (const identifier of order) {
    const element = elementMap.get(identifier);
    if (element) {
      if (insertBefore) {
        interaction.insertBefore(element, insertBefore);
      } else {
        interaction.appendChild(element);
      }
    }
  }
}
