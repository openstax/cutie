import { ResponseData, AttemptState } from '../types';

/**
 * Processes a response submission by executing response processing rules
 * from a QTI assessment item.
 *
 * This function:
 * 1. Updates response variables with submitted values
 * 2. Executes qti-response-processing rules to score the response
 * 3. Updates outcome variables (SCORE, completionStatus, numAttempts, etc.)
 * 4. Returns updated attempt state
 *
 * Response processing runs on every submission during an attempt.
 * Template variables are not modified - they remain constant.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param submission - Learner's response data (response IDs mapped to values)
 * @param currentState - Current attempt state before this submission
 * @returns Updated attempt state after processing the response
 */
export function processResponse(
  itemDoc: Document,
  submission: ResponseData,
  currentState: AttemptState
): AttemptState {
  // Create a copy of the current state's variables
  const variables: Record<string, unknown> = { ...currentState.variables };

  // Step 1: Update response variables from submission
  for (const [identifier, value] of Object.entries(submission)) {
    variables[identifier] = value;
  }

  // Step 2: Execute response processing rules
  const responseProcessing = itemDoc.getElementsByTagName('qti-response-processing')[0];

  if (responseProcessing) {
    const template = responseProcessing.getAttribute('template');

    if (template) {
      // Use standard template
      executeResponseTemplate(template, itemDoc, variables);
    } else {
      // Execute inline response processing rules
      for (let i = 0; i < responseProcessing.childNodes.length; i++) {
        const node = responseProcessing.childNodes[i];
        if (node.nodeType === 1) { // Element node
          executeResponseRule(node as Element, itemDoc, variables);
        }
      }
    }
  }

  // Step 3: Return updated state with completionStatus set to 'completed'
  return {
    variables,
    completionStatus: 'completed'
  };
}

/**
 * Execute a standard response processing template
 */
function executeResponseTemplate(
  templateUrl: string,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  // Normalize template URL to get the template name
  const templateName = templateUrl.split('/').pop()?.replace('.xml', '') || '';

  switch (templateName) {
    case 'match_correct':
    case 'CC2_match_basic':
    case 'CC2_match':
      executeMatchCorrectTemplate(itemDoc, variables);
      break;
    case 'map_response':
    case 'CC2_map_response':
      executeMapResponseTemplate(itemDoc, variables);
      break;
    case 'map_response_point':
      executeMapResponsePointTemplate(itemDoc, variables);
      break;
    default:
      // Unknown template, do nothing
      break;
  }
}

/**
 * Execute MATCH CORRECT template
 * Sets SCORE to 1 if RESPONSE matches correct value, 0 otherwise
 */
function executeMatchCorrectTemplate(itemDoc: Document, variables: Record<string, unknown>): void {
  const responseValue = variables['RESPONSE'];
  const correctValue = getCorrectResponse(itemDoc, 'RESPONSE');

  if (deepEqual(responseValue, correctValue)) {
    variables['SCORE'] = 1;
  } else {
    variables['SCORE'] = 0;
  }
}

/**
 * Execute MAP RESPONSE template
 * Maps RESPONSE value(s) to SCORE using the mapping declaration
 * If RESPONSE is null, sets SCORE to 0.0
 */
function executeMapResponseTemplate(itemDoc: Document, variables: Record<string, unknown>): void {
  const responseValue = variables['RESPONSE'];

  if (responseValue === null || responseValue === undefined) {
    variables['SCORE'] = 0.0;
    return;
  }

  const mapping = getResponseMapping(itemDoc, 'RESPONSE');
  if (!mapping) {
    variables['SCORE'] = 0.0;
    return;
  }

  let score = 0;

  // Handle single or multiple values
  if (Array.isArray(responseValue)) {
    for (const value of responseValue) {
      score += getMappedValue(value, mapping);
    }
  } else {
    score = getMappedValue(responseValue, mapping);
  }

  // Apply bounds if specified
  if (mapping.lowerBound !== null && score < mapping.lowerBound) {
    score = mapping.lowerBound;
  }
  if (mapping.upperBound !== null && score > mapping.upperBound) {
    score = mapping.upperBound;
  }

  variables['SCORE'] = score;
}

/**
 * Execute MAP RESPONSE POINT template
 * Maps point RESPONSE value(s) to SCORE using area mapping
 * If RESPONSE is null, sets SCORE to 0
 */
