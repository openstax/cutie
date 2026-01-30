/**
 * Derives the maximum score for an assessment item by analyzing the response processing rules.
 *
 * Strategy (in priority order):
 * 1. Check for explicit MAXSCORE variable
 * 2. Try pattern: Sum of outcome variables (e.g., SCORE = SCORE1 + SCORE2 + SCORE3 + SCORE4)
 * 3. Try pattern: Mapping upper-bound
 * 4. Try pattern: Sum of map-entries
 * 5. Try pattern: Response processing template
 * 6. Return null (graceful failure)
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

  // 2. Try pattern: Sum of outcome variables
  const sumPatternResult = tryDeriveSumPattern(itemDoc);
  if (sumPatternResult !== null) {
    return sumPatternResult;
  }

  // 3. Try pattern: Mapping upper-bound
  const mappingUpperBound = tryDeriveMappingUpperBound(itemDoc);
  if (mappingUpperBound !== null) {
    return mappingUpperBound;
  }

  // 4. Try pattern: Sum of map-entries
  const mapEntriesSum = tryDeriveSumOfMapEntries(itemDoc);
  if (mapEntriesSum !== null) {
    return mapEntriesSum;
  }

  // 5. Try pattern: Response processing template
  const templateScore = tryDeriveFromTemplate(itemDoc);
  if (templateScore !== null) {
    return templateScore;
  }

  // 6. Return null (graceful failure)
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
 * Try to derive maxScore from mapping upper-bound attribute.
 */
function tryDeriveMappingUpperBound(itemDoc: Document): number | null {
  const responseDeclarations = itemDoc.getElementsByTagName('qti-response-declaration');

  for (let i = 0; i < responseDeclarations.length; i++) {
    const declaration = responseDeclarations[i];
    const mappingElements = declaration.getElementsByTagName('qti-mapping');

    if (mappingElements.length > 0) {
      const mappingElement = mappingElements[0];
      const upperBound = mappingElement.getAttribute('upper-bound');

      if (upperBound !== null) {
        const parsed = parseFloat(upperBound);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
  }

  return null;
}

/**
 * Try to derive maxScore from map-entries.
 * For single cardinality: returns the maximum mapped value (only one can be selected).
 * For multiple/ordered cardinality: sums positive mapped values.
 * Respects lower-bound if present.
 */
function tryDeriveSumOfMapEntries(itemDoc: Document): number | null {
  const responseDeclarations = itemDoc.getElementsByTagName('qti-response-declaration');

  for (let i = 0; i < responseDeclarations.length; i++) {
    const declaration = responseDeclarations[i];
    const mappingElements = declaration.getElementsByTagName('qti-mapping');

    if (mappingElements.length > 0) {
      const mappingElement = mappingElements[0];
      const mapEntries = mappingElement.getElementsByTagName('qti-map-entry');

      if (mapEntries.length === 0) {
        continue;
      }

      const values: number[] = [];
      for (let j = 0; j < mapEntries.length; j++) {
        const mapEntry = mapEntries[j];
        const mappedValue = mapEntry.getAttribute('mapped-value');

        if (mappedValue !== null) {
          const parsed = parseFloat(mappedValue);
          if (!isNaN(parsed)) {
            values.push(parsed);
          }
        }
      }

      if (values.length === 0) {
        continue;
      }

      // Get cardinality from the response declaration
      const cardinality = declaration.getAttribute('cardinality') || 'single';
      const isSingleCardinality = cardinality === 'single';

      // Check for lower-bound
      const lowerBound = mappingElement.getAttribute('lower-bound');
      const hasLowerBound = lowerBound !== null;

      // For single cardinality, only one value can be selected, so take the max
      // For multiple/ordered cardinality, sum the values (respecting lower-bound)
      let maxScore: number;
      if (isSingleCardinality) {
        // Single cardinality: max of positive values (or all values if no lower-bound constraint)
        const positiveValues = values.filter(v => v > 0);
        maxScore = positiveValues.length > 0 ? Math.max(...positiveValues) : 0;
      } else if (hasLowerBound) {
        // Multiple/ordered with lower-bound: sum only positive values
        const positiveValues = values.filter(v => v > 0);
        maxScore = positiveValues.reduce((sum, v) => sum + v, 0);
      } else {
        // Multiple/ordered without lower-bound: sum all values
        maxScore = values.reduce((sum, v) => sum + v, 0);
      }

      return maxScore;
    }
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
    templateName === 'map_response_point' ||
    templateName === 'CC2_match_basic' ||
    templateName === 'CC2_match'
  ) {
    return 1;
  }

  return null;
}
