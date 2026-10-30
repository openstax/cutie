/* spell-checker: ignore hottext */
import { findAncestor, getChildElements } from '../utils/dom.js';
import { parseNumber } from '../utils/typeParser.js';
import {
  getAreaMapping,
  getMaxAreaMappedValue,
  getMaxChoiceMappedValue,
  getMaxMappedValue,
  getMaxSelectedAreasMappedValue,
  getOutcomeDeclaration,
  getResponseCardinality,
  getResponseMapping,
} from './responseDeclarations.js';

/**
 * Interactions whose response is a selection of up to max-choices of their
 * choices, with the tag name of those choices
 */
const CHOICE_INTERACTIONS = [
  { interaction: 'qti-choice-interaction', choice: 'qti-simple-choice' },
  { interaction: 'qti-hottext-interaction', choice: 'qti-hottext' },
];

/**
 * The default max-choices of each interaction whose max-choices limits the
 * response, from the QTI 3 XSD (0 means no limit)
 */
const DEFAULT_MAX_CHOICES: Record<string, number> = {
  'qti-choice-interaction': 1,
  'qti-hottext-interaction': 1,
  'qti-select-point-interaction': 0,
};

/**
 * Derives the maximum score for an assessment item: its declared maximum when it
 * has one, otherwise the maximum inferred from its response processing.
 *
 * Strategy (in priority order):
 * 1. Check for explicit MAXSCORE variable
 * 1b. Check for normal-maximum attribute on SCORE outcome declaration
 * 2. Infer it from the response processing rules (see inferMaxScore)
 *
 * @param itemDoc The QTI assessment item document
 * @param variables The current variable state (used to check for explicit MAXSCORE)
 * @returns The derived maximum score, or null if it cannot be determined
 */
export function deriveMaxScore(
  itemDoc: Document,
  variables: Record<string, unknown>
): number | null {
  // 1. Check for explicit MAXSCORE variable
  const maxScoreValue = variables['MAXSCORE'];
  if (typeof maxScoreValue === 'number' && Number.isFinite(maxScoreValue)) {
    return maxScoreValue;
  }

  // 1b. Check for normal-maximum attribute on SCORE outcome declaration
  const normalMaxResult = tryDeriveFromNormalMaximum(itemDoc);
  if (normalMaxResult !== null) {
    return normalMaxResult;
  }

  // 2. Infer it from the response processing rules
  return inferMaxScore(itemDoc);
}

/**
 * Infers the maximum score from an item's response processing rules alone,
 * ignoring any declared maximum (MAXSCORE, normal-maximum).
 *
 * Strategy (in priority order):
 * 1. SCORE set by a single unconditional rule: the most its expression can
 *    evaluate to (see inferExpressionMaxScore), with no further guessing. A
 *    constant SCORE that scores no response gives null.
 * 2. Try pattern: Sum of outcome variables (e.g., SCORE = SCORE1 + SCORE2 + SCORE3 + SCORE4),
 *    for SCORE set conditionally or more than once
 * 3. Try pattern: The most the item's single response mapping can award
 *    (skipped when several declarations have mappings)
 * 4. Try pattern: Response processing template
 * 5. Return null (graceful failure)
 *
 * @param itemDoc The QTI assessment item document
 * @returns The inferred maximum score, or null if it cannot be determined
 */
export function inferMaxScore(itemDoc: Document): number | null {
  // 1. SCORE set by a single unconditional rule
  const scoreExpression = findUnconditionalScoreExpression(itemDoc);
  if (scoreExpression) {
    return isConstantExpression(scoreExpression) ? null : inferExpressionMaxScore(itemDoc, scoreExpression);
  }

  // 2. Try pattern: Sum of outcome variables
  const sumPatternResult = tryDeriveSumPattern(itemDoc);
  if (sumPatternResult !== null) {
    return sumPatternResult;
  }

  // 3. Try pattern: The item's single response mapping
  const mappingMax = tryDeriveFromSingleMapping(itemDoc);
  if (mappingMax !== null) {
    return mappingMax;
  }

  // 4. Try pattern: Response processing template
  const templateScore = tryDeriveFromTemplate(itemDoc);
  if (templateScore !== null) {
    return templateScore;
  }

  // 5. Return null (graceful failure)
  return null;
}