function executeMapResponsePointTemplate(itemDoc: Document, variables: Record<string, unknown>): void {
  const responseValue = variables['RESPONSE'];

  if (responseValue === null || responseValue === undefined) {
    variables['SCORE'] = 0;
    return;
  }

  const areaMapping = getAreaMapping(itemDoc, 'RESPONSE');
  if (!areaMapping) {
    variables['SCORE'] = 0;
    return;
  }

  let score = 0;

  // Handle single or multiple points
  if (Array.isArray(responseValue)) {
    for (const point of responseValue) {
      score += getAreaMappedValue(point, areaMapping);
    }
  } else {
    score = getAreaMappedValue(responseValue, areaMapping);
  }

  variables['SCORE'] = score;
}

/**
 * Get the correct response value from a response declaration
 */
function getCorrectResponse(itemDoc: Document, identifier: string): unknown {
  const declarations = itemDoc.getElementsByTagName('qti-response-declaration');

  for (let i = 0; i < declarations.length; i++) {
    const declaration = declarations[i];
    if (declaration.getAttribute('identifier') === identifier) {
      const correctResponse = declaration.getElementsByTagName('qti-correct-response')[0];
      if (correctResponse) {
        const cardinality = declaration.getAttribute('cardinality') || 'single';
        const baseType = declaration.getAttribute('base-type') || 'identifier';

        const valueElements = correctResponse.getElementsByTagName('qti-value');

        if (cardinality === 'single') {
          if (valueElements.length > 0) {
            return parseValue(valueElements[0].textContent || '', baseType);
          }
        } else if (cardinality === 'multiple' || cardinality === 'ordered') {
          const values: unknown[] = [];
          for (let j = 0; j < valueElements.length; j++) {
            values.push(parseValue(valueElements[j].textContent || '', baseType));
          }
          return values;
        }
      }
    }
  }

  return null;
}

/**
 * Get the response mapping from a response declaration
 */
function getResponseMapping(itemDoc: Document, identifier: string): ResponseMapping | null {
  const declarations = itemDoc.getElementsByTagName('qti-response-declaration');

  for (let i = 0; i < declarations.length; i++) {
    const declaration = declarations[i];
    if (declaration.getAttribute('identifier') === identifier) {
      const mappingElement = declaration.getElementsByTagName('qti-mapping')[0];
      if (mappingElement) {
        const defaultValue = parseFloat(mappingElement.getAttribute('default-value') || '0');
        const lowerBound = mappingElement.getAttribute('lower-bound');
        const upperBound = mappingElement.getAttribute('upper-bound');

        const mapEntries: Record<string, number> = {};
        const mapEntryElements = mappingElement.getElementsByTagName('qti-map-entry');

        for (let j = 0; j < mapEntryElements.length; j++) {
          const entry = mapEntryElements[j];
          const mapKey = entry.getAttribute('map-key');
          const mappedValue = entry.getAttribute('mapped-value');
          if (mapKey && mappedValue) {
            mapEntries[mapKey] = parseFloat(mappedValue);
          }
        }

        return {
          defaultValue,
          lowerBound: lowerBound !== null ? parseFloat(lowerBound) : null,
          upperBound: upperBound !== null ? parseFloat(upperBound) : null,
          entries: mapEntries
        };
      }
    }
  }

  return null;
}

/**
 * Get mapped value for a given response value
 */
function getMappedValue(value: unknown, mapping: ResponseMapping): number {
  const key = String(value);
  return mapping.entries[key] ?? mapping.defaultValue;
}

/**
 * Get area mapping from a response declaration
 */
function getAreaMapping(itemDoc: Document, identifier: string): AreaMapping | null {
  const declarations = itemDoc.getElementsByTagName('qti-response-declaration');

  for (let i = 0; i < declarations.length; i++) {
    const declaration = declarations[i];
    if (declaration.getAttribute('identifier') === identifier) {
      const areaMappingElement = declaration.getElementsByTagName('qti-area-mapping')[0];
      if (areaMappingElement) {
        const defaultValue = parseFloat(areaMappingElement.getAttribute('default-value') || '0');

        const areaMapEntries: AreaMapEntry[] = [];
        const entryElements = areaMappingElement.getElementsByTagName('qti-area-map-entry');

        for (let j = 0; j < entryElements.length; j++) {
          const entry = entryElements[j];
          const shape = entry.getAttribute('shape');
          const coords = entry.getAttribute('coords');
          const mappedValue = entry.getAttribute('mapped-value');

          if (shape && coords && mappedValue) {
            areaMapEntries.push({
              shape,
              coords: coords.split(',').map(c => parseFloat(c.trim())),
              mappedValue: parseFloat(mappedValue)
            });
          }
        }

        return {
          defaultValue,
          entries: areaMapEntries
        };
      }
    }
  }

  return null;
}

/**
 * Get mapped value for a point based on area mapping
 */
