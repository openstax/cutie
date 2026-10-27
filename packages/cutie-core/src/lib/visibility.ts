/**
 * Visibility rules shared by rendering and judging: template-controlled
 * content (fixed for the attempt) and feedback (driven by outcomes).
 */

/**
 * Applies template-controlled visibility (QTI 3 Information Model: TemplateBlock
 * §5.145, TemplateInline §5.155, and the choices, gaps and hotspot choices that carry
 * `template-identifier`, e.g. SimpleChoice §5.132).
 *
 * `template-identifier` names a template variable, of identifier base-type and
 * single or multiple cardinality. The element's own `identifier` is compared
 * with that variable's value:
 * - `show-hide="show"` (the default): shown only if the variable matches, or
 *   contains, the identifier
 * - `show-hide="hide"`: hidden if the variable matches, or contains, the identifier
 *
 * Hidden elements are removed. Elements without `template-identifier` are left alone.
 */
export function processTemplateConditionals(
  root: Element,
  variables: Record<string, unknown>
): void {
  const templateElements = Array.from(root.getElementsByTagName('*')).filter((element) =>
    element.hasAttribute('template-identifier')
  );

  for (const element of templateElements) {
    const templateIdentifier = element.getAttribute('template-identifier') ?? '';
    const identifier = element.getAttribute('identifier') ?? '';
    const isMatch = valueContains(variables[templateIdentifier], identifier);
    const shown = element.getAttribute('show-hide') === 'hide' ? !isMatch : isMatch;

    if (!shown) {
      element.parentNode?.removeChild(element);
    }
  }
}

/**
 * Checks if a value matches, or (for multiple cardinality) contains, the given identifier.
 */
export function valueContains(value: unknown, identifier: string): boolean {
  if (Array.isArray(value)) {
    return value.includes(identifier);
  }
  return value === identifier;
}

const FEEDBACK_TAG_NAMES = ['qti-feedback-block', 'qti-feedback-inline', 'qti-modal-feedback'];

/**
 * All feedback elements (block, inline and modal) under root
 */
export function getFeedbackElements(root: Element): Element[] {
  return FEEDBACK_TAG_NAMES.flatMap((tagName) =>
    Array.from(root.getElementsByTagName(tagName))
  );
}

/**
 * Processes qti-feedback-block and qti-feedback-inline elements for conditional visibility.
 *
 * These elements have an outcome-identifier and identifier attribute.
 * - outcome-identifier: references the outcome variable to check
 * - identifier: the value to look for in that outcome variable
 * - show-hide: "show" means visible when identifier is in outcome variable,
 *              "hide" means hidden when identifier is in outcome variable
 */
export function processFeedbackVisibility(
  root: Element,
  variables: Record<string, unknown>
): void {
  for (const element of getFeedbackElements(root)) {
    const outcomeIdentifier = element.getAttribute('outcome-identifier');
    const identifier = element.getAttribute('identifier');
    const showHide = element.getAttribute('show-hide');

    if (!outcomeIdentifier || !identifier) continue;

    // Get the outcome variable value
    const outcomeValue = variables[outcomeIdentifier];

    // Check if the identifier is in the outcome variable
    const isMatch = valueContains(outcomeValue, identifier);

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
