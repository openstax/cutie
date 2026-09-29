/**
 * Processes elements with template-identifier/show-hide for conditional visibility.
 *
 * Applies to qti-template-block, qti-template-inline, and choice elements
 * (qti-simple-choice, qti-inline-choice, qti-simple-associable-choice,
 * qti-gap-text, qti-gap-img, qti-gap).
 *
 * These elements have a template-identifier attribute that should match values in template variables.
 * - If show-hide="show": element is visible only when template-identifier matches a variable value
 * - If show-hide="hide": element is hidden when template-identifier matches a variable value
 *
 * The matching is done by finding a variable (any variable) that contains the template-identifier.
 * Variables can be single values or arrays (multiple cardinality).
 *
 * Elements without a template-identifier attribute are skipped, so normal choices are unaffected.
 */
export function processTemplateConditionals(
  root: Element,
  variables: Record<string, unknown>
): void {
  // Process template-block, template-inline, and choice elements
  const templateElements = [
    ...Array.from(root.getElementsByTagName('qti-template-block')),
    ...Array.from(root.getElementsByTagName('qti-template-inline')),
    ...Array.from(root.getElementsByTagName('qti-simple-choice')),
    ...Array.from(root.getElementsByTagName('qti-inline-choice')),
    ...Array.from(root.getElementsByTagName('qti-simple-associable-choice')),
    ...Array.from(root.getElementsByTagName('qti-gap-text')),
    ...Array.from(root.getElementsByTagName('qti-gap-img')),
    ...Array.from(root.getElementsByTagName('qti-gap')),
  ];

  for (const element of templateElements) {
    const templateIdentifier = element.getAttribute('template-identifier');
    const showHide = element.getAttribute('show-hide');

    if (!templateIdentifier) continue;

    // Check if any variable contains this template identifier
    const isMatch = checkVariableContains(variables, templateIdentifier);

    // Determine if element should be removed
    let shouldRemove = false;
    if (showHide === 'show') {
      // Remove if it doesn't match
      shouldRemove = !isMatch;
    } else if (showHide === 'hide') {
      // Remove if it does match
      shouldRemove = isMatch;
    }

    if (shouldRemove) {
      element.parentNode?.removeChild(element);
    }
  }
}

/**
 * Checks if any variable in the variables object contains the given identifier.
 * Handles both single values and arrays (multiple cardinality).
 */
function checkVariableContains(
  variables: Record<string, unknown>,
  identifier: string
): boolean {
  for (const value of Object.values(variables)) {
    if (valueContains(value, identifier)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a value contains the given identifier.
 * Handles both single values and arrays.
 */
export function valueContains(value: unknown, identifier: string): boolean {
  if (Array.isArray(value)) {
    return value.includes(identifier);
  }
  return value === identifier;
}