function getAreaMappedValue(point: unknown, areaMapping: AreaMapping): number {
  // Parse point - can be string like "100 100" or array [100, 100]
  let x: number, y: number;

  if (typeof point === 'string') {
    const parts = point.trim().split(/\s+/);
    x = parseFloat(parts[0]);
    y = parseFloat(parts[1]);
  } else if (Array.isArray(point) && point.length >= 2) {
    x = Number(point[0]);
    y = Number(point[1]);
  } else {
    return areaMapping.defaultValue;
  }

  // Check each area to see if point is inside
  for (const entry of areaMapping.entries) {
    if (isPointInArea(x, y, entry.shape, entry.coords)) {
      return entry.mappedValue;
    }
  }

  return areaMapping.defaultValue;
}

/**
 * Check if a point is inside a defined area
 */
function isPointInArea(x: number, y: number, shape: string, coords: number[]): boolean {
  switch (shape) {
    case 'circle':
      // coords: [centerX, centerY, radius]
      if (coords.length >= 3) {
        const [cx, cy, r] = coords;
        const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        return distance <= r;
      }
      return false;

    case 'rect':
      // coords: [x1, y1, x2, y2]
      if (coords.length >= 4) {
        const [x1, y1, x2, y2] = coords;
        return x >= x1 && x <= x2 && y >= y1 && y <= y2;
      }
      return false;

    case 'poly':
      // coords: [x1, y1, x2, y2, x3, y3, ...]
      // Use ray casting algorithm
      if (coords.length < 6) return false;

      let inside = false;
      for (let i = 0, j = coords.length - 2; i < coords.length; i += 2) {
        const xi = coords[i], yi = coords[i + 1];
        const xj = coords[j], yj = coords[j + 1];

        const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;

        j = i;
      }
      return inside;

    default:
      return false;
  }
}

/**
 * Execute a response processing rule
 */
function executeResponseRule(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  const localName = rule.localName;

  switch (localName) {
    case 'qti-set-outcome-value':
      executeSetOutcomeValue(rule, itemDoc, variables);
      break;
    case 'qti-response-condition':
      executeResponseCondition(rule, itemDoc, variables);
      break;
    case 'qti-exit-response':
      throw new ExitResponseError();
  }
}

/**
 * Execute qti-set-outcome-value
 */
function executeSetOutcomeValue(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // Evaluate the expression (first child element)
  for (let i = 0; i < rule.childNodes.length; i++) {
    const node = rule.childNodes[i];
    if (node.nodeType === 1) {
      const value = evaluateExpression(node as Element, itemDoc, variables);
      variables[identifier] = value;
      break;
    }
  }
}

/**
 * Execute qti-response-condition
 */
function executeResponseCondition(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  // Find response-if, response-else-if, and response-else elements
  for (let i = 0; i < rule.childNodes.length; i++) {
    const node = rule.childNodes[i];
    if (node.nodeType !== 1) continue;

    const element = node as Element;
    const localName = element.localName;

    if (localName === 'qti-response-if') {
      if (evaluateResponseIf(element, itemDoc, variables)) {
        return; // Condition was true, stop processing
      }
    } else if (localName === 'qti-response-else-if') {
      if (evaluateResponseIf(element, itemDoc, variables)) {
        return; // Condition was true, stop processing
      }
    } else if (localName === 'qti-response-else') {
      executeResponseBlock(element, itemDoc, variables);
      return;
    }
  }
}

/**
 * Evaluate a response-if or response-else-if block
 * Returns true if condition was true and block was executed
 */
function evaluateResponseIf(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  let conditionResult = false;
  let conditionEvaluated = false;

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType !== 1) continue;

    if (!conditionEvaluated) {
      // This is the condition expression
      conditionResult = evaluateExpression(node as Element, itemDoc, variables) as boolean;
      conditionEvaluated = true;
    } else {
      // These are the rules to execute if condition is true
      if (conditionResult) {
        executeResponseRule(node as Element, itemDoc, variables);
      }
    }
  }

  return conditionResult;
}

/**
 * Execute all rules in a response block (used for response-else)
 */
function executeResponseBlock(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      executeResponseRule(node as Element, itemDoc, variables);
    }
  }
}

/**
 * Evaluate an expression in response processing context
 */
