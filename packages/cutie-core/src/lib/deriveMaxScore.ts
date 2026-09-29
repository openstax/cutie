import {
  getAreaMapping,
  getMaxAreaMappedValue,
  getMaxMappedValue,
  getResponseMapping,
} from './responseDeclarations';

/**
 * Derives the maximum score for an assessment item by analyzing the response processing rules.
 *
 * Strategy (in priority order):
 * 1. Check for explicit MAXSCORE variable
 * 1b. Check for normal-maximum attribute on SCORE outcome declaration
 * 2. Try pattern: Sum of outcome variables (e.g., SCORE = SCORE1 + SCORE2 + SCORE3 + SCORE4)
 * 3. Try pattern: The most the item's single response mapping can award
 *    (skipped when several declarations have mappings)
 * 4. Try pattern: Response processing template
 * 5. Return null (graceful failure)
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
  if (typeof maxScoreValue === 'number') {
    return maxScoreValue;
  }

  // 1b. Check for normal-maximum attribute on SCORE outcome declaration
  const normalMaxResult = tryDeriveFromNormalMaximum(itemDoc);
  if (normalMaxResult !== null) {
    return normalMaxResult;
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
 * Attempt to derive maxScore from the normal-maximum attribute on the SCORE outcome declaration.
 */
function tryDeriveFromNormalMaximum(itemDoc: Document): number | null {
  const outcomeDeclarations = itemDoc.getElementsByTagName('qti-outcome-declaration');
  for (let i = 0; i < outcomeDeclarations.length; i++) {
    const decl = outcomeDeclarations[i];
    if (decl.getAttribute('identifier') === 'SCORE') {
      const normalMax = decl.getAttribute('normal-maximum');
      if (normalMax !== null) {
        const parsed = parseFloat(normalMax);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
      break;
    }
  }
  return null;
}

/**
 * Attempt to derive maxScore from sum of outcome variables pattern.
 * Example: SCORE = sum(SCORE1, SCORE2, SCORE3, SCORE4)
 * For each component variable, find all assignments and take the maximum literal value.
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
  let totalMaxScore = 0;
  for (const variableId of sumAnalysis.variableIds) {
    const assignments = findOutcomeAssignments(itemDoc, variableId);
    if (assignments.length === 0) {
      // Cannot find assignments for this variable, fail gracefully
      return null;
    }

    const values = extractBaseValueFloats(assignments);
    if (values.length === 0) {
      // No literal values found, fail gracefully
      return null;
    }

    const maxValue = Math.max(...values);
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
  itemDoc: Document,
  identifier: string
): Element[] {
  const assignments = itemDoc.getElementsByTagName('qti-set-outcome-value');
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
 * Extract all qti-base-value elements with base-type="float" from assignment elements.
 * Recursively searches within qti-response-if/else-if/else blocks.
 */
function extractBaseValueFloats(assignments: Element[]): number[] {
  const values: number[] = [];

  for (const assignment of assignments) {
    // Find all descendant qti-base-value elements with base-type="float"
    const baseValues = assignment.getElementsByTagName('qti-base-value');

    for (let i = 0; i < baseValues.length; i++) {
      const baseValue = baseValues[i];
      const baseType = baseValue.getAttribute('base-type');

      if (baseType === 'float') {
        const textContent = baseValue.textContent;
        if (textContent) {
          const parsed = parseFloat(textContent.trim());
          if (!isNaN(parsed)) {
            values.push(parsed);
          }
        }
      }
    }
  }

  return values;
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

  const cardinality = declaration.getAttribute('cardinality') || 'single';

  const mapping = getResponseMapping(itemDoc, identifier);
  if (mapping) {
    return mapping.entries.length > 0 ? getMaxMappedValue(mapping, cardinality) : null;
  }

  const areaMapping = getAreaMapping(itemDoc, identifier);
  if (areaMapping) {
    return areaMapping.entries.length > 0 ? getMaxAreaMappedValue(areaMapping, cardinality) : null;
  }

  return null;
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