/**
 * Infers the most a response processing expression can evaluate to.
 *
 * Supported expressions:
 * - qti-base-value (float or integer): its value
 * - qti-map-response / qti-map-response-point: the most the response's mapping
 *   can award (see inferResponseMaxScore)
 * - qti-variable: the most the outcome can hold (see inferOutcomeMaxScore)
 * - qti-sum: the sum of its operands' maximums
 * - qti-max / qti-min: the largest / smallest of its operands' maximums
 *
 * Anything else, or any operand that can't be inferred, gives null.
 *
 * @param itemDoc The QTI assessment item document
 * @param expression The expression element
 * @param options.ignoreOutcomeDefaults Treat outcome variables as starting at 0,
 *   whatever their declared default: for response processing that's about to
 *   be saved with new outcome declarations
 * @returns The inferred maximum, or null if it cannot be determined
 */
export function inferExpressionMaxScore(
  itemDoc: Document,
  expression: Element,
  options: { ignoreOutcomeDefaults?: boolean } = {}
): number | null {
  switch (expression.localName) {
    case 'qti-base-value':
      return parseNumericBaseValue(expression);
    case 'qti-map-response':
    case 'qti-map-response-point':
      return inferResponseMaxScore(itemDoc, expression.getAttribute('identifier') || 'RESPONSE');
    case 'qti-variable': {
      const identifier = expression.getAttribute('identifier');
      const scope = findAncestor(expression, 'qti-response-processing') ?? itemDoc;
      return identifier ? inferOutcomeMaxScore(itemDoc, scope, identifier, options.ignoreOutcomeDefaults) : null;
    }
    case 'qti-sum':
    case 'qti-max':
    case 'qti-min': {
      const operands = Array.from(getChildElements(expression)).map(
        (operand) => inferExpressionMaxScore(itemDoc, operand, options)
      );
      if (operands.length === 0 || operands.some((operand) => operand === null)) return null;
      const values = operands as number[];
      if (expression.localName === 'qti-sum') return values.reduce((sum, value) => sum + value, 0);
      return expression.localName === 'qti-max' ? Math.max(...values) : Math.min(...values);
    }
    default:
      return null;
  }
}

/**
 * Infers the most a response's mapping (qti-mapping or qti-area-mapping) can
 * award. Single cardinality takes the best entry. Multiple and ordered
 * responses are only inferred where the interaction limits how many values
 * count: choice and hottext interactions (max-choices choices) and select point
 * interactions (max-choices points). For other interactions how mapped values
 * combine depends on the interaction (gaps, match-max, ...), so no guess is made.
 *
 * @param itemDoc The QTI assessment item document
 * @param identifier The response identifier
 * @returns The inferred maximum, or null if it cannot be determined
 */
export function inferResponseMaxScore(itemDoc: Document, identifier: string): number | null {
  const isSingle = getResponseCardinality(itemDoc, identifier) === 'single';

  const mapping = getResponseMapping(itemDoc, identifier);
  if (mapping) {
    if (mapping.entries.length === 0) return null;
    if (isSingle) return getMaxMappedValue(mapping, 'single');

    for (const { interaction, choice } of CHOICE_INTERACTIONS) {
      const choiceInteraction = findInteraction(itemDoc, interaction, identifier);
      if (choiceInteraction) {
        const choiceIdentifiers = Array.from(choiceInteraction.getElementsByTagName(choice))
          .map((element) => element.getAttribute('identifier'))
          .filter((choiceIdentifier): choiceIdentifier is string => choiceIdentifier !== null);
        return getMaxChoiceMappedValue(mapping, choiceIdentifiers, getMaxChoices(choiceInteraction));
      }
    }
    return null;
  }

  const areaMapping = getAreaMapping(itemDoc, identifier);
  if (areaMapping) {
    if (areaMapping.entries.length === 0) return null;
    if (isSingle) return getMaxAreaMappedValue(areaMapping, 'single');

    const selectPoint = findInteraction(itemDoc, 'qti-select-point-interaction', identifier);
    return selectPoint ? getMaxSelectedAreasMappedValue(areaMapping, getMaxChoices(selectPoint)) : null;
  }

  return null;
}

/**
 * Parse a float or integer qti-base-value, or return null if the element isn't one
 */
export function parseNumericBaseValue(element: Element): number | null {
  if (element.localName !== 'qti-base-value') return null;
  const baseType = element.getAttribute('base-type');
  if (baseType !== 'float' && baseType !== 'integer') return null;
  return parseNumber(element.textContent ?? '');
}