function evaluateExpression(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): unknown {
  const localName = element.localName;

  switch (localName) {
    // Base values
    case 'qti-base-value':
      return evaluateBaseValue(element);
    case 'qti-null':
      return null;
    case 'qti-variable':
      return evaluateVariable(element, variables);

    // Containers
    case 'qti-multiple':
      return evaluateMultiple(element, itemDoc, variables);
    case 'qti-ordered':
      return evaluateOrdered(element, itemDoc, variables);

    // Response-specific operators
    case 'qti-correct':
      return evaluateCorrect(element, itemDoc);
    case 'qti-map-response':
      return evaluateMapResponse(element, itemDoc, variables);
    case 'qti-map-response-point':
      return evaluateMapResponsePoint(element, itemDoc, variables);

    // Boolean operators
    case 'qti-match':
      return evaluateMatch(element, itemDoc, variables);
    case 'qti-is-null':
      return evaluateIsNull(element, itemDoc, variables);
    case 'qti-and':
      return evaluateAnd(element, itemDoc, variables);
    case 'qti-or':
      return evaluateOr(element, itemDoc, variables);
    case 'qti-not':
      return evaluateNot(element, itemDoc, variables);

    // Arithmetic operators
    case 'qti-sum':
      return evaluateSum(element, itemDoc, variables);
    case 'qti-product':
      return evaluateProduct(element, itemDoc, variables);
    case 'qti-subtract':
      return evaluateSubtract(element, itemDoc, variables);
    case 'qti-divide':
      return evaluateDivide(element, itemDoc, variables);

    // Comparison operators
    case 'qti-lt':
      return evaluateLessThan(element, itemDoc, variables);
    case 'qti-gt':
      return evaluateGreaterThan(element, itemDoc, variables);
    case 'qti-lte':
      return evaluateLessThanOrEqual(element, itemDoc, variables);
    case 'qti-gte':
      return evaluateGreaterThanOrEqual(element, itemDoc, variables);

    // Container operators
    case 'qti-member':
      return evaluateMember(element, itemDoc, variables);
    case 'qti-contains':
      return evaluateContains(element, itemDoc, variables);

    default:
      return null;
  }
}

// Expression evaluators

function evaluateBaseValue(element: Element): unknown {
  const baseType = element.getAttribute('base-type');
  const text = element.textContent || '';

  if (!baseType) return text;

  return parseValue(text, baseType);
}

function evaluateVariable(element: Element, variables: Record<string, unknown>): unknown {
  const identifier = element.getAttribute('identifier');
  if (!identifier) return null;

  return variables[identifier] ?? null;
}

function evaluateMultiple(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): unknown[] {
  const values: unknown[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables));
    }
  }

  return values;
}

function evaluateOrdered(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): unknown[] {
  return evaluateMultiple(element, itemDoc, variables);
}

function evaluateCorrect(element: Element, itemDoc: Document): unknown {
  const identifier = element.getAttribute('identifier');
  if (!identifier) return null;

  return getCorrectResponse(itemDoc, identifier);
}

function evaluateMapResponse(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): number {
  const identifier = element.getAttribute('identifier') || 'RESPONSE';
  const responseValue = variables[identifier];

  if (responseValue === null || responseValue === undefined) {
    return 0.0;
  }

  const mapping = getResponseMapping(itemDoc, identifier);
  if (!mapping) {
    return 0.0;
  }

  let score = 0;

  if (Array.isArray(responseValue)) {
    for (const value of responseValue) {
      score += getMappedValue(value, mapping);
    }
  } else {
    score = getMappedValue(responseValue, mapping);
  }

  // Apply bounds
  if (mapping.lowerBound !== null && score < mapping.lowerBound) {
    score = mapping.lowerBound;
  }
  if (mapping.upperBound !== null && score > mapping.upperBound) {
    score = mapping.upperBound;
  }

  return score;
}

function evaluateMapResponsePoint(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): number {
  const identifier = element.getAttribute('identifier') || 'RESPONSE';
  const responseValue = variables[identifier];

  if (responseValue === null || responseValue === undefined) {
    return 0;
  }

  const areaMapping = getAreaMapping(itemDoc, identifier);
  if (!areaMapping) {
    return 0;
  }

  let score = 0;

  if (Array.isArray(responseValue)) {
    for (const point of responseValue) {
      score += getAreaMappedValue(point, areaMapping);
    }
  } else {
    score = getAreaMappedValue(responseValue, areaMapping);
  }

  return score;
}

function evaluateMatch(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  const values: unknown[] = [];
  const childElements: Element[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      childElements.push(node as Element);
      values.push(evaluateExpression(node as Element, itemDoc, variables));
    }
  }

  if (values.length >= 2) {
    // Check if either value comes from a qti-multiple container (unordered)
    const isFirstMultiple = childElements[0]?.localName === 'qti-multiple';
    const isSecondMultiple = childElements[1]?.localName === 'qti-multiple';

    // If either is explicitly multiple (unordered), use unordered comparison
    if (isFirstMultiple || isSecondMultiple) {
      return deepEqualUnordered(values[0], values[1]);
    }

    return deepEqual(values[0], values[1]);
  }

  return false;
}

function evaluateIsNull(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      const value = evaluateExpression(node as Element, itemDoc, variables);
      return value === null || value === undefined;
    }
  }
  return true;
}

function evaluateAnd(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      const value = evaluateExpression(node as Element, itemDoc, variables) as boolean;
      if (!value) {
        return false;
      }
    }
  }
  return true;
}

function evaluateOr(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      const value = evaluateExpression(node as Element, itemDoc, variables) as boolean;
      if (value) {
        return true;
      }
    }
  }
  return false;
}

function evaluateNot(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      const value = evaluateExpression(node as Element, itemDoc, variables) as boolean;
      return !value;
    }
  }
  return false;
}

function evaluateSum(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): number {
  let sum = 0;

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      const value = evaluateExpression(node as Element, itemDoc, variables) as number;
      if (value !== null && value !== undefined) {
        sum += value;
      }
    }
  }

  return sum;
}

function evaluateProduct(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): number {
  let product = 1;

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      const value = evaluateExpression(node as Element, itemDoc, variables) as number;
      if (value !== null && value !== undefined) {
        product *= value;
      }
    }
  }

  return product;
}

function evaluateSubtract(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): number {
  const values: number[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables) as number);
    }
  }

  return values.length >= 2 ? values[0] - values[1] : 0;
}

function evaluateDivide(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): number {
  const values: number[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables) as number);
    }
  }

  return values.length >= 2 && values[1] !== 0 ? values[0] / values[1] : 0;
}

function evaluateLessThan(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  const values: number[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables) as number);
    }
  }

  return values.length >= 2 ? values[0] < values[1] : false;
}

function evaluateGreaterThan(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  const values: number[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables) as number);
    }
  }

  return values.length >= 2 ? values[0] > values[1] : false;
}

function evaluateLessThanOrEqual(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  const values: number[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables) as number);
    }
  }

  return values.length >= 2 ? values[0] <= values[1] : false;
}

function evaluateGreaterThanOrEqual(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  const values: number[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables) as number);
    }
  }

  return values.length >= 2 ? values[0] >= values[1] : false;
}

function evaluateMember(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  const values: unknown[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables));
    }
  }

  if (values.length >= 2) {
    const value = values[0];
    const container = values[1];

    if (Array.isArray(container)) {
      return container.some(item => deepEqual(item, value));
    }
  }

  return false;
}

function evaluateContains(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
  const values: unknown[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      values.push(evaluateExpression(node as Element, itemDoc, variables));
    }
  }

  if (values.length >= 2) {
    const container = values[0];
    const value = values[1];

    if (Array.isArray(container)) {
      return container.some(item => deepEqual(item, value));
    }
  }

  return false;
}

// Helper functions

function parseValue(text: string, baseType: string): unknown {
  const trimmed = text.trim();

  switch (baseType) {
    case 'boolean':
      return trimmed === 'true';
    case 'integer':
      return parseInt(trimmed, 10);
    case 'float':
      return parseFloat(trimmed);
    case 'string':
      return trimmed;
    case 'point':
      const pointParts = trimmed.split(/\s+/);
      return trimmed; // Keep as string for processing
    case 'identifier':
      return trimmed;
    case 'directedPair':
    case 'pair':
      return trimmed;
    case 'duration':
      return parseFloat(trimmed);
    case 'file':
    case 'uri':
      return trimmed;
    default:
      return trimmed;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}

/**
 * Deep equality check for unordered containers (multiple cardinality)
 * Treats arrays as sets where order doesn't matter
 */
function deepEqualUnordered(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    // For unordered comparison, check that every item in a has a match in b
    const bCopy = [...b];
    for (const aItem of a) {
      let found = false;
      for (let i = 0; i < bCopy.length; i++) {
        if (deepEqual(aItem, bCopy[i])) {
          bCopy.splice(i, 1); // Remove matched item
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}

// Type definitions

interface ResponseMapping {
  defaultValue: number;
  lowerBound: number | null;
  upperBound: number | null;
  entries: Record<string, number>;
}

interface AreaMapping {
  defaultValue: number;
  entries: AreaMapEntry[];
}

interface AreaMapEntry {
  shape: string;
  coords: number[];
  mappedValue: number;
}

/**
 * Custom error thrown when exit-response is encountered
 */
class ExitResponseError extends Error {
  constructor() {
    super('Exit response');
    this.name = 'ExitResponseError';
  }
}