/**
 * The most an outcome variable can hold, when it only ever holds constants: its
 * initial value (its declared default, or 0) and the qti-base-value each
 * qti-set-outcome-value in scope sets it to. Gives null when:
 * - an assignment sets anything other than a numeric qti-base-value
 * - the outcome is also set some other way (qti-lookup-outcome-value, or a
 *   template's qti-set-default-value), which isn't followed
 * - the outcome is neither declared nor assigned
 *
 * @param itemDoc The QTI assessment item document
 * @param scope The response processing the assignments are looked up in
 * @param identifier The outcome identifier
 * @param ignoreDefault Take the initial value as 0, whatever the declared default
 */
function inferOutcomeMaxScore(
  itemDoc: Document,
  scope: Document | Element,
  identifier: string,
  ignoreDefault = false
): number | null {
  const setsIdentifier = (element: Element) => element.getAttribute('identifier') === identifier;
  if (
    Array.from(scope.getElementsByTagName('qti-lookup-outcome-value')).some(setsIdentifier) ||
    Array.from(itemDoc.getElementsByTagName('qti-set-default-value')).some(setsIdentifier)
  ) {
    return null;
  }

  const declaration = getOutcomeDeclaration(itemDoc, identifier);
  const assignments = findOutcomeAssignments(scope, identifier);
  if (!declaration && assignments.length === 0) return null;

  const declaredDefault = ignoreDefault ? null : parseNumber(declaration?.getElementsByTagName('qti-value')[0]?.textContent ?? '');
  const values = [declaredDefault ?? 0];

  for (const assignment of assignments) {
    const operands = Array.from(getChildElements(assignment));
    const value = operands.length === 1 ? parseNumericBaseValue(operands[0]) : null;
    if (value === null) return null;
    values.push(value);
  }

  return Math.max(...values);
}

/**
 * Read an interaction's max-choices (0 for no limit), falling back to the
 * interaction's default when it's missing, negative or not a number
 */
function getMaxChoices(interaction: Element): number {
  const maxChoices = parseInt(interaction.getAttribute('max-choices') ?? '', 10);
  return Number.isNaN(maxChoices) || maxChoices < 0
    ? DEFAULT_MAX_CHOICES[interaction.localName] ?? 1
    : maxChoices;
}

/**
 * Find the expression SCORE is set to when response processing sets it with a
 * single top-level qti-set-outcome-value, and nowhere else.
 */
function findUnconditionalScoreExpression(itemDoc: Document): Element | null {
  const responseProcessing = itemDoc.getElementsByTagName('qti-response-processing')[0];
  if (!responseProcessing) return null;

  const scoreSetters = Array.from(responseProcessing.getElementsByTagName('qti-set-outcome-value'))
    .filter((setter) => setter.getAttribute('identifier') === 'SCORE');
  if (scoreSetters.length !== 1 || scoreSetters[0].parentNode !== responseProcessing) return null;

  const operands = Array.from(getChildElements(scoreSetters[0]));
  return operands.length === 1 ? operands[0] : null;
}

/**
 * Whether an expression is a constant: it reads no response's mapped score and
 * no variable
 */
function isConstantExpression(expression: Element): boolean {
  return !['qti-map-response', 'qti-map-response-point', 'qti-variable'].some(
    (tagName) => expression.localName === tagName || expression.getElementsByTagName(tagName).length > 0
  );
}

/**
 * Find the interaction of the given type bound to a response
 */
function findInteraction(itemDoc: Document, tagName: string, responseIdentifier: string): Element | null {
  return Array.from(itemDoc.getElementsByTagName(tagName))
    .find((interaction) => interaction.getAttribute('response-identifier') === responseIdentifier) ?? null;
}

/**
 * Attempt to derive maxScore from the normal-maximum attribute on the SCORE outcome declaration.
 */
function tryDeriveFromNormalMaximum(itemDoc: Document): number | null {
  // The spec requires it to be positive
  const normalMax = parseNumber(getOutcomeDeclaration(itemDoc, 'SCORE')?.getAttribute('normal-maximum') ?? '');
  return normalMax !== null && normalMax > 0 ? normalMax : null;
}

/**
 * Attempt to derive maxScore from sum of outcome variables pattern.
 * Example: SCORE = sum(SCORE1, SCORE2, SCORE3, SCORE4)
 * Each component variable's maximum is inferred as it is in score expressions
 * (see inferOutcomeMaxScore).
 */
function tryDeriveSumPattern(itemDoc: Document): number | null {
  // Find the final SCORE assignment
  const scoreAssignment = findScoreAssignment(itemDoc);
  if (!scoreAssignment) {
    return null;
  }

  // Check if it's a sum of variables
  const sumAnalysis = isSumOfVariables(scoreAssignment);
  if (!sumAnalysis.isSum) {
    return null;
  }

  // For each variable in the sum, find its maximum value
  const scope = findAncestor(scoreAssignment, 'qti-response-processing') ?? itemDoc;
  let totalMaxScore = 0;
  for (const variableId of sumAnalysis.variableIds) {
    const maxValue = inferOutcomeMaxScore(itemDoc, scope, variableId);
    if (maxValue === null) {
      return null;
    }
    totalMaxScore += maxValue;
  }

  return totalMaxScore;
}

/**
 * Find the final SCORE assignment element.
 * Usually the last qti-set-outcome-value with identifier="SCORE".
 */
function findScoreAssignment(itemDoc: Document): Element | null {
  const assignments = itemDoc.getElementsByTagName('qti-set-outcome-value');
  let lastScoreAssignment: Element | null = null;

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    if (assignment.getAttribute('identifier') === 'SCORE') {
      lastScoreAssignment = assignment;
    }
  }

  return lastScoreAssignment;
}

/**
 * Check if element contains qti-sum with only qti-variable children.
 * Returns the list of variable identifiers if true.
 */
function isSumOfVariables(
  element: Element
): { isSum: boolean; variableIds: string[] } {
  // Find the first qti-sum child
  const sumElements = element.getElementsByTagName('qti-sum');
  if (sumElements.length === 0) {
    return { isSum: false, variableIds: [] };
  }

  const sumElement = sumElements[0];

  // Filter childNodes to only include element nodes
  const children: Element[] = [];
  for (let i = 0; i < sumElement.childNodes.length; i++) {
    const node = sumElement.childNodes[i];
    if (node.nodeType === 1) { // ELEMENT_NODE
      children.push(node as Element);
    }
  }

  // Check if all children are qti-variable elements
  const variableIds: string[] = [];
  for (const child of children) {
    if (child.tagName.toLowerCase() !== 'qti-variable') {
      // Found non-variable child, not a simple sum pattern
      return { isSum: false, variableIds: [] };
    }

    const identifier = child.getAttribute('identifier');
    if (!identifier) {
      return { isSum: false, variableIds: [] };
    }

    variableIds.push(identifier);
  }

  return { isSum: true, variableIds };
}

/**
 * Find all qti-set-outcome-value elements that set a specific outcome variable.
 */
function findOutcomeAssignments(
  scope: Document | Element,
  identifier: string
): Element[] {
  const assignments = scope.getElementsByTagName('qti-set-outcome-value');
  const matches: Element[] = [];

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    if (assignment.getAttribute('identifier') === identifier) {
      matches.push(assignment);
    }
  }

  return matches;
}

/**
 * Try to derive maxScore from the item's response mapping.
 *
 * Only when exactly one response declaration has a mapping (qti-mapping or
 * qti-area-mapping): the most that mapping can award is then the most SCORE can
 * be. With several mappings, how they combine into SCORE is up to response
 * processing, so no guess is made.
 */
function tryDeriveFromSingleMapping(itemDoc: Document): number | null {
  const mappedDeclarations = Array.from(
    itemDoc.getElementsByTagName('qti-response-declaration')
  ).filter((declaration) =>
    declaration.getElementsByTagName('qti-mapping').length > 0 ||
    declaration.getElementsByTagName('qti-area-mapping').length > 0
  );

  if (mappedDeclarations.length !== 1) {
    return null;
  }

  const declaration = mappedDeclarations[0];
  const identifier = declaration.getAttribute('identifier');
  if (!identifier) {
    return null;
  }

  return inferResponseMaxScore(itemDoc, identifier);
}

/**
 * Try to derive maxScore from response processing template.
 */
function tryDeriveFromTemplate(itemDoc: Document): number | null {
  const responseProcessing = itemDoc.getElementsByTagName('qti-response-processing')[0];
  if (!responseProcessing) {
    return null;
  }

  const template = responseProcessing.getAttribute('template');
  if (!template) {
    return null;
  }

  // Normalize template URL to get the template name
  const templateName = template.split('/').pop()?.replace('.xml', '') || '';

  // match_correct template and similar templates always score 0 or 1
  if (
    templateName === 'match_correct' ||
    templateName === 'CC2_match_basic' ||
    templateName === 'CC2_match'
  ) {
    return 1;
  }

  return null;
}
